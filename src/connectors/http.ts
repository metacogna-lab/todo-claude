import { request } from "undici";

export type HttpOptions = {
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  body?: unknown;
  timeoutMs?: number;
};

export async function httpJson<T>(opts: HttpOptions): Promise<T> {
  const { method, url, headers, body } = opts;
  const requestOptions: Record<string, unknown> = {
    method,
    headers: {
      "accept": "application/json",
      ...(body !== undefined && body !== null ? { "content-type": "application/json" } : {}),
      ...(headers ?? {}),
    },
    bodyTimeout: opts.timeoutMs ?? 30_000,
    headersTimeout: opts.timeoutMs ?? 30_000,
  };
  if (body !== undefined && body !== null) {
    requestOptions.body = typeof body === "string" ? body : JSON.stringify(body);
  }
  if (body === null) {
    requestOptions.body = null;
  }
  const res = await request(url, requestOptions);

  const text = await res.body.text();
  if (res.statusCode < 200 || res.statusCode >= 300) {
    throw new Error(`HTTP ${res.statusCode} ${method} ${url}\n${text}`);
  }
  if (!text) return {} as T;
  try {
    return JSON.parse(text) as T;
  } catch {
    // Some APIs return empty string with 204; caller should handle via generics.
    return {} as T;
  }
}
