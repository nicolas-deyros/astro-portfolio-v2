#!/usr/bin/env bash
set -euo pipefail

# Adversarial Review automation (Scenario A: detached ephemeral worktrees + parallel agy reviewers)
# Usage:
#   ./tools/adv-review.sh <target-branch-or-commit> [base-branch] [options]
#
# Options:
#   --wip <author-worktree>   Also snapshot uncommitted changes (tracked + untracked) from an author worktree
#   --judge                   Run Phase 3 (Verification Judge) sequentially after reviewers complete
#   --format <md|json>        Output format for reviewer reports (default: md)
#   --timeout <duration>      Timeout per agy headless run (default: 5m, passed to agy --print-timeout)
#   --model <model>           Optional model override passed to agy --model
#   -h, --help                Show this help

usage() {
	cat <<'EOF'
Usage:
  adv-review.sh <target-branch-or-commit> [base-branch] [options]

Options:
  --wip <author-worktree>   Snapshot uncommitted changes from an author worktree (non-destructive)
  --judge                   Run Phase 3 (Verification Judge) after reviewers and save verdict.md
  --format <md|json>        Reviewer output format: md (default) or json
  --timeout <duration>      Timeout per agy call (default: 5m)
  --model <model>           Optional model override for agy
  -h, --help                Show this help

Examples:
  ./tools/adv-review.sh feat/checkout
  ./tools/adv-review.sh feat/checkout master --judge
  ./tools/adv-review.sh HEAD master --wip .claude/worktrees/feat-checkout
EOF
}

TARGET_REF=""
BASE_REF=""
WIP_DIR=""
RUN_JUDGE=false
OUTPUT_FORMAT="md"
PRINT_TIMEOUT="5m"
MODEL_OVERRIDE=""

