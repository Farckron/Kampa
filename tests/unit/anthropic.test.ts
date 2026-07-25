import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { ApiError, apiSafeSchema, streamMessage } from "@/lib/anthropic";

const KEY = "sk-ant-test-0000000000000000000000";

const sse = (type: string, data: object): string =>
  `event: ${type}\ndata: ${JSON.stringify({ type, ...data })}\n\n`;

const START = sse("message_start", {
  message: {
    usage: {
      input_tokens: 120,
      cache_creation_input_tokens: 300,
      cache_read_input_tokens: 900,
    },
  },
});
const delta = (text: string) =>
  sse("content_block_delta", { index: 0, delta: { type: "text_delta", text } });
const stop = (stop_reason: string, stop_details?: object) =>
  sse("message_delta", {
    delta: { stop_reason, ...(stop_details ? { stop_details } : {}) },
    usage: { output_tokens: 42 },
  });

/** Encode the whole SSE script, then hand it back in arbitrary byte slices. */
function streamOf(script: string, cuts: number[]): ReadableStream<Uint8Array> {
  const bytes = new TextEncoder().encode(script);
  const bounds = [...cuts, bytes.length];
  let at = 0;
  const chunks = bounds.map((b) => bytes.slice(at, (at = b)));
  return new ReadableStream({
    start(c) {
      for (const ch of chunks) if (ch.length) c.enqueue(ch);
      c.close();
    },
  });
}

const ok = (script: string, cuts: number[] = []) =>
  new Response(streamOf(script, cuts), { status: 200 });

const fail = (status: number, headers?: Record<string, string>) =>
  new Response("{}", { status, headers });

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const run = (over: Partial<Parameters<typeof streamMessage>[0]> = {}) =>
  streamMessage({
    apiKey: KEY,
    model: "claude-sonnet-5",
    system: "You are a marketing strategist.",
    userBlocks: [{ text: "Make a plan." }],
    maxTokens: 3000,
    ...over,
  });

describe("streamMessage", () => {
  it("assembles text across chunks that split mid-line", async () => {
    const script =
      START +
      delta("Hello ") +
      delta("brave ") +
      delta("world") +
      stop("end_turn");
    // Cuts land inside SSE lines and inside events, not on boundaries.
    const cuts = [7, 45, 130, 190, 240, 300, 360, 420];
    fetchMock.mockResolvedValue(ok(script, cuts));

    const r = await run();
    expect(r.text).toBe("Hello brave world");
    expect(r.stopReason).toBe("end_turn");
    expect(r.usage).toEqual({
      inputTokens: 120,
      outputTokens: 42,
      cacheReadTokens: 900,
      cacheWriteTokens: 300,
    });
  });

  it("calls onText once per delta", async () => {
    fetchMock.mockResolvedValue(
      ok(START + delta("a") + delta("b") + delta("c") + stop("end_turn")),
    );
    const onText = vi.fn();
    await run({ onText });
    expect(onText.mock.calls).toEqual([["a"], ["b"], ["c"]]);
  });

  it("maps 401 to kind auth", async () => {
    fetchMock.mockResolvedValue(fail(401));
    const e = await run().catch((x) => x);
    expect(e).toBeInstanceOf(ApiError);
    expect(e.kind).toBe("auth");
    expect(e.userMessage).toMatch(/rejected by Anthropic/);
  });

  it("maps 429 and parses retry-after", async () => {
    fetchMock.mockResolvedValue(fail(429, { "retry-after": "7" }));
    const e = await run().catch((x) => x);
    expect(e.kind).toBe("rate_limit");
    expect(e.retryAfterSec).toBe(7);
    expect(e.userMessage).toContain("7s");
  });

  it("maps 529 to kind overloaded", async () => {
    fetchMock.mockResolvedValue(fail(529));
    const e = await run().catch((x) => x);
    expect(e.kind).toBe("overloaded");
    expect(e.userMessage).toMatch(/overloaded/);
  });

  it("maps a network failure to kind network", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const e = await run().catch((x) => x);
    expect(e.kind).toBe("network");
  });

  it("throws refusal with the explanation appended", async () => {
    fetchMock.mockResolvedValue(
      ok(
        START +
          delta("I ") +
          stop("refusal", {
            category: "harmful",
            explanation: "Not doing that.",
          }),
      ),
    );
    const e = await run().catch((x) => x);
    expect(e.kind).toBe("refusal");
    expect(e.userMessage).toBe("Claude declined this request. Not doing that.");
  });

  it("sends exactly the documented headers and body", async () => {
    fetchMock.mockResolvedValue(ok(START + delta("x") + stop("end_turn")));
    const schema = { type: "object", properties: { a: { type: "string" } } };
    await run({
      schema,
      cacheSystem: true,
      maxTokens: 4000,
      userBlocks: [
        { text: "Here is the business.", cache: true },
        { text: "Make a plan." },
      ],
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.anthropic.com/v1/messages");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "content-type": "application/json",
      "x-api-key": KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    });

    const body = JSON.parse(init.body);
    expect(body).toMatchObject({
      model: "claude-sonnet-5",
      max_tokens: 4000,
      stream: true,
      output_config: { format: { type: "json_schema", schema } },
    });
    expect(body.system[0]).toEqual({
      type: "text",
      text: "You are a marketing strategist.",
      cache_control: { type: "ephemeral" },
    });
    // the intake block is a cache breakpoint too; the task block is not
    expect(body.messages).toEqual([
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Here is the business.",
            cache_control: { type: "ephemeral" },
          },
          { type: "text", text: "Make a plan." },
        ],
      },
    ]);
    expect("temperature" in body).toBe(false);
    expect("top_p" in body).toBe(false);
    expect("top_k" in body).toBe(false);
  });

  it("omits cache_control and output_config when not asked", async () => {
    fetchMock.mockResolvedValue(ok(START + delta("x") + stop("end_turn")));
    await run();
    const body = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(body.system[0].cache_control).toBeUndefined();
    expect(body.messages[0].content[0].cache_control).toBeUndefined();
    expect(body.output_config).toBeUndefined();
  });

  it("never leaks the api key in error messages", async () => {
    for (const res of [
      fail(401),
      fail(429, { "retry-after": "7" }),
      fail(529),
      fail(400),
    ]) {
      fetchMock.mockResolvedValue(res);
      const e = await run().catch((x) => x);
      expect(`${e.message} ${e.userMessage} ${e.stack}`).not.toContain(KEY);
      expect(`${e.message} ${e.userMessage}`).not.toContain("sk-ant");
    }
  });
});

