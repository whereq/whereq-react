#!/usr/bin/env bash
# bin/release.sh — PR-mandatory release helpers for @whereq/react.
#
# Two subcommands. Both respect the project's PR-only release flow:
# no local merging into main, no npm-touching — CI/release.yml owns publishing.
#
# ============================================================================
#   prepare  (run on a feature branch, NEVER on main)
#     1.  preflight: clean tree, on a feature branch, origin reachable
#     2.  fetch origin + tags
#     3.  show how many commits ahead of origin/main (the "local commit pile")
#     4.  (optional) interactively squash all of them into ONE clean commit
#     5.  rebase the branch onto origin/main
#     6.  verify a .changeset/*.md exists; offer to run `pnpm changeset`
#     7.  PREDICT the next version by parsing the changesets + package.json
#     8.  run the local green bar (typecheck · lint · test)
#     9.  PUSH to origin (--force-with-lease if the branch already exists)
#    10.  CREATE the PR with `gh pr create --fill` (auto-fills title/body)
#    11.  print the post-merge checklist (bot version PR, npm publish, etc.)
#
#   tag      (run on main, AFTER the bot's "version packages" PR is merged)
#     1.  confirm main is in sync with origin
#     2.  derive v<semver> from package.json (single source of truth)
#     3.  refuse if the tag already exists locally or on origin
#     4.  create an ANNOTATED tag (`git tag -a`) with a real message
#     5.  push the tag (NOT main — main is already pushed by the version PR)
#     6.  (optional) `gh release create --generate-notes` for the GitHub page
#
# What this script NEVER does (deliberately):
#   - merges into main locally (the PR UI owns merging)
#   - touches npm / the registry / any credentials (CI owns publishing)
#   - invents a version (every tag is derived from package.json)
#   - creates lightweight tags (releases must be annotated)
#   - force-pushes without --force-with-lease (always safe)
#
# Tag strategy (best practice)
# ----------------------------
#   - Tag ONLY main. Tags are immutable; feature branches move.
#   - Use `v<semver>` annotated tags (`git tag -a v0.1.0 -m "..."`).
#   - The tag is DERIVED from `package.json#version`, never typed by hand.
#     Mismatch fails immediately — package.json is the source of truth.
#   - Don't reuse tags. Need to fix a release? Cut v0.1.1.
#   - Don't add prefixes like `release-v0.1.0`; v0.1.0 IS the release tag.
#   - Pre-releases: `v0.2.0-rc.1`, `v1.0.0-beta.2`; npm dist-tag = `next`.
#
# Usage
# -----
#   bin/release.sh prepare [--dry-run] [--yes] [--no-squash] [--no-push] [--no-pr]
#   bin/release.sh tag     [--dry-run] [--yes] [--no-push] [--release]
#   bin/release.sh --help
#
# Required: bash ≥ 4, git ≥ 2.20, pnpm 9, node ≥ 18, gh CLI (for PR / Release).

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
PREPARE_FLAGS=()
TAG_FLAGS=()

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
log()  { printf '%s\n' "→ $*"; }
warn() { printf '%s\n' "⚠ $*" >&2; }
err()  { printf '%s\n' "✗ $*" >&2; }
die()  { err "$*"; exit 1; }

# A confirmation prompt that respects --yes (so the script is automatable).
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

run_ok() {
  if $DRY_RUN; then log "  [dry-run] $*"; return 0; fi
  "$@"
}

repo_url() {
  git -C "$REPO_ROOT" config --get remote.origin.url \
    | sed -E 's#^(git@|https://)github\.com[:/]#https://github.com/#; s#\.git$##'
}

require_clean_tree() {
  if ! git -C "$REPO_ROOT" diff --quiet HEAD \
     || ! git -C "$REPO_ROOT" diff --cached --quiet HEAD \
     || [[ -n "$(git -C "$REPO_ROOT" ls-files --others --exclude-standard)" ]]; then
    die "Working tree is dirty. Commit / stash / discard first."
  fi
}

require_origin() {
  git -C "$REPO_ROOT" remote get-url origin >/dev/null 2>&1 \
    || die "No 'origin' remote configured."
}

current_branch() {
  git -C "$REPO_ROOT" symbolic-ref --short HEAD 2>/dev/null \
    || die "Detached HEAD. Switch to a branch first."
}

