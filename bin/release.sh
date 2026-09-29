#!/usr/bin/env bash
# bin/release.sh — PR-mandatory release helpers for @whereq/react.
#
# Two subcommands. Both respect the project's PR-only release flow:
# no local merging into main, no npm-touching — CI/release.yml owns publishing.
#
# ============================================================================
#   ship  (DEFAULT — run on a feature branch, e.g. feat/avatar)
#     1. Pre-flight: must be on a non-main branch, origin reachable
#     2. Fetch origin/main + tags
#     3. Handle BOTH scenarios and all combinations:
#          - clean tree, no unpushed            → refuse ("nothing to ship")
#          - dirty + any unpushed               → stage everything; soft-reset
#                                                 onto origin/main; collapse to
#                                                 ONE commit with default message
#                                                 (opens in $EDITOR for review)
#          - clean + N unpushed                 → squash N to 1 + push
#          - dirty + N unpushed                 → stage + squash to 1 + push
#          - clean + 1 unpushed                 → push the existing commit
#     4. Verify a .changeset/*.md exists (else refuse, instructing the user
#        to run 'pnpm changeset' first) — without a changeset the bot's
#        version PR won't open after merge.
#     5. Run the FULL local green bar via 'pnpm verify' — typecheck, lint,
#        test, build (the same 4 checks CI runs on every PR). Dies loudly
#        on any failure. Never bypassed.
#     6. Predict the next semver (informational — the bot does the bump).
#     7. Force-push with --force-with-lease (history was rewritten).
#     8. Print the PR URL — DEVELOPER opens the PR manually on GitHub.
#
#   tag   (run on main, AFTER the bot's "version packages" PR is merged)
#     - Confirm main is in sync with origin/main
#     - Derive v<semver> from package.json (single source of truth)
#     - Refuse if the tag already exists locally or on origin
#     - Create an ANNOTATED tag (`git tag -a`) with a real message
#     - Push only the tag (main is already on origin via the version PR merge)
#     - With --release: also `gh release create --generate-notes` for the
#       GitHub Release page (one-shot, all-in-one)
#
# ============================================================================
# What this script NEVER does (deliberate boundaries)
#   - merges into main locally        (PR UI owns merging)
#   - opens pull requests             (developer opens them manually on github.com)
#   - touches npm / the registry      (CI owns publishing)
#   - invents a version               (every tag is derived from package.json)
#   - force-pushes without --force-with-lease   (always safe)
#   - creates lightweight tags         (lightweight is changesets publish's job)
#
# ============================================================================
# Tag strategy (best practice)
# ----------------------------
#   - Tag ONLY main. Tags are immutable; feature branches move.
#   - Annotated tag only (`git tag -a vX.Y.Z -m "..."`).
#   - Tag is DERIVED from `package.json#version`, never typed by hand.
#   - Don't reuse tags. Need to fix a release? Cut v0.4.2.
#   - Don't add prefixes like `release-v0.1.0`; `v0.1.0` IS the release tag.
#   - Pre-releases: `v0.5.0-rc.1`, `v1.0.0-beta.2`; npm dist-tag = `next`.
#
# ============================================================================
# Usage
#   bin/release.sh                          # ship: stage + squash + verify + push
#   bin/release.sh ship [--dry-run] [--yes]
#   bin/release.sh tag   [--dry-run] [--yes] [--release]
#   bin/release.sh --help
#
# Required: bash ≥ 4, git ≥ 2.20, pnpm 9, node ≥ 18.

set -euo pipefail

# ---------------------------------------------------------------------------
# constants
# ---------------------------------------------------------------------------
readonly SCRIPT_NAME="${BASH_SOURCE[0]##*/}"
readonly SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly REPO_ROOT="$(git -C "$SCRIPT_DIR" rev-parse --show-toplevel)"
readonly MAIN_BRANCH="main"
readonly PACKAGE_JSON="$REPO_ROOT/package.json"