describe("apiSafeSchema", () => {
  it("strips unsupported validation keywords recursively, keeps the rest", () => {
    const schema = {
      type: "object",
      additionalProperties: false,
      required: ["items"],
      properties: {
        items: {
          type: "array",
          minItems: 12,
          maxItems: 12,
          items: {
            type: "object",
            properties: {
              week: { type: "integer", minimum: 1, maximum: 12 },
              title: { type: "string", minLength: 1 },
            },
            required: ["week", "title"],
            additionalProperties: false,
          },
        },
      },
    };
    const safe = apiSafeSchema(schema) as Record<string, unknown>;
    const s = JSON.stringify(safe);
    for (const k of [
      "minItems",
      "maxItems",
      "minimum",
      "maximum",
      "minLength",
    ]) {
      expect(s).not.toContain(`"${k}"`);
    }
    expect(s).toContain('"additionalProperties":false');
    expect(s).toContain('"required"');
    expect(s).toContain('"week"');
  });

  it("is applied to the wire body", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        streamOf(
          sse("message_start", {
            type: "message_start",
            message: { usage: { input_tokens: 1 } },
          }) +
            sse("message_delta", {
              type: "message_delta",
              usage: { output_tokens: 1 },
              delta: { stop_reason: "end_turn" },
            }) +
            sse("message_stop", { type: "message_stop" }),
          [],
        ),
        { status: 200 },
      ),
    );
    await streamMessage({
      apiKey: "sk-ant-test-000",
      model: "claude-sonnet-5",
      system: "s",
      userBlocks: [{ text: "u" }],
      maxTokens: 10,
      schema: { type: "array", minItems: 3, items: { type: "string" } },
    });
    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(JSON.stringify(body.output_config)).not.toContain("minItems");
  });

  it("surfaces the server error message on 400", async () => {
    fetchMock.mockResolvedValue(
      new Response(
        JSON.stringify({
          type: "error",
          error: {
            type: "invalid_request_error",
            message: "output_config.format.schema: minItems is not supported",
          },
        }),
        { status: 400 },
      ),
    );
    const e = await run().catch((x) => x);
    expect(e.kind).toBe("invalid");
    expect(e.userMessage).toContain("minItems is not supported");
  });
});
