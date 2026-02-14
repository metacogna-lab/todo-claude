import { httpJson } from "./http.js";

const LINEAR_API = "https://api.linear.app/graphql";

export type LinearIssue = { id: string; title: string; url?: string };
type LinearGraphQLResponse<T> = {
  data?: T;
  errors?: unknown[];
};

export class LinearClient {
  constructor(private token: string) {}

  async issueCreate(input: {
    teamId: string;
    title: string;
    description?: string;
    assigneeId?: string;
    labelIds?: string[];
  }): Promise<LinearIssue> {
    const mutation = `
      mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { id title url }
        }
      }
    `;

    const resp = await httpJson<LinearGraphQLResponse<{ issueCreate?: { issue?: LinearIssue } }>>({
      method: "POST",
      url: LINEAR_API,
      headers: {
        Authorization: this.token,
      },
      body: { query: mutation, variables: { input } },
    });

    if (resp.errors?.length) {
      throw new Error(`Linear API errors: ${JSON.stringify(resp.errors)}`);
    }
    const issue = resp.data?.issueCreate?.issue;
    if (!issue?.id) throw new Error(`Linear issueCreate failed: ${JSON.stringify(resp.data)}`);
    return issue as LinearIssue;
  }
}
