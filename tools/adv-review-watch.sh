#!/usr/bin/env bash
set -euo pipefail

# Independent background watcher for Scenario A Adversarial Reviews.
# Designed for systemd --user timers (--once) or foreground polling (--loop).
# Consumes zero AI tokens when no new eligible commits exist.
#
# Usage:
#   ./tools/adv-review-watch.sh [options]
#
# Options:
#   --once                Run a single scan pass and exit (default)
#   --loop                Keep scanning every --interval seconds
#   --interval <sec>      Seconds between scans in --loop mode (default: 120)
#   --cooldown <sec>      Minimum commit age before auditing (default: 60)
#   --repo <path>         Repository root path (default: current git repo)
#   --base <branch>       Base branch to diff against (default: auto-detected master/main)
#   --no-judge            Run Phase 2 reviewers only (default runs with --judge)
#   --seed                Mark all current local branch HEADs as already reviewed and exit
#   --dry-run             Show which branches would be audited without invoking agy
#   --timeout <duration>  Timeout passed to adv-review.sh (default: 5m)
#   -h, --help            Show this help

usage() {
	cat <<'EOF'
Usage:
  adv-review-watch.sh [options]

Options:
  --once                Run a single scan pass and exit (default)
  --loop                Poll continuously every --interval seconds
  --interval <sec>      Poll interval in seconds for --loop mode (default: 120)
  --cooldown <sec>      Wait at least N seconds after the last commit (default: 60)
  --repo <path>         Target git repository path (default: current repo)
  --base <branch>       Base branch (default: auto-detected master/main)
  --no-judge            Skip Phase 3 Judge (run Phase 2 reviewers only)
  --seed                Mark all current local branch HEADs as reviewed (prevents auditing old branches)
  --dry-run             Print eligible/skipped branches without running adv-review.sh
  --timeout <duration>  Timeout per agy call (default: 5m)
  -h, --help            Show this help
EOF
}

MODE="once"
INTERVAL=120
COOLDOWN=60
REPO_ARG=""
BASE_REF=""
USE_JUDGE=true
SEED_ONLY=false
DRY_RUN=false
PRINT_TIMEOUT="5m"