# ---------------------------------------------------------------------------
# state
# ---------------------------------------------------------------------------
DRY_RUN=false
ASSUME_YES=false
SUBCOMMAND=""
TAG_RELEASE=false

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
log()  { printf '%s\n' "→ $*"; }
warn() { printf '%s\n' "⚠ $*" >&2; }
err()  { printf '%s\n' "✗ $*" >&2; }
die()  { err "$*"; exit 1; }

confirm() {
  if $ASSUME_YES; then return 0; fi
  local prompt="${1:-Continue?}"
  local reply
  read -r -p "$prompt [y/N] " reply
  [[ "$reply" =~ ^[Yy]([Ee][Ss])?$ ]]
}

run() {
  if $DRY_RUN; then
    log "  [dry-run] $*"
  else
    "$@"
  fi
}

# Compute a usable web URL for this repo. Handles:
#   - https://github.com/owner/repo.git       → https://github.com/owner/repo
#   - git@github.com:owner/repo.git           → https://github.com/owner/repo
#   - git@gh-wq:owner/repo.git (custom SSH)    → https://github.com/owner/repo
#                                             (prefers `gh` when authenticated)
repo_url() {
  if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
    gh repo view --json url -q '.url' 2>/dev/null && return
  fi
  local url
  url=$(git -C "$REPO_ROOT" config --get remote.origin.url)
  case "$url" in
    https://github.com/*) echo "${url%.git}" ;;
    https://*)            echo "${url%.git}" ;;
    git@github.com:*)     echo "https://github.com/${url#git@github.com:}" | sed -E 's/\.git$//' ;;
    ssh://git@github.com/*) echo "${url%.git}" | sed -E 's#ssh://git@#https://#' ;;
    *)
      # Custom SSH alias (e.g. 'gh-wq:owner/repo'). Best-effort heuristic:
      # if the host part looks like a domain (contains a dot), use it; else
      # the user probably configured the alias for github.com → emit that.
      local rest="${url#git@}"
      rest="${rest#ssh://}"
      rest="${rest%.git}"
      local host="${rest%%:*}"
      local path="${rest#*:}"
      if [[ "$host" == *.* ]]; then
        echo "https://${host}/${path}"
      else
        echo "https://github.com/${path}"
      fi
      ;;
  esac
}

# owner/repo from origin URL, e.g. "whereq/whereq-react".
repo_path() {
  local url
  url=$(git -C "$REPO_ROOT" config --get remote.origin.url)
  url="${url#https://}"
  url="${url#git@}"
  url="${url#ssh://git@}"
  url="${url#ssh://}"
  url="${url%.git}"
  url="${url/:/\/}"        # first colon → slash (GH web URL format)
  echo "${url#*/}"          # drop host segment
}

require_origin() {
  git -C "$REPO_ROOT" remote get-url origin >/dev/null 2>&1 \
    || die "No 'origin' remote configured."
}

current_branch() {
  git -C "$REPO_ROOT" symbolic-ref --short HEAD 2>/dev/null \
    || die "Detached HEAD. Switch to a feature branch first."
}

