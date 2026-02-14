import { request } from "undici";

export type WebSearchResult = {
  query: string;
  answer?: string;
  results: Array<{
    title: string;
    url: string;
    content: string;
  }>;
};

export async function webSearch(query: string): Promise<WebSearchResult> {
  if (!query.trim()) throw new Error("webSearch requires a non-empty query");

  const apiKey = process.env.TAVILY_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY missing; cannot perform web search");
  }

  const response = await request("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-apis-key": apiKey,
    },
    body: JSON.stringify({
      query,
      include_answer: true,
    }),
  });

  if (response.statusCode < 200 || response.statusCode >= 300) {
    const text = await response.body.text();
    throw new Error(`Tavily search failed (${response.statusCode}): ${text}`);
  }

  type TavilyResponse = {
    answer?: string;
    results?: Array<{ title?: string; url?: string; content?: string }>;
  };

  const data = (await response.body.json()) as TavilyResponse;
  return {
    query,
    answer: data.answer,
    results: (data.results ?? []).map((item: NonNullable<TavilyResponse["results"]>[number]) => ({
      title: item.title ?? "Untitled",
      url: item.url ?? "",
      content: item.content ?? "",
    })),
  };
}
