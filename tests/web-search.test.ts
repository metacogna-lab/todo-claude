import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";

describe("webSearch", () => {
beforeEach(() => {
  delete process.env.TAVILY_API_KEY;
});
afterEach(() => {
  delete process.env.TAVILY_API_KEY;
  vi.restoreAllMocks();
});

it("throws when API key missing", async () => {
  const { webSearch } = await import("../src/plugins/webSearch.js");
    await expect(webSearch("test query")).rejects.toThrow("TAVILY_API_KEY missing");
  });

  it("calls Tavily endpoint when key provided", async () => {
    process.env.TAVILY_API_KEY = "test-key";
    const { webSearch } = await import("../src/plugins/webSearch.js");
    const mockResponse = {
      statusCode: 200,
      body: {
        text: async () => "",
        json: async () => ({
          answer: "test",
          results: [{ title: "Doc", url: "https://example.com", content: "content" }],
        }),
      },
    } as any;
    const spy = vi.spyOn(await import("undici"), "request").mockResolvedValue(mockResponse);
    const result = await webSearch("hello world");
    expect(spy).toHaveBeenCalled();
    expect(result.results[0]?.url).toBe("https://example.com");
  });
});