# Detect conventional-commit type from branch name prefix
# (feat/avatar-cool → feat, fix/auth-bug → fix, refactor/* → refactor, etc.).
derive_branch_intent() {
  local branch="$1"
  local type_="feat"
  local scope="${branch#*/}"

  case "$branch" in
    feat/*|feat-*)         type_="feat"     ;;
    fix/*|fix-*)           type_="fix"      ;;
    chore/*|chore-*)       type_="chore"    ;;
    docs/*|docs-*)         type_="docs"     ;;
    refactor/*|refactor-*) type_="refactor" ;;
    perf/*|perf-*)         type_="perf"     ;;
    test/*|test-*)         type_="test"     ;;
    build/*|build-*)       type_="build"    ;;
    ci/*|ci-*)             type_="ci"       ;;
    style/*|style-*)       type_="style"    ;;
  esac

  printf '%s(%s)' "$type_" "$scope"
}

# Default commit message: if HEAD is already 1 commit ahead of origin,
# preserve that commit's subject. Otherwise synthesise "feat(<scope>): pending
# changes". The user reviews / edits this in $EDITOR before the commit lands.
build_default_commit_msg() {
  local branch="$1"
  local intent
  intent=$(derive_branch_intent "$branch")

  local prev_subject
  prev_subject=$(git -C "$REPO_ROOT" log -1 --pretty='%s' 2>/dev/null || true)

  if [[ -n "$prev_subject" && "$prev_subject" != *"pending changes"* ]]; then
    printf '%s' "$prev_subject"
  else
    printf '%s' "${intent}: pending changes"
  fi
}

changeset_exists() {
  [[ -d "$REPO_ROOT/.changeset" ]] || return 1
  local n
  n=$(find "$REPO_ROOT/.changeset" -maxdepth 1 -type f -name '*.md' \
        ! -name 'README.md' ! -name 'config.json' 2>/dev/null | wc -l | tr -d ' ')
  [[ "$n" -gt 0 ]]
}

# Predict the next semver the changesets bot will commit to package.json.
# - Reads current version from package.json.
# - Reads declared bump (patch|minor|major) from each .changeset/*.md.
# - Takes the highest bump present.
predict_next_version() {
  local current
  current=$(node -e "process.stdout.write(require('$PACKAGE_JSON').version)")

  local base="${current%%-*}"
  local prerelease=""
  if [[ "$current" == *-* ]]; then
    prerelease="-${current#*-}"
  fi

  local major minor patch
  IFS='.' read -r major minor patch <<< "$base"

  local bump="patch"   # default if no changesets / nothing declared
  while IFS= read -r cs; do
    [[ -z "$cs" ]] && continue
    local cbump
    cbump=$(grep -oE "(patch|minor|major)" "$cs" 2>/dev/null | head -1 || true)
    case "$cbump" in
      major) bump="major" ;;
      minor) [[ "$bump" != "major" ]] && bump="minor" ;;
    esac
  done < <(find "$REPO_ROOT/.changeset" -maxdepth 1 -type f -name '*.md' \
            ! -name 'README.md' ! -name 'config.json' 2>/dev/null | sort)

  case "$bump" in
    major) echo "$((major+1)).0.0${prerelease}" ;;
    minor) echo "${major}.$((minor+1)).0${prerelease}" ;;
    *)     echo "${major}.${minor}.$((patch+1))${prerelease}" ;;
  esac
}

# Best-effort editor: prefer $EDITOR; fall back to vi/nano; else commit with no edit.
open_editor_for_commit() {
  local msg="$1"
  if [[ -n "${EDITOR:-}" ]] && command -v "${EDITOR%% *}" >/dev/null 2>&1; then
    git -C "$REPO_ROOT" commit -e -m "$msg"
  elif command -v vi >/dev/null 2>&1; then
    EDITOR=vi git -C "$REPO_ROOT" commit -e -m "$msg"
  elif command -v nano >/dev/null 2>&1; then
    EDITOR=nano git -C "$REPO_ROOT" commit -e -m "$msg"
  else
    warn "No \$EDITOR/vi/nano found — committing with default message, no edit opportunity."
    git -C "$REPO_ROOT" commit -m "$msg"
  fi
}

# ---------------------------------------------------------------------------
# usage / arg parsing
# ---------------------------------------------------------------------------
usage() {
  sed -n '2,/^set -euo pipefail/{/^set -euo pipefail/d; p;}' "$0" \
    | sed 's/^# \{0,1\}//'
  exit 0
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage ;;
    --dry-run) DRY_RUN=true; shift ;;
    --yes|-y)  ASSUME_YES=true; shift ;;
    ship)
      if [[ -n "$SUBCOMMAND" ]]; then die "Specify only one subcommand."; fi
      SUBCOMMAND="ship"; shift ;;
    tag)
      if [[ -n "$SUBCOMMAND" ]]; then die "Specify only one subcommand."; fi
      SUBCOMMAND="tag"; shift
      # --release is tag-only
      while [[ $# -gt 0 && "$1" == --release ]]; do
        TAG_RELEASE=true; shift
      done
      ;;
    *)
      # First non-flag arg is the subcommand; if missing or unknown,
      # default to "ship" (developer convenience).
      if [[ -z "$SUBCOMMAND" ]]; then
        SUBCOMMAND="ship"; shift
      else
        die "Unknown argument: $1"
      fi
      ;;
  esac
done

[[ -n "$SUBCOMMAND" ]] || SUBCOMMAND="ship"

# ===========================================================================
# subcommand: ship (default) — feature branch → stage + squash + push
# ===========================================================================
cmd_ship() {
  cd "$REPO_ROOT"
  log "release.sh: ship  (this is the developer-side prep; the PR is opened manually on GitHub)"

  require_origin

  local branch
  branch=$(current_branch)
  if [[ "$branch" == "$MAIN_BRANCH" ]]; then
    die "Run 'ship' on a feature branch, not $MAIN_BRANCH. Switch with: git checkout -b feat/<name>"
  fi
  log "  branch: $branch"

  # Fetch origin/main + tags so all base comparisons are real
  log "Fetching origin + tags"
  if ! git fetch --prune --tags origin "$MAIN_BRANCH" 2>/dev/null; then
    die "Could not fetch origin/$MAIN_BRANCH. Aborting so we don't double-publish."
  fi

  if ! git rev-parse --quiet --verify "origin/$MAIN_BRANCH" >/dev/null; then
    die "origin/$MAIN_BRANCH does not exist on origin."
  fi

  # Snapshot what we have BEFORE we modify anything
  local ahead
  ahead=$(git rev-list --count "origin/$MAIN_BRANCH..$branch")
  local is_dirty
  if ! git diff --quiet HEAD \
     || ! git diff --cached --quiet HEAD \
     || [[ -n "$(git ls-files --others --exclude-standard)" ]]; then
    is_dirty=true
  else
    is_dirty=false
  fi
  log "  unpushed commits on $branch: $ahead"
  if $is_dirty; then
    log "  working tree:               dirty"
  else
    log "  working tree:               clean"
  fi

  # Refuse if there's literally nothing to ship
  if ! $is_dirty && [[ "$ahead" -eq 0 ]]; then
    die "Nothing to ship. Make some changes or commits first."
  fi

  # ── Step 1: stage everything if dirty ───────────────────────────────
  if $is_dirty; then
    log "Staging all uncommitted changes"
    run git add -A
  fi

  # ── Step 2: squash all unpushed commits + any staged changes into ONE ──
  # We soft-reset to origin/main so the entire delta (unpushed commits +
  # just-staged dirty changes) is staged as one big change. We then commit
  # once with a default message that opens in $EDITOR for review/editing.
  if $is_dirty; then
    log "Collapsing $((ahead + 1)) commit(s) (N unpushed + dirty changes) into one clean commit"
  else
    log "Collapsing $ahead commit(s) (unpushed only) into one clean commit"
  fi
  if ! $DRY_RUN; then
    git reset --soft "origin/$MAIN_BRANCH"
  else
    log "  [dry-run] git reset --soft origin/$MAIN_BRANCH"
  fi

  # Build a sensible default message and let the developer edit it
  local default_msg
  default_msg=$(build_default_commit_msg "$branch")

  log "Default commit message (opens in \$EDITOR for review):"
  log "────────────────────────────────────────────────────────"
  printf '%s\n' "$default_msg"
  log "────────────────────────────────────────────────────────"

  if ! confirm "Commit with this message (edit in \$EDITOR if you want)?"; then
    log "Aborted. No commit was made. Nothing pushed."
    exit 0
  fi

  if ! $DRY_RUN; then
    open_editor_for_commit "$default_msg"
  else
    log "  [dry-run] \$EDITOR $default_msg + git commit"
  fi

  # Sanity check: confirm we now have exactly 1 unpushed commit (skipped in dry-run)
  if ! $DRY_RUN; then
    local new_ahead
    new_ahead=$(git rev-list --count "origin/$MAIN_BRANCH..$branch")
    if [[ "$new_ahead" -ne 1 ]]; then
      die "Expected exactly 1 unpushed commit after squash; got $new_ahead. 'git log origin/$MAIN_BRANCH..HEAD' will show what happened."
    fi
  fi
  log "  ✓ one clean commit on $branch:"
  log "      $(git log -1 --pretty='%h  %s')"

  # ── Step 3: ensure a changeset exists ──────────────────────────────
  if ! changeset_exists; then
    warn "No .changeset/*.md found on this branch."
    if confirm "Run 'pnpm changeset' now? (you'll pick patch/minor/major and write a summary)"; then
      run pnpm changeset
      if ! changeset_exists; then
        die "Still no .changeset/*.md. The bot's version PR won't open after merge. Add one with 'pnpm changeset' before pushing."
      fi
    else
      die "Aborting. Without a changeset, the bot won't open a version PR. Run 'pnpm changeset' first, then re-run this script."
    fi
  else
    log "Changesets on this branch:"
    while IFS= read -r cs; do
      [[ -z "$cs" ]] && continue
      local cbump
      cbump=$(grep -oE "(patch|minor|major)" "$cs" 2>/dev/null | head -1 || echo "?")
      log "  - $(basename "$cs"): $cbump"
    done < <(find "$REPO_ROOT/.changeset" -maxdepth 1 -type f -name '*.md' \
              ! -name 'README.md' ! -name 'config.json' 2>/dev/null | sort)
  fi

  # ── Step 4: predict next version (informational) ───────────────────
  local next_version
  next_version=$(predict_next_version)
  log "→ Next release: v$next_version  (derived from package.json + changesets)"

  # ── Step 5: green bar — exactly matches CI's 4 checks ───────────────
  # `pnpm verify` runs the same 4 checks CI runs on every PR:
  #   1. typecheck (tsc --noEmit)
  #   2. lint      (eslint . --max-warnings 0)
  #   3. test      (vitest run)
  #   4. build     (tsup + prepend use-client)
  # Running these locally before push is what makes "I pushed → CI failed" impossible.
  log "Local green bar (matches CI exactly: typecheck · lint · test · build)"
  if ! $DRY_RUN; then
    if pnpm verify; then
      log "  typecheck ✓  lint ✓  test ✓  build ✓"
    else
      die "Local green bar failed. Fix the failure above (or run 'pnpm verify' to see it yourself) and re-run 'bin/release.sh ship'. Never bypass — the whole point of this script is that what's green here is green in CI."
    fi
  else
    log "  [dry-run] pnpm verify"
  fi

  # ── Step 6: push (history was rewritten → --force-with-lease) ───────
  if ! confirm "Push $branch to origin with --force-with-lease?"; then
    log "Aborted before push. Local state is 1 commit on $branch."
    exit 0
  fi
  log "Pushing $branch (--force-with-lease because we rewrote history)"
  run git push --force-with-lease origin "$branch"

  # ── Step 7: tell the developer how to open the PR manually ──────────
  local path url
  path=$(repo_path)
  url="https://github.com/${path}/compare/${MAIN_BRANCH}...${branch}"

  cat <<EOF

✓ Pushed 1 clean commit to origin/$branch.

On GitHub, open the PR yourself at:

  ${url}

  Title suggestion:
    $(git log -1 --pretty='%s')

  Body (you can edit on github.com):
    (whatever you want — the commit message is fine for \`gh pr create --fill\`,
     but this script doesn't create the PR for you; that's your call)

Then on GitHub (after you create + merge the PR):
  1. The changesets bot opens "release: version packages" (bumps to v$next_version)
  2. You review the CHANGELOG diff and merge that PR
  3. release.yml runs → publishes @whereq/react@$next_version to npm (creates a
     lightweight v$next_version tag automatically via changesets publish)

If you later want an annotated tag + GitHub Release page:
  bin/release.sh tag --release    # run on main, AFTER the version PR is merged

EOF
}

# ===========================================================================
# subcommand: tag — on main AFTER merge, for annotated tag + Release page
# ===========================================================================
cmd_tag() {
  cd "$REPO_ROOT"
  log "release.sh: tag  (run on main AFTER the bot's 'version packages' PR is merged)"

  require_clean_tree() {
    if ! git -C "$REPO_ROOT" diff --quiet HEAD \
       || ! git -C "$REPO_ROOT" diff --cached --quiet HEAD \
       || [[ -n "$(git -C "$REPO_ROOT" ls-files --others --exclude-standard)" ]]; then
      die "Working tree is dirty. Commit / stash / discard first."
    fi
  }
  require_clean_tree
  require_origin

  local branch
  branch=$(current_branch)
  if [[ "$branch" != "$MAIN_BRANCH" ]]; then
    die "Run 'tag' on $MAIN_BRANCH, not '$branch'. Switch with: git checkout $MAIN_BRANCH"
  fi
  log "  branch: $branch (clean)"

  log "Fetching origin + tags"
  if ! git fetch --prune --tags origin "$MAIN_BRANCH" 2>/dev/null; then
    die "Could not fetch origin/$MAIN_BRANCH."
  fi

  if ! git rev-parse --quiet --verify "origin/$MAIN_BRANCH" >/dev/null; then
    die "origin/$MAIN_BRANCH does not exist on origin."
  fi
  local ahead behind
  ahead=$(git rev-list --count "origin/$MAIN_BRANCH..$MAIN_BRANCH")
  behind=$(git rev-list --count "$MAIN_BRANCH..origin/$MAIN_BRANCH")
  if [[ "$ahead" -ne 0 || "$behind" -ne 0 ]]; then
    die "Local $MAIN_BRANCH is out of sync with origin/$MAIN_BRANCH (ahead=$ahead behind=$behind). Run 'git pull' first."
  fi
  log "  $MAIN_BRANCH is in sync with origin/$MAIN_BRANCH @ $(git rev-parse --short HEAD)"

  # Derive the tag from package.json — single source of truth.
  local version
  version=$(node -e "process.stdout.write(require('$PACKAGE_JSON').version)")
  [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.-]+)?$ ]] \
    || die "package.json version '$version' is not a valid semver."

  local tag="v$version"

  # Refuse if already tagged (locally or on origin)
  if git rev-parse "$tag" >/dev/null 2>&1; then
    die "Tag $tag already exists locally. Did you double-run?"
  fi
  if git ls-remote --tags origin 2>/dev/null | awk '{print $2}' | grep -Fxq "refs/tags/$tag"; then
    die "Tag $tag already exists on origin. Either npm got there first or bump the version."
  fi

  log "About to tag"
  log "  HEAD:                $(git rev-parse --short HEAD)"
  log "  package.json version: $version"
  log "  tag (will create):   $tag (annotated)"
  log "  tagger:              $(git config user.name) <$(git config user.email)>"

  if ! confirm "Create and push $tag?"; then
    log "Aborted. Nothing was tagged or pushed."
    exit 0
  fi

  local message="Release $tag

Published by ${SCRIPT_NAME}.
See CHANGELOG.md for what changed since the last tag."

  run git tag -a "$tag" -m "$message"
  log "Pushing $tag (main is already on origin)"
  run git push origin "refs/tags/$tag"

  # Optional GitHub Release
  if $TAG_RELEASE; then
    if command -v gh >/dev/null 2>&1 && gh auth status >/dev/null 2>&1; then
      log "Creating GitHub Release for $tag…"
      run gh release create "$tag" --title "$tag" --generate-notes
    else
      warn "--release requested but gh CLI not available/authenticated; skipping GitHub Release creation."
    fi
  fi

  local url
  url=$(repo_url)
  cat <<EOF

✓ Tagged $tag ($version)
  - tag:    $url/releases/tag/$tag
  - commit: $(git rev-parse --short HEAD)

EOF
}

# ---------------------------------------------------------------------------
# dispatch
# ---------------------------------------------------------------------------
case "$SUBCOMMAND" in
  ship) cmd_ship ;;
  tag)  cmd_tag ;;
  *)
    die "Unknown subcommand: $SUBCOMMAND (use 'ship' or 'tag')"
    ;;
esac