changeset_exists() {
  [[ -d "$REPO_ROOT/.changeset" ]] || return 1
  local n
  n=$(find "$REPO_ROOT/.changeset" -maxdepth 1 -type f -name '*.md' \
        ! -name 'README.md' ! -name 'config.json' 2>/dev/null | wc -l | tr -d ' ')
  [[ "$n" -gt 0 ]]
}

list_changesets() {
  find "$REPO_ROOT/.changeset" -maxdepth 1 -type f -name '*.md' \
    ! -name 'README.md' ! -name 'config.json' 2>/dev/null | sort
}

has_flag() {
  local flag="$1"
  case "$SUBCOMMAND" in
    prepare) [[ " ${PREPARE_FLAGS[*]} " == *" $flag "* ]] ;;
    tag)     [[ " ${TAG_FLAGS[*]} " == *" $flag "* ]] ;;
  esac
}

# Predict the next version that the changesets bot will commit to package.json.
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

  local bump="patch"  # default if no changesets / nothing declared
  while IFS= read -r cs; do
    [[ -z "$cs" ]] && continue
    local cbump
    cbump=$(grep -oE "(patch|minor|major)" "$cs" 2>/dev/null | head -1 || true)
    case "$cbump" in
      major) bump="major" ;;
      minor) [[ "$bump" != "major" ]] && bump="minor" ;;
    esac
  done < <(list_changesets)

  case "$bump" in
    major) echo "$((major+1)).0.0${prerelease}" ;;
    minor) echo "${major}.$((minor+1)).0${prerelease}" ;;
    *)     echo "${major}.${minor}.$((patch+1))${prerelease}" ;;
  esac
}

# ---------------------------------------------------------------------------
# usage / arg parsing
# ---------------------------------------------------------------------------
usage() {
  sed -n '2,/^set -euo pipefail/{/^set -euo pipefail/d; p;}' "$0" \
    | sed 's/^# \{0,1\}//'
  exit 0
}

usage_or_die() {
  sed -n '2,/^set -euo pipefail/{/^set -euo pipefail/d; p;}' "$0" \
    | sed 's/^# \{0,1\}//' >&2
  printf '\n✗ Specify a subcommand: prepare | tag\n' >&2
  exit 2
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h) usage ;;
    --dry-run) DRY_RUN=true; shift ;;
    --yes|-y) ASSUME_YES=true; shift ;;
    prepare|tag)
      if [[ -n "$SUBCOMMAND" ]]; then die "Specify only one subcommand."; fi
      SUBCOMMAND="$1"; shift
      # Collect subcommand-specific flags until the next non-flag token.
      while [[ $# -gt 0 && "$1" == --* ]]; do
        case "$SUBCOMMAND:$1" in
          prepare:--no-squash) PREPARE_FLAGS+=(--no-squash); shift ;;
          prepare:--no-push)   PREPARE_FLAGS+=(--no-push);   shift ;;
          prepare:--no-pr)     PREPARE_FLAGS+=(--no-pr);     shift ;;
          tag:--no-push)       TAG_FLAGS+=(--no-push);       shift ;;
          tag:--release)       TAG_FLAGS+=(--release);       shift ;;
          *) break ;;  # unknown / wrong-subcommand flag: let outer loop see it
        esac
      done
      ;;
    *) printf '✗ unknown arg: %s\n' "$1" >&2; exit 2 ;;
  esac
done

[[ -n "$SUBCOMMAND" ]] || usage_or_die

