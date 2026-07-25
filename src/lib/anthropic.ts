// Anthropic Messages API over plain fetch. No SDK, no deps.
// The api key lives in a local variable for the length of one call and is
// never logged, never put in a URL, never in an Error message.

const ENDPOINT = "https://api.anthropic.com/v1/messages";

export interface Usage {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

export type ApiErrorKind =
  "auth" | "rate_limit" | "overloaded" | "invalid" | "refusal" | "network";

export class ApiError extends Error {
  kind: ApiErrorKind;
  userMessage: string;
  retryAfterSec?: number;

  constructor(kind: ApiErrorKind, userMessage: string, retryAfterSec?: number) {
    super(userMessage);
    this.name = "ApiError";
    this.kind = kind;
    this.userMessage = userMessage;
    if (retryAfterSec !== undefined) this.retryAfterSec = retryAfterSec;
  }
}

/** One text block of the user message. `cache` marks a cache_control
 *  breakpoint at the end of it, so every later call whose prefix is identical
 *  up to here is billed at the cache-read rate. */
export interface UserBlock {
  text: string;
  cache?: boolean;
}

export interface StreamOptions {
  apiKey: string;
  model: string;
  system: string;
  userBlocks: UserBlock[];
  maxTokens: number;
  schema?: object;
  cacheSystem?: boolean;
  signal?: AbortSignal;
  onText?: (chunk: string) => void;
}

// Structured outputs reject validation keywords the official SDKs silently
// strip. We send raw JSON, so strip them ourselves before the wire; the
// client-side validators keep enforcing the full schema after parsing.
const UNSUPPORTED_SCHEMA_KEYS = new Set([
  "minimum",
  "maximum",
  "multipleOf",
  "minLength",
  "maxLength",
  "pattern",
  "minItems",
  "maxItems",
]);
export function apiSafeSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(apiSafeSchema);
  if (schema !== null && typeof schema === "object") {
    return Object.fromEntries(
      Object.entries(schema as Record<string, unknown>)
        .filter(([k]) => !UNSUPPORTED_SCHEMA_KEYS.has(k))
        .map(([k, v]) => [k, apiSafeSchema(v)]),
    );
  }
  return schema;
}

function httpError(
  status: number,
  retryAfter: string | null,
  serverMessage?: string,
): ApiError {
  if (status === 401 || status === 403)
    return new ApiError(
      "auth",
      "That key was rejected by Anthropic. Check it in the console, or create a new one.",
    );
  if (status === 429) {
    const sec = Number(retryAfter);
    const n = Number.isFinite(sec) && sec > 0 ? Math.round(sec) : 60;
    return new ApiError(
      "rate_limit",
      `Rate limited — wait ${n}s and try again.`,
      n,
    );
  }
  if (status === 529 || status === 503)
    return new ApiError(
      "overloaded",
      "Anthropic is overloaded right now. Try again in a minute.",
    );
  return new ApiError(
    "invalid",
    serverMessage
      ? `The request was rejected: ${serverMessage}`
      : "The request was rejected. Try regenerating.",
  );
}

// ponytail: dispatch on the JSON `type` field and ignore `event:` lines —
// they always agree, and line-buffering alone then survives any chunk split.
export async function streamMessage(
  opts: StreamOptions,
): Promise<{ text: string; usage: Usage; stopReason: string | null }> {
  const body = {
    model: opts.model,
    max_tokens: opts.maxTokens,
    stream: true,
    system: [
      {
        type: "text",
        text: opts.system,
        ...(opts.cacheSystem ? { cache_control: { type: "ephemeral" } } : {}),
      },
    ],
    messages: [
      {
        role: "user",
        content: opts.userBlocks.map((b) => ({
          type: "text",
          text: b.text,
          ...(b.cache ? { cache_control: { type: "ephemeral" } } : {}),
        })),
      },
    ],
    ...(opts.schema
      ? {
          output_config: {
            format: { type: "json_schema", schema: apiSafeSchema(opts.schema) },
          },
        }
      : {}),
  };

  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": opts.apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify(body),
      ...(opts.signal ? { signal: opts.signal } : {}),
    });
  } catch {
    throw new ApiError(
      "network",
      "Could not reach Anthropic. Check your connection.",
    );
  }

  if (!res.ok || !res.body) {
    // Server error messages never contain the api key; surface them so a 400
    // is diagnosable instead of a dead end.
    let serverMessage: string | undefined;
    try {
      const j = await res.json();
      if (typeof j?.error?.message === "string")
        serverMessage = j.error.message.slice(0, 300);
    } catch {
      /* body not JSON — keep the generic message */
    }
    throw httpError(
      res.status,
      res.headers?.get("retry-after") ?? null,
      serverMessage,
    );
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  const usage: Usage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  };
  let text = "";
  let stopReason: string | null = null;
  let stopExplanation = "";
  let buf = "";

  const handle = (raw: string): void => {
    let ev: any;
    try {
      ev = JSON.parse(raw);
    } catch {
      return;
    }
    if (ev.type === "message_start") {
      const u = ev.message?.usage ?? {};
      usage.inputTokens = u.input_tokens ?? 0;
      usage.cacheReadTokens = u.cache_read_input_tokens ?? 0;
      usage.cacheWriteTokens = u.cache_creation_input_tokens ?? 0;
    } else if (ev.type === "content_block_delta") {
      if (ev.delta?.type === "text_delta" && ev.delta.text) {
        text += ev.delta.text;
        opts.onText?.(ev.delta.text);
      }
    } else if (ev.type === "message_delta") {
      if (ev.usage?.output_tokens != null)
        usage.outputTokens = ev.usage.output_tokens;
      if (ev.delta?.stop_reason != null) stopReason = ev.delta.stop_reason;
      if (ev.delta?.stop_details?.explanation)
        stopExplanation = String(ev.delta.stop_details.explanation);
    } else if (ev.type === "error") {
      const t = ev.error?.type;
      throw t === "overloaded_error"
        ? new ApiError(
            "overloaded",
            "Anthropic is overloaded right now. Try again in a minute.",
          )
        : t === "rate_limit_error"
          ? new ApiError(
              "rate_limit",
              "Rate limited — wait 60s and try again.",
              60,
            )
          : new ApiError(
              "invalid",
              "The request was rejected. Try regenerating.",
            );
    }
  };

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buf.indexOf("\n")) !== -1) {
        const line = buf.slice(0, nl);
        buf = buf.slice(nl + 1);
        if (line.startsWith("data:")) handle(line.slice(5).trim());
      }
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    throw new ApiError(
      "network",
      "Could not reach Anthropic. Check your connection.",
    );
  }

  if (stopReason === "refusal") {
    throw new ApiError(
      "refusal",
      stopExplanation
        ? `Claude declined this request. ${stopExplanation}`
        : "Claude declined this request.",
    );
  }

  return { text, usage, stopReason };
}
