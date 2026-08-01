# remove all logs on frontend

**Status:** DRAFT — awaiting review
**Author:** you
**Created:** 2026-07-30

> Write the plan before you write the code. Approve it. Then ship. 
## 1. Problem

What problem does this plan solve? One paragraph.

- Frontend logs expose sensitive authentication data and increase bundle size
- Production console logs leak internal implementation details and can aid attackers
- Need to preserve structured auth logs for security auditing while removing debug noise


## 2. Approach

How are you going to solve it? Constraints, assumptions, trade-offs.

- Use **Plan subagent** to design the logging strategy:
  - Define what qualifies as an authentication log
  - Design JSON log structure (minimal fields: timestamp, level, event, context)
  - Plan migration path for existing auth logs
  - Identify any shared logging utilities to update



Adeptly checks each path against the codebase and warns on mismatches.

- Use **Explore agent** (`medium` breadth) to search for all logging patterns: `console.log`, `console.error`, `console.warn`, `logger.*`, `log.*` across frontend source files
- Identify authentication-related logs vs. general debug logs
- Create an inventory of all log locations before removal

- Use **ast-grep or grep** with patterns to categorize logs:
  - Auth-related: `login`, `auth`, `token`, `session`, `credential` context
  - Debug/general: everything else
- Export inventory to a markdown file for review before making changes

- Use **Worktree isolation** to experiment with log removals without polluting your main branch
- Consider environment-based logging: keep dev logs in development builds, strip all logs for production
- Use **fewer-permission-prompts skill** after discovery to allowlist the grep/find commands you'll use repeatedly




## 4. Flow

```mermaid
flowchart LR
  A[Start] --> B[Step 1]
  B --> C[Step 2]
  C --> D[Done]
```

- **Create tasks** for tracking progress:
  1. Inventory all existing frontend logs
  2. Categorize logs (auth vs. non-auth)
  3. Design JSON log schema
  4. Update authentication logging
  5. Remove non-auth logs
  6. Verify no regressions

- After removing logs, **use grep** to verify no `console.log`/`console.error` remain in frontend source (excluding auth paths)
- **Run the app** or tests to ensure nothing broke from log removal
- **Use simplify skill** as a final pass to catch any orphaned log-related code

- **Rollback plan:** Keep a backup branch with original state; if tests fail, revert worktree changes and review inventory
- **Completion criteria:** No console.log/warn/error in production build; auth logs emit structured JSON; all tests pass; manual smoke test of auth flows




## 5. Risks

- Risk 1 — mitigation.

- **Risk:** Accidentally removing authentication logs that are needed for security auditing
  - *Mitigation:* Create explicit allowlist of auth log locations before removal; verify each file manually
- **Risk:** Losing debugging capability for frontend issues
  - *Mitigation:* Keep auth logs with proper JSON structure; consider environment-based debug flag for development
- **Risk:** Future developers adding back console.log statements
  - *Mitigation:* Add **PreToolUse hook** to block or warn on edits containing console.log in frontend files

- **Risk:** Breaking production debugging without adequate replacement
  - *Mitigation:* Preserve auth logs in structured format; document rollback steps; use worktree to safely test before merging

- **Risk:** Security regression if auth logs removed improperly
  - *Mitigation:* Explicit allowlist of auth log locations; peer review of all auth-related changes



## 6. Approval

Approve in the panel below when ready.
