import type { Intake } from "./types";

const KEY = "kampa.key";
const DRAFT = "kampa.draft";

// ponytail: island is client-only, but this keeps SSR/prerender from exploding
// if a component ever reads storage during render.
const stores = (): Storage[] =>
  typeof window === "undefined"
    ? []
    : [window.sessionStorage, window.localStorage];

function read(name: string): string | null {
  for (const s of stores()) {
    const v = s.getItem(name);
    if (v !== null) return v;
  }
  return null;
}

export function getKey(): string | null {
  return read(KEY);
}

export function setKey(key: string, remember: boolean): void {
  const [session, local] = stores();
  if (!session || !local) return;
  clearKey();
  (remember ? local : session).setItem(KEY, key);
}

export function clearKey(): void {
  for (const s of stores()) s.removeItem(KEY);
}

export function getDraft(): { intake: Intake; step: number } | null {
  const raw = read(DRAFT);
  if (raw === null) return null;
  try {
    return JSON.parse(raw) as { intake: Intake; step: number };
  } catch {
    return null;
  }
}

export function setDraft(d: { intake: Intake; step: number }): void {
  const [session] = stores();
  if (!session) return;
  session.setItem(DRAFT, JSON.stringify(d));
}

export function clearAll(): void {
  for (const s of stores()) {
    s.removeItem(KEY);
    s.removeItem(DRAFT);
  }
}
