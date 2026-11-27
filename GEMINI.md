# Antigravity Workspace Rules — astro-portfolio-v2

## Mandatory Adversarial Review Protocol

Whenever you are asked to review, audit, verify, or inspect commits, branches, pull requests, or code written by another agent (such as Claude Code), you **MUST** activate and follow the `adversarial-review` skill (`.agents/skills/adversarial-review/SKILL.md` or `~/.gemini/config/skills/adversarial-review/SKILL.md`).

### Default Branch & Worktree Conventions

- The default base branch of this repository is `master` (not `main`). Always compare diffs against `master` unless the user specifies a different base ref (`git diff master...HEAD`).
- Direct commits to `master` are **forbidden** (enforced by `.husky/pre-commit` and `CLAUDE.md`). Whenever you make tracked changes, always work on a dedicated feature branch/worktree.
- Never work inside or mutate the author agent's worktree (e.g., `.claude/worktrees/<branch>`).
- For automated parallel reviews of a branch or WIP worktree, prefer `./tools/adv-review.sh <branch-or-commit> [base-branch] [--wip <author-worktree>] [--judge]`.

### Role Boundaries

1. **Adversarial Reviewer Mode (Phase 1–2):**
   - Operate strictly in **read-only reporting mode**. Do **not** edit production source files, test files, or create Git commits.
   - You may run static checks (`npm run type-check`), unit tests (`npx vitest run --project unit --config ./config/vitest.config.ts`), or one-off reproduction scripts inside your own disposable worktree.
   - **Never** run end-to-end server tests (`vitest --project e2e`) in parallel worktrees because `test/globalSetup.ts` binds hardcoded port `4321`.
   - Do not praise the code or summarize what works. Report only concrete, reproducible findings with exact `file:line`, reproduction input/scenario, expected vs. actual behavior, severity, and confidence.

2. **Verification Judge Mode (Phase 3):**
   - Read all reviewer reports (e.g., `.claude/adversarial-review/<run>/review-1.md` and `review-2.md`).
   - Reproduce every claim against the actual code/runtime before classifying it. End-to-end reproduction is allowed sequentially in a single clean worktree when needed.
   - Deduplicate overlapping findings and reject impossible or out-of-contract claims.
   - Output a structured Verdict Table (`ID`, `Finding`, `Source Reviewer`, `Status: Accepted | Rejected`, `Technical Justification`) ready to hand back to the author agent (Claude Code) for Phase 4 (red test → fix → green suite).
   - Do **not** modify production code during Phase 3 unless the user explicitly asks you to implement the fixes.
