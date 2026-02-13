import { buildIntegrationProfile, IntegrationProfile } from "../schema/integrationProfile.js";

export function deriveIntegrationProfile(env: NodeJS.ProcessEnv = process.env): IntegrationProfile {
  return buildIntegrationProfile({
    obsidianVaultPath: env.OBSIDIAN_VAULT_PATH,
    todoistProjectId: env.TODOIST_DEFAULT_PROJECT_ID,
    linearTeamId: env.LINEAR_DEFAULT_TEAM_ID,
  });
}
