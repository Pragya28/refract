/**
 * The one boundary that matters: { key, model, prompt } in, structured review out.
 * Talks to any OpenAI-compatible endpoint (OmniRoute in dev, LiteLLM in prod) —
 * switching gateways is a `baseUrl` change, never a code change.
 */

export interface ReviewRequest {
  /** API key for the gateway / provider. */
  key: string;
  /** Model id, e.g. "anthropic/claude-sonnet-5". */
  model: string;
  /** Fully-formed prompt: guidelines + PR diff + linter output. */
  prompt: string;
  /** OpenAI-compatible base URL. Default: env REFRACT_GATEWAY_URL. */
  baseUrl?: string;
  /** Abort/timeout signal, owned by the caller. */
  signal?: AbortSignal;
}

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export interface ReviewIssue {
  file?: string;
  line?: number;
  severity: Severity;
  message: string;
}

export interface Review {
  summary: string;
  issues: ReviewIssue[];
  verdict: "approve" | "comment" | "request_changes";
  usage?: { promptTokens: number; completionTokens: number };
}

const SYSTEM = `You are a code reviewer. Respond ONLY with JSON matching:
{"summary": string, "issues": [{"file"?: string, "line"?: number, "severity": "CRITICAL"|"HIGH"|"MEDIUM"|"LOW", "message": string}], "verdict": "approve"|"comment"|"request_changes"}`;

export async function review(req: ReviewRequest): Promise<Review> {
  const baseUrl =
    req.baseUrl ?? process.env.REFRACT_GATEWAY_URL ?? "http://localhost:4000";

  const res = await fetch(`${baseUrl.replace(/\/$/, "")}/v1/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${req.key}`,
    },
    body: JSON.stringify({
      model: req.model,
      messages: [
        { role: "system", content: SYSTEM },
        { role: "user", content: req.prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0,
    }),
    signal: req.signal,
  });

  if (!res.ok) {
    throw new Error(`gateway ${res.status}: ${await res.text()}`);
  }

  const body = (await res.json()) as {
    choices: { message: { content: string } }[];
    usage?: { prompt_tokens: number; completion_tokens: number };
  };

  const parsed = parseReview(body.choices[0]?.message.content ?? "");
  if (body.usage) {
    parsed.usage = {
      promptTokens: body.usage.prompt_tokens,
      completionTokens: body.usage.completion_tokens,
    };
  }
  return parsed;
}

/** Exported for testing — tolerates ```json fences around the object. */
export function parseReview(content: string): Review {
  const json = content.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
  const obj = JSON.parse(json) as Review;
  if (!obj.summary || !Array.isArray(obj.issues) || !obj.verdict) {
    throw new Error("malformed review object from model");
  }
  return obj;
}
