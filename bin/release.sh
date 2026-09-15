#!/usr/bin/env bash
# =============================================================================
# @whereq/react — Release Script
# =============================================================================
# Cut a release the professional way: green-bar the library, consume pending
# Changesets to bump the version + CHANGELOG, promote `dev` → `main`, create an
# annotated `v{semver}` tag, and push. The actual `npm publish` is done by CI
# (.github/workflows/publish.yml) when the tag lands — so credentials never live
# on a developer's machine.
#
# Modeled on flowdesk.top/bin/release.sh (dev → main → tag → CI does the rest),
# adapted for an npm package instead of a deployed app.
#
# USAGE
#   bin/release.sh [OPTIONS]
#
# OPTIONS
#   --patch | --minor | --major   If no Changeset is pending, create one of this
#                                 bump type so a release can be cut. Ignored when
#                                 Changesets already exist (they decide the bump).
#   -m, --message <msg>           Summary line for the auto-created Changeset
#                                 (default: "Release").
#   --dry-run                     Print every command; change nothing.
#   -y, --yes                     Skip the interactive confirmation.
#   -h, --help                    Show this help.
#
# TYPICAL FLOW
#   # during development, on dev:
#   pnpm changeset                       # record what changed (patch/minor/major)
#   ...commit & push to dev...
#   # to release:
#   bin/release.sh                       # consumes changesets → version → tag → push
#   bin/release.sh --minor -m "Add Modal" # no changeset yet? create one, then release
#
# EXIT CODES
#   0 success · 1 pre-flight failed · 2 nothing to release · 3 git error
# =============================================================================
set -euo pipefail

# ── Colors / logging ─────────────────────────────────────────────────────────
if [[ -t 1 ]]; then
  RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'
  BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; BOLD=''; DIM=''; NC=''
fi
info()  { echo -e "${CYAN}▶${NC} $*"; }
ok()    { echo -e "${GREEN}✓${NC} $*"; }
warn()  { echo -e "${YELLOW}⚠${NC}  $*"; }
error() { echo -e "${RED}✗${NC} $*" >&2; }
dim()   { echo -e "${DIM}$*${NC}"; }
step()  { echo; echo -e "${BOLD}$*${NC}"; }
die()   { error "$*"; exit "${2:-1}"; }

# ── Config ───────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
DEV_BRANCH="dev"
MAIN_BRANCH="main"
DRY_RUN=false
ASSUME_YES=false
BUMP=""
MESSAGE="Release"

run() {
  dim "  \$ $*"
  if [[ "$DRY_RUN" == false ]]; then "$@"; fi
}

usage() { sed -n '2,45p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'; }

# ── Args ─────────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --patch|--minor|--major) BUMP="${1#--}"; shift ;;
    -m|--message) MESSAGE="${2:?--message needs a value}"; shift 2 ;;
    --dry-run) DRY_RUN=true; shift ;;
    -y|--yes) ASSUME_YES=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) die "Unknown option: $1 (see --help)" ;;
  esac
done

cd "$ROOT"

# ── Pre-flight ───────────────────────────────────────────────────────────────
step "Pre-flight checks"
command -v git >/dev/null || die "git not found"
command -v pnpm >/dev/null || die "pnpm not found (npm i -g pnpm)"

CURRENT_BRANCH="$(git rev-parse --abbrev-ref HEAD)"
[[ "$CURRENT_BRANCH" == "$DEV_BRANCH" ]] || \
  die "Must be on '${DEV_BRANCH}' (currently on '${CURRENT_BRANCH}'). Cut releases from ${DEV_BRANCH}." 1

if [[ -n "$(git status --porcelain)" ]]; then
  die "Working tree is dirty. Commit or stash first." 1
fi

info "Fetching origin…"
run git fetch --quiet --tags origin
if git rev-parse --verify --quiet "origin/${DEV_BRANCH}" >/dev/null; then
  LOCAL="$(git rev-parse "$DEV_BRANCH")"
  REMOTE="$(git rev-parse "origin/${DEV_BRANCH}")"
  [[ "$LOCAL" == "$REMOTE" ]] || die "Local '${DEV_BRANCH}' differs from origin. Pull/push first." 2
fi
ok "On ${DEV_BRANCH}, clean, in sync with origin"

# ── Green bar ────────────────────────────────────────────────────────────────
step "Green bar (typecheck · lint · test · build)"
run pnpm install --frozen-lockfile
run pnpm run typecheck
run pnpm run lint
run pnpm run test
run pnpm run build
ok "All checks passed"

# ── Ensure there is something to release ─────────────────────────────────────
step "Versioning (Changesets)"
PENDING="$(find .changeset -maxdepth 1 -name '*.md' ! -name 'README.md' 2>/dev/null | wc -l | tr -d ' ')"
if [[ "$PENDING" -eq 0 ]]; then
  if [[ -z "$BUMP" ]]; then
    die "No pending changesets. Add one with 'pnpm changeset', or pass --patch/--minor/--major." 2
  fi
  info "No changeset found — creating a '${BUMP}' changeset."
  CS_FILE=".changeset/release-$(date +%Y%m%d%H%M%S).md"
  if [[ "$DRY_RUN" == false ]]; then
    printf -- '---\n"@whereq/react": %s\n---\n\n%s\n' "$BUMP" "$MESSAGE" > "$CS_FILE"
  fi
  dim "  wrote ${CS_FILE} (${BUMP}: ${MESSAGE})"
else
  info "${PENDING} pending changeset(s) — they determine the bump."
fi

OLD_VERSION="$(node -p "require('./package.json').version")"
run pnpm exec changeset version
NEW_VERSION="$(node -p "require('./package.json').version")"
[[ "$DRY_RUN" == true ]] && NEW_VERSION="${NEW_VERSION} (unchanged in dry-run)"
TAG="v${NEW_VERSION%% *}"
ok "Version: ${OLD_VERSION} → ${BOLD}${NEW_VERSION%% *}${NC}   tag: ${BOLD}${TAG}${NC}"

# ── Confirm ──────────────────────────────────────────────────────────────────
if [[ "$ASSUME_YES" == false && "$DRY_RUN" == false ]]; then
  echo
  read -r -p "$(echo -e "${BOLD}Release ${TAG} (${DEV_BRANCH} → ${MAIN_BRANCH}, tag, push)? [y/N] ${NC}")" reply
  [[ "$reply" =~ ^[Yy]$ ]] || die "Aborted." 0
fi

# ── Commit version bump on dev, push ─────────────────────────────────────────
step "Commit + promote ${DEV_BRANCH} → ${MAIN_BRANCH}"
run git add -A
run git commit -m "release: ${TAG}"
run git push origin "$DEV_BRANCH"

# fast-forward main to dev (main is the release branch; dev is always ahead)
run git checkout "$MAIN_BRANCH"
run git merge --ff-only "$DEV_BRANCH" || die "main could not fast-forward from dev — reconcile manually." 3
run git push origin "$MAIN_BRANCH"

# ── Tag + push (CI publishes on the tag) ─────────────────────────────────────
step "Tag ${TAG}"
if git rev-parse --verify --quiet "refs/tags/${TAG}" >/dev/null; then
  die "Tag ${TAG} already exists. Delete it first: git tag -d ${TAG}" 3
fi
run git tag -a "$TAG" -m "@whereq/react ${TAG}"
run git push origin "$TAG"

# back to dev for continued work
run git checkout "$DEV_BRANCH"

echo
ok "Released ${BOLD}${TAG}${NC}. CI will build + publish to npm from the tag."
dim "  Watch: https://github.com/whereq/whereq-react/actions"