# ===========================================================================
# subcommand: prepare
# ===========================================================================
cmd_prepare() {
  cd "$REPO_ROOT"
  log "release.sh: prepare"

  require_clean_tree
  require_origin

  local branch
  branch=$(current_branch)
  if [[ "$branch" == "$MAIN_BRANCH" ]]; then
    die "Run 'prepare' on a feature branch, not $MAIN_BRANCH. Switch with: git checkout -b feat/<name>"
  fi
  log "  branch: $branch (clean)"

  # ----- 2. fetch --------------------------------------------------------
  log "Fetching origin + tags"
  if ! run_ok git fetch --prune --tags origin "$MAIN_BRANCH" "$branch"; then
    run_ok git fetch --prune --tags origin "$MAIN_BRANCH" \
      || die "Could not fetch origin/$MAIN_BRANCH."
  fi

  if ! git rev-parse --quiet --verify "origin/$MAIN_BRANCH" >/dev/null; then
    die "origin/$MAIN_BRANCH does not exist yet."
  fi

  # ----- 3. show local commit pile --------------------------------------
  local ahead
  ahead=$(git rev-list --count "origin/$MAIN_BRANCH..$branch")
  log "  $branch is $ahead commit(s) ahead of origin/$MAIN_BRANCH"

  if [[ "$ahead" -eq 0 ]]; then
    warn "No commits to release on this branch."
    if ! confirm "Continue anyway? "; then exit 0; fi
  fi

  # ----- 4. squash (optional) --------------------------------------------
  if [[ "$ahead" -gt 1 ]] && ! has_flag --no-squash; then
    log "Multiple commits on this branch — squash them into one clean commit?"
    log "  (this opens your editor with 'git rebase -i origin/$MAIN_BRANCH'."
    log "   Mark each commit after the first as 'squash' or 'fixup', then save & quit.)"
    if confirm "Squash via interactive rebase? "; then
      if ! $DRY_RUN; then
        GIT_SEQUENCE_EDITOR="${GIT_SEQUENCE_EDITOR:-${EDITOR:-vi}}" \
          git rebase -i "origin/$MAIN_BRANCH" \
          || die "Rebase failed or was aborted. Run 'git rebase --abort' to undo, then retry."
        ahead=$(git rev-list --count "origin/$MAIN_BRANCH..$branch")
        log "  Now $ahead commit(s) ahead of origin/$MAIN_BRANCH"
      fi
    fi
  fi

  # ----- 5. rebase onto origin/main -------------------------------------
  local behind
  behind=$(git rev-list --count "$branch..origin/$MAIN_BRANCH")
  if [[ "$behind" -gt 0 ]]; then
    log "origin/$MAIN_BRANCH is $behind commit(s) ahead of $branch"
    if confirm "Rebase $branch onto origin/$MAIN_BRANCH? "; then
      run git rebase "origin/$MAIN_BRANCH"
    fi
  else
    log "$branch is up to date with origin/$MAIN_BRANCH"
  fi

  # ----- 6. ensure a changeset exists -----------------------------------
  if ! changeset_exists; then
    warn "No .changeset/*.md found on this branch."
    if confirm "Run 'pnpm changeset' to record what changed? "; then
      run pnpm changeset
    else
      warn "Proceeding without a changeset — the bot's 'Version Packages' PR won't open after merge."
    fi
  else
    log "Changesets on this branch:"
    while IFS= read -r cs; do
      [[ -z "$cs" ]] && continue
      local cbump
      cbump=$(grep -oE "(patch|minor|major)" "$cs" 2>/dev/null | head -1 || echo "?")
      log "  - $(basename "$cs"): $cbump"
    done < <(list_changesets)
  fi

  # ----- 7. predict next version ----------------------------------------
  local next_version
  next_version=$(predict_next_version)
  log "→ Next release will be: v$next_version  (highest declared bump applied to current $next_version)"

  # ----- 8. green bar ----------------------------------------------------
  log "Local green bar (matches CI: typecheck · lint · test)"
  if ! $DRY_RUN; then
    pnpm typecheck && log "  typecheck ✓" || die "typecheck failed — fix and re-run."
    pnpm lint      && log "  lint      ✓" || die "lint failed — fix and re-run."
    pnpm test      && log "  test      ✓" || die "test failed — fix and re-run."
  else
    log "  [dry-run] pnpm typecheck && pnpm lint && pnpm test"
  fi

  # ----- 9. push ---------------------------------------------------------
  if ! has_flag --no-push; then
    if git rev-parse --verify "origin/$branch" >/dev/null 2>&1; then
      log "origin/$branch already exists — will update with --force-with-lease"
      if confirm "Force-push $branch to origin? "; then
        run git push --force-with-lease origin "$branch"
      fi
    else
      log "origin/$branch doesn't exist — will push as a new branch with -u"
      if confirm "Push $branch to origin? "; then
        run git push -u origin "$branch"
      fi
    fi
  fi

  # ----- 10. create PR ---------------------------------------------------
  if ! has_flag --no-pr; then
    if ! command -v gh >/dev/null 2>&1; then
      warn "gh CLI not installed — create the PR manually:"
      log "  gh pr create --base $MAIN_BRANCH --head $branch --fill"
    elif ! gh auth status >/dev/null 2>&1; then
      warn "gh not authenticated — run 'gh auth login' then re-run, or create the PR manually."
    else
      local existing
      existing=$(gh pr list --head "$branch" --base "$MAIN_BRANCH" --state open \
                  --json number -q '.[0].number' 2>/dev/null || echo "")
      if [[ -n "$existing" ]]; then
        log "An open PR #$existing already exists for $branch — leaving it as-is."
      else
        log "Opening PR with 'gh pr create --fill' (auto-fills title/body from commits)…"
        if confirm "Create PR now? "; then
          if ! $DRY_RUN; then
            gh pr create --base "$MAIN_BRANCH" --head "$branch" --fill
          fi
        fi
      fi
    fi
  fi

  # ----- 11. post-merge instructions -------------------------------------
  cat <<EOF

✓ $branch is ready (or was just pushed + PR opened).

Next on GitHub:
  1. Reviewers approve the PR you opened; merge it.
  2. The changesets bot opens "release: version packages" (bumps to v$next_version).
  3. You review the CHANGELOG diff and merge that PR.
  4. release.yml runs → publishes @whereq/react@$next_version to npm.

Then, on main:
  bin/release.sh tag       # annotated tag + push (optional, for git-tag purists)
  bin/release.sh tag --release   # also creates a GitHub Release page

EOF
}

