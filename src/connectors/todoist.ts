import { httpJson } from "./http.js";

const TODOIST_BASE = "https://api.todoist.com/api/v1";

export type TodoistCreateTaskInput = {
  content: string;
  description?: string;
  project_id?: string;
  due_string?: string; // human (but we will pass ISO as due_string)
  due_date?: string;   // YYYY-MM-DD
  due_datetime?: string; // ISO datetime
  priority?: number;   // 1..4
  labels?: string[];
};

export type TodoistTask = {
  id: string;
  content: string;
  description?: string;
  url?: string;
  due?: {
    date?: string;
    datetime?: string;
    string?: string;
  };
  priority?: number;
  labels?: string[];
};

type TodoistTasksResponse = {
  results: TodoistTask[];
};

export class TodoistClient {
  constructor(private token: string) {}

  async createTask(input: TodoistCreateTaskInput): Promise<TodoistTask> {
    return httpJson<TodoistTask>({
      method: "POST",
      url: `${TODOIST_BASE}/tasks`,
      headers: { Authorization: `Bearer ${this.token}` },
      body: input,
    });
  }

  async getTasks(projectId?: string): Promise<TodoistTask[]> {
    const url = projectId
      ? `${TODOIST_BASE}/tasks?project_id=${projectId}`
      : `${TODOIST_BASE}/tasks`;

    const response = await httpJson<TodoistTasksResponse>({
      method: "GET",
      url,
      headers: { Authorization: `Bearer ${this.token}` },
    });

    return response.results || [];
  }

  async getActiveTasks(): Promise<TodoistTask[]> {
    return this.getTasks();
  }
}