while [[ $# -gt 0 ]]; do
	case "$1" in
		--once)
			MODE="once"
			shift
			;;
		--loop)
			MODE="loop"
			shift
			;;
		--interval)
			[[ $# -ge 2 ]] || { echo "Error: --interval requires seconds" >&2; exit 1; }
			INTERVAL="$2"
			shift 2
			;;
		--cooldown)
			[[ $# -ge 2 ]] || { echo "Error: --cooldown requires seconds" >&2; exit 1; }
			COOLDOWN="$2"
			shift 2
			;;
		--repo)
			[[ $# -ge 2 ]] || { echo "Error: --repo requires a path" >&2; exit 1; }
			REPO_ARG="$2"
			shift 2
			;;
		--base)
			[[ $# -ge 2 ]] || { echo "Error: --base requires a branch name" >&2; exit 1; }
			BASE_REF="$2"
			shift 2
			;;
		--no-judge)
			USE_JUDGE=false
			shift
			;;
		--seed)
			SEED_ONLY=true
			shift
			;;
		--dry-run)
			DRY_RUN=true
			shift
			;;
		--timeout)
			[[ $# -ge 2 ]] || { echo "Error: --timeout requires a duration" >&2; exit 1; }
			PRINT_TIMEOUT="$2"
			shift 2
			;;
		-h|--help)
			usage
			exit 0
			;;
		*)
			echo "Error: Unknown option '$1'" >&2
			usage >&2
			exit 1
			;;
	esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADV_REVIEW_SCRIPT="${SCRIPT_DIR}/adv-review.sh"

if [[ ! -x "$ADV_REVIEW_SCRIPT" ]]; then
	echo "Error: Executable adv-review.sh not found at $ADV_REVIEW_SCRIPT" >&2
	exit 1
fi

if [[ -n "$REPO_ARG" ]]; then
	REPO_ROOT="$(git -C "$REPO_ARG" rev-parse --show-toplevel)"
else
	REPO_ROOT="$(git rev-parse --show-toplevel)"
fi

# Resolve common git directory so state is shared across main repo and worktrees
GIT_COMMON_DIR="$(git -C "$REPO_ROOT" rev-parse --git-common-dir)"
MAIN_REPO_ROOT="$(cd "$REPO_ROOT" && cd "$GIT_COMMON_DIR/.." && pwd)"

STATE_DIR="${MAIN_REPO_ROOT}/.claude/adversarial-review"
STATE_FILE="${STATE_DIR}/.reviewed-shas"
LOCK_FILE="${STATE_DIR}/.watch.lock"
LOG_FILE="${STATE_DIR}/watch.log"

mkdir -p "$STATE_DIR"
touch "$STATE_FILE"

if [[ -z "$BASE_REF" ]]; then
	if ORIGIN_HEAD="$(git -C "$MAIN_REPO_ROOT" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null)"; then
		BASE_REF="${ORIGIN_HEAD#origin/}"
	elif git -C "$MAIN_REPO_ROOT" rev-parse --verify --quiet master >/dev/null; then
		BASE_REF="master"
	else
		BASE_REF="main"
	fi
fi

log() {
	local msg="[adv-watch $(date +%H:%M:%S)] $*"
	echo "$msg"
	echo "$msg" >> "$LOG_FILE"
}

notify() {
	local title="$1"
	local body="$2"
	local urgency="${3:-normal}"
	if command -v notify-send >/dev/null 2>&1; then
		notify-send -u "$urgency" "$title" "$body" >/dev/null 2>&1 || true
	fi
}

is_reviewed() {
	local sha="$1"
	grep -q "^${sha} " "$STATE_FILE" 2>/dev/null
}

mark_reviewed() {
	local sha="$1"
	local branch="$2"
	local status="$3"
	printf '%s %s %s %s\n' "$sha" "$branch" "$(date -Iseconds)" "$status" >> "$STATE_FILE"
}

seed_branches() {
	local count=0
	while IFS=$'\t' read -r branch sha _ts; do
		[[ "$branch" == "$BASE_REF" || "$branch" == "main" || "$branch" == "master" ]] && continue
		if ! is_reviewed "$sha"; then
			mark_reviewed "$sha" "$branch" "seeded"
			log "Seeded $branch (${sha:0:8}) as already reviewed."
			count=$((count + 1))
		fi
	done < <(git -C "$MAIN_REPO_ROOT" for-each-ref --format='%(refname:short)	%(objectname)	%(committerdate:unix)' refs/heads)
	log "Seed complete ($count branch(es) marked)."
}

scan_once() {
	local base_commit now
	base_commit="$(git -C "$MAIN_REPO_ROOT" rev-parse --verify "${BASE_REF}^{commit}")"
	now="$(date +%s)"

	while IFS=$'\t' read -r branch sha commit_ts; do
		[[ "$branch" == "$BASE_REF" || "$branch" == "main" || "$branch" == "master" ]] && continue

		if is_reviewed "$sha"; then
			[[ "$DRY_RUN" == true ]] && echo "[dry-run] skip $branch (${sha:0:8}): already reviewed"
			continue
		fi

		if git -C "$MAIN_REPO_ROOT" merge-base --is-ancestor "$sha" "$base_commit" 2>/dev/null; then
			[[ "$DRY_RUN" == true ]] && echo "[dry-run] skip $branch (${sha:0:8}): already merged into $BASE_REF"
			continue
		fi

		if git -C "$MAIN_REPO_ROOT" diff --quiet "${base_commit}...${sha}" 2>/dev/null; then
			[[ "$DRY_RUN" == true ]] && echo "[dry-run] skip $branch (${sha:0:8}): no diff vs $BASE_REF"
			continue
		fi

		local age=$((now - commit_ts))
		if (( age < COOLDOWN )); then
			[[ "$DRY_RUN" == true ]] && echo "[dry-run] defer $branch (${sha:0:8}): age ${age}s < cooldown ${COOLDOWN}s"
			continue
		fi

		if [[ "$DRY_RUN" == true ]]; then
			echo "[dry-run] WOULD AUDIT $branch (${sha:0:8}) vs $BASE_REF (age ${age}s)"
			continue
		fi

		log "Auditing branch '$branch' (${sha:0:8}) vs '$BASE_REF'..."
		local cmd=(bash "$ADV_REVIEW_SCRIPT" "$branch" "$BASE_REF" --timeout "$PRINT_TIMEOUT")
		[[ "$USE_JUDGE" == true ]] && cmd+=(--judge)

		local rc=0
		(
			cd "$MAIN_REPO_ROOT"
			"${cmd[@]}"
		) >> "$LOG_FILE" 2>&1 || rc=$?

		if [[ "$rc" -eq 0 ]]; then
			mark_reviewed "$sha" "$branch" "ok"
			log "Completed audit for '$branch' (${sha:0:8})."
			notify "Adversarial Review listo: $branch" "Revisa el veredicto en .claude/adversarial-review/ (commit ${sha:0:8})." "normal"
		else
			mark_reviewed "$sha" "$branch" "failed(rc=$rc)"
			log "Audit FAILED (rc=$rc) for '$branch' (${sha:0:8}). See $LOG_FILE"
			notify "Adversarial Review falló: $branch" "Código de salida $rc. Revisa .claude/adversarial-review/watch.log" "critical"
		fi
	done < <(git -C "$MAIN_REPO_ROOT" for-each-ref --format='%(refname:short)	%(objectname)	%(committerdate:unix)' refs/heads)
}

if [[ "$SEED_ONLY" == true ]]; then
	seed_branches
	exit 0
fi

# Prevent overlapping watcher runs
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
	[[ "$DRY_RUN" == true ]] && echo "[dry-run] another watcher instance holds $LOCK_FILE"
	exit 0
fi

if [[ "$MODE" == "once" ]]; then
	scan_once
else
	log "Starting watch loop on $MAIN_REPO_ROOT (interval=${INTERVAL}s, cooldown=${COOLDOWN}s, base=${BASE_REF})"
	while true; do
		scan_once
		sleep "$INTERVAL"
	done
fi
