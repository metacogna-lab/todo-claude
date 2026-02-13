import { type ExecutionResult, type Plan } from "../plan/schema.js";

export function buildReceiptMarkdown(plan: Plan, exec: ExecutionResult): string {
  const lines: string[] = [];
  lines.push(`## Receipt`);
  lines.push(`- traceId: \`${plan.traceId}\``);
  lines.push(`- intent: ${plan.userIntent}`);
  lines.push(`- summary: ${plan.receiptSummary}`);
  if (plan.assumptions.length) {
    lines.push(`- assumptions:`);
    for (const a of plan.assumptions) lines.push(`  - ${a}`);
  }

  if (exec.todoist.createdTasks.length) {
    lines.push(`\n### Todoist`);
    for (const t of exec.todoist.createdTasks) {
      lines.push(`- [ ] ${t.content} (id: \`${t.id}\`${t.url ? `, url: ${t.url}` : ""})`);
    }
  }

  if (exec.linear.createdIssues.length) {
    lines.push(`\n### Linear`);
    for (const i of exec.linear.createdIssues) {
      lines.push(`- ${i.title} (id: \`${i.id}\`${i.url ? `, url: ${i.url}` : ""})`);
    }
  }

  if (exec.warnings.length) {
    lines.push(`\n### Warnings`);
    for (const w of exec.warnings) lines.push(`- ${w}`);
  }

  lines.push("");
  return lines.join("\n");
}
