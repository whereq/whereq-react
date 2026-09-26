#!/usr/bin/env bash
# bin/release.sh — PR-mandatory release helpers for @whereq/react.
#
# Two subcommands. Both respect the project's PR-only release flow:
#
#   prepare  (run on a feature branch, NEVER on main)
#     - rebase the feature branch onto origin/main so it merges cleanly
#     - verify a .changeset/*.md exists (or run `pnpm changeset` to make one)
#     - run the local green bar (typecheck · lint · test)
#     - print the exact "git push & gh pr create" commands to run
#
#   tag      (run on main, AFTER the changesets "version packages" PR is merged)
#     - confirm main is in sync with origin/main
#     - derive the tag `v<semver>` from package.json (single source of truth)
#     - reject if the tag already exists locally or on origin
#     - create an *annotated* tag (`git tag -a`) on the version-bump commit
#     - push the tag (not main — main is already pushed by the version PR)
#
# What this script NEVER does (deliberately):
#   - merges into main locally (the PR UI owns merging)
#   - touches npm, the registry, or any credentials (CI owns publishing)
#   - invents a version (every tag is derived from package.json)
#   - creates lightweight tags (releases must be annotated)
#
# Tag strategy (best practice)
# ----------------------------
#   - Tag ONLY main. Tags are immutable; tagging a feature branch gives
#     you a v0.1.0 that doesn't match the published state, because the
#     branch keeps moving but the tag doesn't.
#   - Use `v<semver>` annotated tags (`git tag -a v0.1.0 -m "..."`).
#     Lightweight tags are wrong here; GitHub Releases uses the message.
#   - The tag is DERIVED from `package.json#version`, never typed by hand.
#     Mismatch fails immediately — package.json is the source of truth.
#   - Don't reuse tags. Need to fix a release? Cut v0.1.1.
#   - Don't add prefixes like `release-v0.1.0`; v0.1.0 IS the release tag.
#   - Pre-releases: `v0.2.0-rc.1`, `v1.0.0-beta.2`; npm dist-tag = `next`.
#
# Usage
# -----
#   bin/release.sh prepare [--dry-run]
#   bin/release.sh tag     [--dry-run]
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
SUBCOMMAND=""

# ---------------------------------------------------------------------------
# helpers
# ---------------------------------------------------------------------------
log()  { printf '%s\n' "→ $*"; }
warn() { printf '%s\n' "⚠ $*" >&2; }
err()  { printf '%s\n' "✗ $*" >&2; }
die()  { err "$*"; exit 1; }

confirm() {
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
  # like run() but propagates the exit status instead of `set -e`
  if $DRY_RUN; then
    log "  [dry-run] $*"
    return 0
  fi
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
    die "Working tree is dirty. Commit/stash/discard first."
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

# Confirm a `.changeset/*.md` file exists that hasn't been consumed yet.
changeset_exists() {
  [[ -d "$REPO_ROOT/.changeset" ]] || return 1
  local n
  n=$(find "$REPO_ROOT/.changeset" -maxdepth 1 -type f -name '*.md' \
        ! -name 'README.md' ! -name 'config.json' 2>/dev/null | wc -l | tr -d ' ')
  [[ "$n" -gt 0 ]]
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
    prepare|tag)
      if [[ -n "$SUBCOMMAND" ]]; then die "Specify only one subcommand."; fi
      SUBCOMMAND="$1"; shift ;;
    *) printf '✗ unknown arg: %s\n' "$1" >&2; exit 2 ;;
  esac
done

[[ -n "$SUBCOMMAND" ]] || usage_or_die

