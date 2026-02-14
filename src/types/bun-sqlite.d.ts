declare module "bun:sqlite" {
  type QueryResultRow = Record<string, unknown>;

export class Statement<T = QueryResultRow> {
  all(...params: unknown[]): T[];
  get(...params: unknown[]): T | undefined;
  run(params?: Record<string, unknown>): void;
}

type TransactionFn<T extends (...args: any[]) => any> = (...args: Parameters<T>) => ReturnType<T>;

export class Database {
  constructor(filename?: string);
  exec(sql: string): void;
  query<T = QueryResultRow>(sql: string): Statement<T>;
  transaction<T extends (...args: any[]) => any>(fn: T): TransactionFn<T>;
  close(): void;
}
}
