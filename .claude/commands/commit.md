description: Generate a commit message from staged changes (ask before committing)
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git log:*), Bash(git commit:*)
—

## Context
- git status:
!`git status`

- staged diff:
!`git diff --cached`

- recent commits:
!`git log --oneline -10`

## Task
1) Propose ONE commit message (prefer Conventional Commits: feat/fix/refactor/chore/docs/test).
2) Keep the subject line <= 72 chars, imperative mood.
3) Do NOT add any AI attribution (e.g. “Generated with …”).
4) Ask me to confirm the final message.
5) Only after I confirm, run: `git commit -m ”<message>“`.

# Example
feat(cms): add page management system with tree structure
