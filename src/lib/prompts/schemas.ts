// JSON Schemas sent as output_config.format, plus hand-rolled validators for
// what comes back. The schemas mirror src/components/app/types.ts exactly; if
// a type changes there, both the schema and its validator change here.
import type { CalendarItem, CopyAsset, Strategy } from "@/components/app/types";

const channelChoice = {
  type: "object",
  additionalProperties: false,
  required: ["channel", "reason"],
  properties: {
    channel: { type: "string" },
    reason: { type: "string" },
  },
} as const;

export const STRATEGY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["positioning", "icp", "chosen", "rejected", "budgetSplit", "kpis"],
  properties: {
    positioning: { type: "string" },
    icp: { type: "string" },
    chosen: { type: "array", minItems: 2, maxItems: 3, items: channelChoice },
    rejected: { type: "array", minItems: 3, items: channelChoice },
    budgetSplit: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "eur"],
        properties: { item: { type: "string" }, eur: { type: "number" } },
      },
    },
    kpis: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "target", "where"],
        properties: {
          name: { type: "string" },
          target: { type: "string" },
          where: { type: "string" },
        },
      },
    },
  },
};

export const CALENDAR_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  properties: {
    items: {
      type: "array",
      minItems: 12,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["week", "channel", "assetType", "title", "minutes"],
        properties: {
          week: { type: "integer", minimum: 1, maximum: 12 },
          channel: { type: "string" },
          assetType: { type: "string" },
          title: { type: "string" },
          minutes: { type: "integer", minimum: 1 },
        },
      },
    },
  },
};

export const COPY_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["assets"],
  properties: {
    assets: {
      type: "array",
      minItems: 1,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["week", "channel", "title", "body"],
        properties: {
          week: { type: "integer", minimum: 1, maximum: 12 },
          channel: { type: "string" },
          title: { type: "string" },
          body: { type: "string" },
        },
      },
    },
  },
};

function obj(x: unknown, at: string): Record<string, unknown> {
  if (typeof x !== "object" || x === null || Array.isArray(x))
    throw new Error(`${at}: expected an object, got ${describe(x)}`);
  return x as Record<string, unknown>;
}

function str(x: unknown, at: string): string {
  if (typeof x !== "string" || x.trim() === "")
    throw new Error(`${at}: expected a non-empty string, got ${describe(x)}`);
  return x;
}

function num(x: unknown, at: string): number {
  if (typeof x !== "number" || !Number.isFinite(x))
    throw new Error(`${at}: expected a number, got ${describe(x)}`);
  return x;
}

function week(x: unknown, at: string): number {
  const n = num(x, at);
  if (!Number.isInteger(n) || n < 1 || n > 12)
    throw new Error(`${at}: expected an integer week 1-12, got ${n}`);
  return n;
}

function arr(x: unknown, at: string, min: number, max?: number): unknown[] {
  if (!Array.isArray(x))
    throw new Error(`${at}: expected an array, got ${describe(x)}`);
  if (x.length < min)
    throw new Error(`${at}: expected at least ${min} entries, got ${x.length}`);
  if (max !== undefined && x.length > max)
    throw new Error(`${at}: expected at most ${max} entries, got ${x.length}`);
  return x;
}

function describe(x: unknown): string {
  if (x === null) return "null";
  if (Array.isArray(x)) return "an array";
  return typeof x;
}

function choices(x: unknown, at: string, min: number, max?: number) {
  return arr(x, at, min, max).map((raw, i) => {
    const c = obj(raw, `${at}[${i}]`);
    return {
      channel: str(c.channel, `${at}[${i}].channel`),
      reason: str(c.reason, `${at}[${i}].reason`),
    };
  });
}

export function validateStrategy(x: unknown): Strategy {
  const s = obj(x, "strategy");
  return {
    positioning: str(s.positioning, "strategy.positioning"),
    icp: str(s.icp, "strategy.icp"),
    chosen: choices(s.chosen, "strategy.chosen", 2, 3),
    rejected: choices(s.rejected, "strategy.rejected", 3),
    budgetSplit: arr(s.budgetSplit, "strategy.budgetSplit", 1).map((raw, i) => {
      const b = obj(raw, `strategy.budgetSplit[${i}]`);
      return {
        item: str(b.item, `strategy.budgetSplit[${i}].item`),
        eur: num(b.eur, `strategy.budgetSplit[${i}].eur`),
      };
    }),
    kpis: arr(s.kpis, "strategy.kpis", 3, 3).map((raw, i) => {
      const k = obj(raw, `strategy.kpis[${i}]`);
      return {
        name: str(k.name, `strategy.kpis[${i}].name`),
        target: str(k.target, `strategy.kpis[${i}].target`),
        where: str(k.where, `strategy.kpis[${i}].where`),
      };
    }),
  };
}

export function validateCalendar(x: unknown): CalendarItem[] {
  const items = arr(obj(x, "calendar").items, "calendar.items", 12);
  return items.map((raw, i) => {
    const it = obj(raw, `calendar.items[${i}]`);
    const minutes = num(it.minutes, `calendar.items[${i}].minutes`);
    if (!Number.isInteger(minutes) || minutes < 1)
      throw new Error(
        `calendar.items[${i}].minutes: expected a positive integer, got ${minutes}`,
      );
    return {
      week: week(it.week, `calendar.items[${i}].week`),
      channel: str(it.channel, `calendar.items[${i}].channel`),
      assetType: str(it.assetType, `calendar.items[${i}].assetType`),
      title: str(it.title, `calendar.items[${i}].title`),
      minutes,
    };
  });
}

export function validateCopy(x: unknown): CopyAsset[] {
  const assets = arr(obj(x, "copy").assets, "copy.assets", 1);
  return assets.map((raw, i) => {
    const a = obj(raw, `copy.assets[${i}]`);
    return {
      week: week(a.week, `copy.assets[${i}].week`),
      channel: str(a.channel, `copy.assets[${i}].channel`),
      title: str(a.title, `copy.assets[${i}].title`),
      body: str(a.body, `copy.assets[${i}].body`),
    };
  });
}