# ===========================================================================
# subcommand: prepare
#   Operates on a feature branch. Never on main. Never merges locally.
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

  # Fetch the merge target + tags so base checks are real.
  if ! run_ok git fetch --prune --tags origin "$MAIN_BRANCH"; then
    warn "Could not fetch origin/$MAIN_BRANCH. Continuing — but the rebase step below will fail."
  fi

  # Offer a rebase of the feature branch onto origin/main
  if git rev-parse --quiet --verify "origin/$MAIN_BRANCH" >/dev/null; then
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
  fi

  # Ensure a changeset exists (will power the bot's "version packages" PR)
  if ! changeset_exists; then
    warn "No .changeset/*.md found on this branch."
    if confirm "Run 'pnpm changeset' now? "; then
      run pnpm changeset
    else
      warn "Proceeding without a changeset. The bot's version PR may not be opened after merge."
    fi
  else
    log "changeset present: $(find "$REPO_ROOT/.changeset" -maxdepth 1 -type f -name '*.md' ! -name 'README.md' ! -name 'config.json' -print -quit)"
  fi

  # Run the local green bar — matches CI exactly.
  log "Local green bar (matches CI: typecheck · lint · test)"
  if ! $DRY_RUN; then
    pnpm typecheck && log "  typecheck ✓" || die "typecheck failed — fix and re-run."
    pnpm lint      && log "  lint      ✓" || die "lint failed — fix and re-run."
    pnpm test      && log "  test      ✓" || die "test failed — fix and re-run."
  else
    log "  [dry-run] pnpm typecheck && pnpm lint && pnpm test"
  fi

  # Print the exact commands to run next.
  local url
  url=$(repo_url)
  cat <<EOF

✓ $branch is ready to PR.

Next:
  git push origin $branch
  gh pr create \\
    --repo "$url" \\
    --base $MAIN_BRANCH \\
    --head $branch \\
    --title "feat(<scope>): …" \\
    --body  "Closes #…"

After review + merge on GitHub:
  - the changesets bot will open a "release: version packages" PR
  - you review the CHANGELOG diff and merge that PR
  - on the next push to $MAIN_BRANCH, release.yml publishes to npm

To cut a tag manually (e.g. for a pre-release that doesn't go through Changesets):
  bin/release.sh tag

EOF
}

# ===========================================================================
# subcommand: tag
#   Operates on main. Reads package.json, creates the annotated v<semver>
#   tag, and pushes it. Does NOT touch npm or modify package.json.
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

  # Fetch tags + main so we check uniqueness against origin.
  log "Fetching origin + tags"
  if ! run_ok git fetch --prune --tags origin "$MAIN_BRANCH"; then
    die "Could not fetch origin/$MAIN_BRANCH. Aborting so we don't double-publish."
  fi

  # Require local main == origin/main.
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

  # Derive version from package.json (the single source of truth).
  local version
  version=$(node -e "process.stdout.write(require('$PACKAGE_JSON').version)")
  [[ "$version" =~ ^[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.-]+)?$ ]] \
    || die "package.json version '$version' is not a valid semver."

  local tag="v$version"

  # Refuse if already tagged (locally or on origin).
  if git rev-parse "$tag" >/dev/null 2>&1; then
    die "Tag $tag already exists locally. Did you double-run? Either delete it with 'git tag -d $tag' or bump."
  fi
  if git ls-remote --tags origin 2>/dev/null | awk '{print $2}' | grep -Fxq "refs/tags/$tag"; then
    die "Tag $tag already exists on origin. Either npm got there first (re-publish not allowed) or bump the version."
  fi

  log "About to tag"
  log "  HEAD:        $(git rev-parse --short HEAD)"
  log "  package.json version: $version"
  log "  tag (will create):   $tag (annotated)"
  log "  tagger:      $(git config user.name) <$(git config user.email)>"
  log "  author of HEAD:      $(git log -1 --pretty='%an <%ae>')"

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

  local url
  url=$(repo_url)
  cat <<EOF

✓ Tagged $tag ($version)
  - tag:    $url/releases/tag/$tag
  - commit: $(git rev-parse --short HEAD)

What happens next:
  - .github/workflows/release.yml has nothing extra to do for the tag
    (the tag is purely a marker; the publish already happened via the
    bot's "Version Packages" PR that bumped package.json on $MAIN_BRANCH).
  - gh release create $tag --generate-notes   (only if you want a GitHub
    Release alongside the tag — release.yml doesn't currently auto-do this)

EOF
}

# ---------------------------------------------------------------------------
# dispatch
# ---------------------------------------------------------------------------
case "$SUBCOMMAND" in
  prepare) cmd_prepare ;;
  tag)     cmd_tag ;;
esac
