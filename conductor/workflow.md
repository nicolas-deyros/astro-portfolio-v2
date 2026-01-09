# Project Workflow

## Guiding Principles

1. **The Plan is the Source of Truth:** All work must be tracked in `plan.md`
2. **The Tech Stack is Deliberate:** Changes to the tech stack must be documented in `tech-stack.md` _before_ implementation
3. **Test-Driven Development:** Write unit tests before implementing functionality
4. **High Code Coverage:** Aim for >80% code coverage for all modules
5. **User Experience First:** Every decision should prioritize user experience
6. **Automation First:** Use provided npm scripts for workflow tasks (`session:init`, `git:start`, `docs:sync`).

## Branching & Merge Strategy

- **Main Branch Protection:** Direct commits to `master` (or `main`) are strictly forbidden.
- **Feature Branches:** All work must be performed on a dedicated branch created via `npm run git:start`.
  - Naming Convention: `type/description` (e.g., `feat/new-auth-flow`, `fix/login-bug`).
- **Pull Requests:**
  - **Draft PRs:** Created immediately upon branch creation to verify CI connectivity.
  - **Ready PRs:** Marked ready only after all tests pass and documentation is synced.
  - **Merging:** Must be done via GitHub CLI (`gh pr merge --auto`) or the web interface after checks pass.

## Agent Protocols

### 1. Session Initialization Protocol (Start of Day/Session)

Before doing anything else, ensure your environment is clean and up-to-date.

1.  **Run Initialization Script:**

    ```bash
    npm run session:init
    ```

    _This script will:_
    - Sync your local `master` with `origin/master`.
    - Check for dependency updates (`npm outdated`).
    - Auto-update dependencies if safe (`npm run deps:upgrade`).
    - Generate a status report in `.gemini/session-report.md`.

2.  **Review Report:** Check the report for any failures or significant updates.

### 2. Task Start Protocol (Start of Task)

When starting a new task from `plan.md`:

1.  **Select Task:** Mark it as `[~]` in `plan.md`.
2.  **Start Feature Branch & Draft PR:**
    ```bash
    npm run git:start <branch-name> "<description>"
    ```

    - Example: `npm run git:start feat/user-profile "Add user profile page with avatar upload"`
    - _This script will:_
      - Create and checkout the branch.
      - Push an empty commit.
      - Create a **Draft Pull Request** on GitHub to track progress.

### 3. Development Protocol (TDD Loop)

1.  **Red Phase:** Write failing tests.
2.  **Green Phase:** Implement code to pass tests.
3.  **Refactor:** Improve code quality.
4.  **Verify:** Run `npm run check` (Lint + Critical Tests).

### 4. Documentation Gate (Before Completion)

Before marking a task as `[x]` or merging:

1.  **Run Documentation Sync:**
    ```bash
    npm run docs:sync
    ```

    - _This script will:_
      - Analyze changed files.
      - Warn about documentation files (`docs/*`) that might need updates.
      - Output a proposed `CHANGELOG.md` entry.
2.  **Update Docs:** Manually update the flagged documentation files and `CHANGELOG.md`.

### 5. Delivery Protocol (End of Task)

When the task is complete, verified, and documented:

1.  **Final Check:**
    ```bash
    npm run check:full
    ```
2.  **Mark PR Ready:**
    ```bash
    gh pr ready
    ```
3.  **Enable Auto-Merge:**

    ```bash
    gh pr merge --auto --squash
    ```

    _This tells GitHub to automatically merge the PR once all CI checks (GitHub Actions, Vercel deployments, etc.) have passed._

4.  **Post-Merge Cleanup:**
    - Once merged, switch to master and sync: `npm run session:init`
    - Delete the local branch: `git branch -d feature/your-branch`

## Development Commands

### Setup & Maintenance

- `npm run session:init`: **Daily Driver.** Syncs Git, updates deps, checks health.
- `npm run git:start <branch> [desc]`: Starts a new feature with a Draft PR.
- `npm run docs:sync`: Checks for doc drift and suggests changelogs.

### Testing

- `npm run test`: Run all tests.
- `npm run check`: Quick CI check (Lint + Critical Tests).
- `npm run check:full`: Full CI suite (Lint + All Tests).

### Building

- `npm run build`: Production build.
- `npm run dev`: Dev server.

## Code Review Process

### Self-Review Checklist

1.  **Functionality:** Does it meet the requirements?
2.  **Tests:** Are there tests? Do they pass?
3.  **Docs:** Did I run `npm run docs:sync`?
4.  **Security:** No secrets leaked? Inputs sanitized?

## Emergency Procedures

### Critical Bug in Production

1.  `npm run session:init` (to get latest state).
2.  `npm run git:start hotfix/description "Emergency Fix"`.
3.  Fix, Test, `npm run check`.
4.  `gh pr ready` && `gh pr merge --auto --squash`.
