# Post-Test Commit Skill

Help the user commit their changes after they've tested the application.

## When to use

When the user runs `/commit` or asks to commit changes after testing.

## What to do

1. **Review the changes** - Look at `git status --short` output from the command
2. **Categorize the changes** - Identify which apps/packages were modified
3. **Suggest a commit message** - Based on the changes, propose a conventional commit message
4. **Ask for confirmation** - Before committing, verify the message with the user
5. **Commit if approved** - Use `git add -A && git commit` with the agreed message
6. **Include co-authored-by trailer** for Claude contributions

## Commit message format

Use conventional commits:
- `feat(scope): description` - New features
- `fix(scope): description` - Bug fixes
- `refactor(scope): description` - Code restructuring
- `chore(scope): description` - Maintenance tasks

Include the co-authored-by trailer:
```
Co-Authored-By: Claude Opus 5 (1M context) <noreply@anthropic.com>
```

## Example workflow

User: `/commit`

You:
1. Review: "I see changes in customer dashboard and shared-core types..."
2. Suggest: "How about: `feat(customer): update dashboard sidebar and shared types`"
3. Wait for user approval or modification
4. Commit: `git add -A && git commit -m "..."`
5. Confirm: "✓ Committed successfully!"