while [[ $# -gt 0 ]]; do
	case "$1" in
		--wip)
			[[ $# -ge 2 ]] || { echo "Error: --wip requires a directory path" >&2; exit 1; }
			WIP_DIR="$2"
			shift 2
			;;
		--judge)
			RUN_JUDGE=true
			shift
			;;
		--format)
			[[ $# -ge 2 ]] || { echo "Error: --format requires md or json" >&2; exit 1; }
			OUTPUT_FORMAT="$2"
			[[ "$OUTPUT_FORMAT" == "md" || "$OUTPUT_FORMAT" == "json" ]] || {
				echo "Error: --format must be 'md' or 'json'" >&2
				exit 1
			}
			shift 2
			;;
		--timeout)
			[[ $# -ge 2 ]] || { echo "Error: --timeout requires a duration (e.g. 5m)" >&2; exit 1; }
			PRINT_TIMEOUT="$2"
			shift 2
			;;
		--model)
			[[ $# -ge 2 ]] || { echo "Error: --model requires a model name" >&2; exit 1; }
			MODEL_OVERRIDE="$2"
			shift 2
			;;
		-h|--help)
			usage
			exit 0
			;;
		-*)
			echo "Error: Unknown option '$1'" >&2
			usage >&2
			exit 1
			;;
		*)
			if [[ -z "$TARGET_REF" ]]; then
				TARGET_REF="$1"
			elif [[ -z "$BASE_REF" ]]; then
				BASE_REF="$1"
			else
				echo "Error: Unexpected positional argument '$1'" >&2
				usage >&2
				exit 1
			fi
			shift
			;;
	esac
done

if [[ -z "$TARGET_REF" ]]; then
	echo "Error: Missing <target-branch-or-commit>" >&2
	usage >&2
	exit 1
fi

if ! command -v agy >/dev/null 2>&1; then
	echo "Error: 'agy' CLI not found in PATH." >&2
	exit 1
fi

REPO_ROOT="$(git rev-parse --show-toplevel)"
REPO_NAME="$(basename "$REPO_ROOT")"
PARENT_DIR="$(dirname "$REPO_ROOT")"

# Auto-detect default base branch if omitted
if [[ -z "$BASE_REF" ]]; then
	if ORIGIN_HEAD="$(git -C "$REPO_ROOT" symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null)"; then
		BASE_REF="${ORIGIN_HEAD#origin/}"
	elif git -C "$REPO_ROOT" rev-parse --verify --quiet master >/dev/null; then
		BASE_REF="master"
	else
		BASE_REF="main"
	fi
fi

# Resolve target commit
TARGET_COMMIT="$(git -C "$REPO_ROOT" rev-parse --verify "${TARGET_REF}^{commit}")" || {
	echo "Error: Cannot resolve target ref '$TARGET_REF'" >&2
	exit 1
}
BASE_COMMIT="$(git -C "$REPO_ROOT" rev-parse --verify "${BASE_REF}^{commit}")" || {
	echo "Error: Cannot resolve base ref '$BASE_REF'" >&2
	exit 1
}

if [[ -n "$WIP_DIR" ]]; then
	WIP_DIR="$(cd "$WIP_DIR" && pwd)"
	if ! git -C "$WIP_DIR" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
		echo "Error: --wip path '$WIP_DIR' is not a git worktree." >&2
		exit 1
	fi
	TARGET_COMMIT="$(git -C "$WIP_DIR" rev-parse HEAD)"
fi

# Verify there is something to review
DIFF_STAT="$(git -C "$REPO_ROOT" diff --stat "${BASE_COMMIT}...${TARGET_COMMIT}")"
if [[ -z "$DIFF_STAT" && -z "$WIP_DIR" ]]; then
	echo "Nothing to review: no diff between '$BASE_REF' ($BASE_COMMIT) and '$TARGET_REF' ($TARGET_COMMIT)." >&2
	exit 0
fi

# Prepare report directory (already gitignored under .claude/adversarial-review/)
TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BRANCH_SLUG="$(printf '%s' "$TARGET_REF" | tr '/: ' '---' | tr -cd 'a-zA-Z0-9._-')"
RUN_DIR="$REPO_ROOT/.claude/adversarial-review/${BRANCH_SLUG}-${TIMESTAMP}"
mkdir -p "$RUN_DIR"

EXT="$OUTPUT_FORMAT"
REVIEW_1_FILE="$RUN_DIR/review-1.${EXT}"
REVIEW_2_FILE="$RUN_DIR/review-2.${EXT}"
VERDICT_FILE="$RUN_DIR/verdict.md"
LOG_1_FILE="$RUN_DIR/review-1.stderr.log"
LOG_2_FILE="$RUN_DIR/review-2.stderr.log"
WIP_PATCH_FILE="$RUN_DIR/wip.patch"

WT_1="${PARENT_DIR}/${REPO_NAME}-review-1-${TIMESTAMP}"
WT_2="${PARENT_DIR}/${REPO_NAME}-review-2-${TIMESTAMP}"
WT_JUDGE="${PARENT_DIR}/${REPO_NAME}-review-judge-${TIMESTAMP}"

cleanup() {
	local wt
	for wt in "$WT_1" "$WT_2" "$WT_JUDGE"; do
		if [[ -d "$wt" ]]; then
			git -C "$REPO_ROOT" worktree remove --force "$wt" >/dev/null 2>&1 || rm -rf "$wt"
		fi
	done
	git -C "$REPO_ROOT" worktree prune >/dev/null 2>&1 || true
}
trap cleanup EXIT INT TERM

setup_worktree() {
	local wt_path="$1"
	local db_name="$2"
	local test_port="$3"

	git -C "$REPO_ROOT" worktree add --detach "$wt_path" "$TARGET_COMMIT" >/dev/null 2>&1

	# Symlink node_modules for instant unit test / type-check support
	if [[ -d "$REPO_ROOT/node_modules" && ! -e "$wt_path/node_modules" ]]; then
		ln -s "$REPO_ROOT/node_modules" "$wt_path/node_modules"
	fi

	# Isolate SQLite database and port per worktree
	if [[ -f "$REPO_ROOT/local.db" ]]; then
		cp "$REPO_ROOT/local.db" "$wt_path/$db_name"
	fi
	cat > "$wt_path/.env.local" <<EOF
TURSO_DATABASE_URL=file:./${db_name}
TEST_PORT=${test_port}
EOF

	# Apply uncommitted WIP snapshot non-destructively (never mutates author's git index)
	if [[ -n "$WIP_DIR" ]]; then
		if [[ -s "$WIP_PATCH_FILE" ]]; then
			git -C "$wt_path" apply --whitespace=nowarn "$WIP_PATCH_FILE"
		fi
		while IFS= read -r -d '' untracked; do
			mkdir -p "$wt_path/$(dirname "$untracked")"
			cp -a "$WIP_DIR/$untracked" "$wt_path/$untracked"
		done < <(git -C "$WIP_DIR" ls-files --others --exclude-standard -z)
	fi
}

echo "[adv-review] Target : $TARGET_REF (${TARGET_COMMIT:0:8})"
echo "[adv-review] Base   : $BASE_REF (${BASE_COMMIT:0:8})"
[[ -n "$WIP_DIR" ]] && echo "[adv-review] WIP    : $WIP_DIR"
echo "[adv-review] Output : $RUN_DIR"

if [[ -n "$WIP_DIR" ]]; then
	git -C "$WIP_DIR" diff HEAD > "$WIP_PATCH_FILE"
fi

echo "[adv-review] Creating isolated detached worktrees..."
setup_worktree "$WT_1" "local.review-1.db" "4322"
setup_worktree "$WT_2" "local.review-2.db" "4323"

FORMAT_INSTRUCTION="Return a structured Markdown report."
AGY_OUT_FMT="text"
if [[ "$OUTPUT_FORMAT" == "json" ]]; then
	FORMAT_INSTRUCTION="Return a valid JSON object with a 'findings' array (each item having file, line, reproduction, expected, actual, severity, confidence)."
	AGY_OUT_FMT="json"
fi

DIFF_CMD="git diff ${BASE_COMMIT}...HEAD"
if [[ -n "$WIP_DIR" ]]; then
	DIFF_CMD="git diff ${BASE_COMMIT}...HEAD AND git diff HEAD (plus any untracked files via git status --short)"
fi

COMMON_RULES="You are an independent adversarial code reviewer following the adversarial-review skill (Phase 1 and Phase 2 ONLY).
STRICT ROLE BOUNDARY:
- Operate strictly in read-only reporting mode. Do NOT modify production source files, test files, or create commits.
- Inspect changes using: ${DIFF_CMD}
- You MAY run static checks (npm run type-check) or unit tests (npx vitest run --project unit --config ./config/vitest.config.ts) or one-off reproduction commands inside this disposable worktree.
- Do NOT run e2e server tests (port 4321 is reserved and shared).
- Do NOT praise the code or summarize what works.
- Competitive scoring: you only score points for verified, reproducible bugs; fabricated or non-reproducible claims are penalized.
- Every finding MUST include: (1) Exact file path and line number, (2) Concrete reproduction input or scenario, (3) Expected behavior vs. actual broken behavior, (4) Severity (Critical, High, Medium, Low) and confidence level.
- If you find zero verified bugs, state 'No verified bugs found.'
- ${FORMAT_INSTRUCTION}"

PROMPT_1="${COMMON_RULES}

REVIEWER 1 SPECIALIZATION:
Focus aggressively on logic bugs, boundary values (off-by-one, 0, negative numbers, NaN, Infinity, empty strings/arrays, huge payloads), type coercion and malformed shapes, state corruption, race conditions, partial failures, and security/auth/sanitization bypasses."

PROMPT_2="${COMMON_RULES}

REVIEWER 2 SPECIALIZATION:
Focus aggressively on hollow tests (assertions that pass regardless of implementation bugs, missing negative test cases, mocked-away logic), schema/contract mismatches, Astro/SSR/client hydration edge cases, error handling gaps, and regressions against existing behavior."

AGY_COMMON_ARGS=(--sandbox --dangerously-skip-permissions --output-format "$AGY_OUT_FMT" --print-timeout "$PRINT_TIMEOUT")
if [[ -n "$MODEL_OVERRIDE" ]]; then
	AGY_COMMON_ARGS+=(--model "$MODEL_OVERRIDE")
fi

echo "[adv-review] Launching Reviewer 1 and Reviewer 2 in parallel..."

(
	cd "$WT_1"
	agy -p "$PROMPT_1" "${AGY_COMMON_ARGS[@]}" > "$REVIEW_1_FILE" 2> "$LOG_1_FILE"
) &
PID_1=$!

(
	cd "$WT_2"
	agy -p "$PROMPT_2" "${AGY_COMMON_ARGS[@]}" > "$REVIEW_2_FILE" 2> "$LOG_2_FILE"
) &
PID_2=$!

STATUS_1=0
STATUS_2=0
wait "$PID_1" || STATUS_1=$?
wait "$PID_2" || STATUS_2=$?

echo "[adv-review] Reviewer 1 finished (exit $STATUS_1) -> $REVIEW_1_FILE"
echo "[adv-review] Reviewer 2 finished (exit $STATUS_2) -> $REVIEW_2_FILE"

if [[ "$RUN_JUDGE" == true ]]; then
	echo "[adv-review] Launching Phase 3 Verification Judge..."
	setup_worktree "$WT_JUDGE" "local.review-judge.db" "4324"

	JUDGE_PROMPT="You are the Verification Judge (Phase 3 of the adversarial-review skill).
Read both reviewer reports:
- Reviewer 1: ${REVIEW_1_FILE}
- Reviewer 2: ${REVIEW_2_FILE}

Your mandate:
1. Do NOT modify production code or create commits.
2. For every finding reported by Reviewer 1 and Reviewer 2, reproduce or verify it directly against the code and runtime in this worktree.
3. Reject findings that rely on impossible inputs already blocked by the runtime/parser or behavior explicitly allowed by the contract.
4. Deduplicate overlapping findings from both reviewers into a single canonical issue.
5. Produce a Markdown Verdict Table with columns: ID | Finding | Source Reviewer | Status (Accepted / Rejected) | Severity | Technical Justification.
6. After the table, include a concise 'Handoff to Author (Phase 4)' section listing only Accepted findings with exact reproduction steps so the author agent can write failing tests first and then fix them."

	JUDGE_STATUS=0
	(
		cd "$WT_JUDGE"
		agy -p "$JUDGE_PROMPT" --sandbox --dangerously-skip-permissions --output-format text --print-timeout "$PRINT_TIMEOUT" ${MODEL_OVERRIDE:+--model "$MODEL_OVERRIDE"} > "$VERDICT_FILE" 2> "$RUN_DIR/judge.stderr.log"
	) || JUDGE_STATUS=$?
	echo "[adv-review] Judge finished (exit $JUDGE_STATUS) -> $VERDICT_FILE"
fi

echo ""
echo "=== Adversarial Review Complete ==="
echo "Reviewer 1 : $REVIEW_1_FILE"
echo "Reviewer 2 : $REVIEW_2_FILE"
if [[ "$RUN_JUDGE" == true ]]; then
	echo "Verdict    : $VERDICT_FILE"
else
	echo ""
	echo "Next step (Phase 3 - Judge):"
	echo "  Open Antigravity and ask:"
	echo "  \"Actúa como Juez (Fase 3 de adversarial-review) usando $REVIEW_1_FILE y $REVIEW_2_FILE contra $TARGET_REF.\""
fi

if [[ "$STATUS_1" -ne 0 || "$STATUS_2" -ne 0 ]]; then
	echo "Warning: One or more reviewers exited non-zero. Check *.stderr.log in $RUN_DIR." >&2
	exit 1
fi