# ===========================================================================
# subcommand: tag
# ===========================================================================
cmd_tag() {
  cd "$REPO_ROOT"
  log "release.sh: tag"

  require_clean_tree
  require_origin

  local branch
  branch=$(current_branch)
  if [[ "$branch" != "$MAIN_BRANCH" ]]; then
    die "Run 'tag' on $MAIN_BRANCH, not '$branch'. Switch with: git checkout $MAIN_BRANCH"
  fi
  log "  branch: $branch (clean)"

  log "Fetching origin + tags"
  if ! run_ok git fetch --prune --tags origin "$MAIN_BRANCH"; then
    die "Could not fetch origin/$MAIN_BRANCH. Aborting so we don't double-publish."
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

  # Derive version from package.json — single source of truth.
  local version
  version=$(node -e "process.stdout.write(require('$PACKAGE_JSON').version)")
  [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.-]+)?$ ]] \
    || die "package.json version '$version' is not a valid semver."

  local tag="v$version"

  # Refuse if already tagged (locally or on origin).
  if git rev-parse "$tag" >/dev/null 2>&1; then
    die "Tag $tag already exists locally. Did you double-run? Either delete with 'git tag -d $tag' or bump."
  fi
  if git ls-remote --tags origin 2>/dev/null | awk '{print $2}' | grep -Fxq "refs/tags/$tag"; then
    die "Tag $tag already exists on origin. Either npm got there first or bump the version."
  fi

  log "About to tag"
  log "  HEAD:                $(git rev-parse --short HEAD)"
  log "  package.json version: $version"
  log "  tag (will create):   $tag (annotated)"
  log "  tagger:              $(git config user.name) <$(git config user.email)>"
  log "  author of HEAD:      $(git log -1 --pretty='%an <%ae>')"

  if ! confirm "Create and push $tag?"; then
    log "Aborted. Nothing was tagged or pushed."
    exit 0
  fi

  local message="Release $tag

Published by ${SCRIPT_NAME}.
See CHANGELOG.md for what changed since the last tag."

  run git tag -a "$tag" -m "$message"

  if ! has_flag --no-push; then
    log "Pushing $tag (main is already on origin via the version PR merge)"
    run git push origin "refs/tags/$tag"
  fi

  # Optional GitHub Release
  if has_flag --release; then
    if ! command -v gh >/dev/null 2>&1; then
      warn "gh CLI not installed — cannot create GitHub Release automatically."
    elif ! gh auth status >/dev/null 2>&1; then
      warn "gh not authenticated — run 'gh auth login' to enable GitHub Release creation."
    else
      log "Creating GitHub Release for $tag…"
      run gh release create "$tag" --title "$tag" --generate-notes
    fi
  fi

  local url
  url=$(repo_url)
  cat <<EOF

✓ Tagged $tag ($version)
  - tag:    $url/releases/tag/$tag
  - commit: $(git rev-parse --short HEAD)

$( if has_flag --release; then echo "  - release page created via gh"; fi )

EOF
}

# ---------------------------------------------------------------------------
# dispatch
# ---------------------------------------------------------------------------
case "$SUBCOMMAND" in
  prepare) cmd_prepare ;;
  tag)     cmd_tag ;;
esac
