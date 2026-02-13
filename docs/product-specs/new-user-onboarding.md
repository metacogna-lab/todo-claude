# New User Onboarding Spec

## Goal
Deliver a scripted onboarding path that connects Obsidian vaults, Todoist projects, and Linear issues within five minutes.

## Success Metrics
- 80% of new users complete setup without human help.
- First Langfuse trace for onboarding flow stays < 10s end-to-end.

## Requirements
1. Auth + connector discovery wizard inside the browser.
2. Chrome DevTools logging template for QA to verify local state.
3. Langfuse spans surrounding connector validations.
4. Schema: `integration_profile` defined in `src/schema` with fixtures.

## Open Questions
- Do we block on Linear API scopes for sub-issues?
- Should we expose a dry-run mode for Todoist imports?
