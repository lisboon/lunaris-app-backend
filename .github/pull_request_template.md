<p align="center">
  <img src="./assets/lunaris-constellation-white.svg#gh-dark-mode-only" height="90">
  <img src="./assets/lunaris-constellation-mono.svg#gh-light-mode-only" height="90">
</p>

<h3 align="center">
  Lunaris<span style="color: #c8ec3f;">.</span>
</h3>


## Description
<!-- Summarize what has been done. GitHub Copilot/Claude uses this to understand the overall context. -->
<!-- What was done and why. Link the related issue: Closes #123 -->

## Changes
<!-- This section will be used to generate release notes. Keep it concise. -->
<!-- Suggested format: 
  [FEAT] Added DAG Validation Service to detect mission graph cycles
  [FIX] Resolved dual-write bug in AcceptInviteUseCase transaction
  [REFACTOR] Extracted Prisma queries to custom QueryBuilder
-->

## How to Test / Points to Consider
<!-- This helps the reviewer and Copilot/Claude know where to focus. -->
1. Simple step-by-step instructions for testing (e.g., Hit `POST /missions/:id/versions` with a cyclic graph to see the 422 error response).
2. Indicate whether there were any changes to the database (e.g., "Requires running `npx prisma migrate dev`") or environment variables.

## Checklist
- [ ] The code compiles/runs without any new errors.
- [ ] I performed a self-review of my own code.
- [ ] No leftover debug code (`console.log`, commented blocks) remains.
- [ ] Dependencies (if any) have been updated.
- [ ] I ensured no framework/infra imports leaked into the Domain layer (`src/modules/*/domain`).
- [ ] I updated the corresponding skill in `.claude/skills/`.