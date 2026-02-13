import { randomUUID } from "node:crypto";
import { z } from "zod";

export const IntegrationStatusEnum = z.enum(["configured", "missing", "partial"]);

export const IntegrationProfileSchema = z.object({
  id: z.string().uuid(),
  obsidianVaultPath: z.string().optional(),
  todoistProjectId: z.string().optional(),
  linearTeamId: z.string().optional(),
  status: IntegrationStatusEnum,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type IntegrationProfile = z.infer<typeof IntegrationProfileSchema>;

export function buildIntegrationProfile(input: Partial<IntegrationProfile> = {}): IntegrationProfile {
  const nowIso = new Date().toISOString();
  const status =
    input.status ??
    (input.obsidianVaultPath && input.todoistProjectId && input.linearTeamId
      ? "configured"
      : (input.obsidianVaultPath || input.todoistProjectId || input.linearTeamId) ? "partial" : "missing");

  return IntegrationProfileSchema.parse({
    id: input.id ?? randomUUID(),
    obsidianVaultPath: input.obsidianVaultPath,
    todoistProjectId: input.todoistProjectId,
    linearTeamId: input.linearTeamId,
    status,
    createdAt: input.createdAt ?? nowIso,
    updatedAt: nowIso,
  });
}
