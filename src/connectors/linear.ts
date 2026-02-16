import { httpJson } from "./http.js";

const LINEAR_API = "https://api.linear.app/graphql";

export type LinearIssue = { id: string; title: string; url?: string };
type LinearGraphQLResponse<T> = {
  data?: T;
  errors?: unknown[];
};

export type LinearIssueDetailed = LinearIssue & {
  description?: string;
  state?: { name: string };
  assignee?: { name: string };
  createdAt?: string;
  updatedAt?: string;
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

  async getIssues(filter?: any): Promise<LinearIssueDetailed[]> {
    const query = `
      query Issues($filter: IssueFilter) {
        issues(filter: $filter, first: 50, orderBy: updatedAt) {
          nodes {
            id
            title
            url
            description
            state { name }
            assignee { name }
            createdAt
            updatedAt
          }
        }
      }
    `;

    const resp = await httpJson<LinearGraphQLResponse<{ issues?: { nodes?: LinearIssueDetailed[] } }>>({
      method: "POST",
      url: LINEAR_API,
      headers: {
        Authorization: this.token,
      },
      body: { query, variables: { filter } },
    });

    if (resp.errors?.length) {
      throw new Error(`Linear API errors: ${JSON.stringify(resp.errors)}`);
    }

    return resp.data?.issues?.nodes || [];
  }

  async getActiveIssues(assigneeId?: string): Promise<LinearIssueDetailed[]> {
    const filter: any = {
      state: {
        name: {
          nin: ["Done", "Canceled", "Cancelled"]
        }
      }
    };

    if (assigneeId) {
      filter.assignee = { id: { eq: assigneeId } };
    }

    return this.getIssues(filter);
  }
}
