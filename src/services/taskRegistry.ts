import { buildTask, Task, TaskInput } from "../schema/task.js";

const tasks: Task[] = [];

export const taskRegistry = {
  list(): Task[] {
    return [...tasks].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  },

  create(input: TaskInput): Task {
    const task = buildTask(input);
    tasks.unshift(task);
    return task;
  },

  clear(): void {
    tasks.length = 0;
  }
};
