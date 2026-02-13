# Structural Error Log

| Phase | Gap | Source Reference | Impact | Status |
| --- | --- | --- | --- | --- |
| phase1 | No EventEnvelope ingestion layer implemented | `.agents/DATAMODEL.md` §3 | Trace IDs cannot originate at ingress → no upstream linking | resolved in `phase1-event-context` |
| phase1 | Missing PlanningContext builder feeding Claude | `.agents/DATAMODEL.md` §4 | Agent currently plans without governed context → schema invariants unenforced | resolved in `phase1-event-context` |
| phase2 | Execution graph + DetailSource link graph absent | `.agents/DATAMODEL.md` §§7–12 | Cannot audit actions, external IDs, or receipts | resolved in `phase2-execution-links` |
| global | Verification/audit + enforcement policy pipeline missing | `.agents/DATAMODEL.md` §13–16, `AGENTS.md` Workflow Guardrails | No automated checks for receipts, Langfuse, DevTools captures | open |
| global | Governance automation (branch discipline/tests per phase) undocumented in repo | `AGENTS.md`, `.agents/ERRORS.md` | Hard to ensure agents follow branch/test/merge mandates | open |
