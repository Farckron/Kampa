import { beforeEach, describe, expect, it } from "vitest";
import {
  clearAll,
  clearKey,
  getDraft,
  getKey,
  setDraft,
  setKey,
} from "@/components/app/storage";
import { initialState } from "@/components/app/types";

const FAKE = "sk-ant-test-000";

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
});

describe("storage", () => {
  it("returns null when nothing is stored", () => {
    expect(getKey()).toBeNull();
    expect(getDraft()).toBeNull();
  });

  it("defaults to sessionStorage, uses localStorage when remember", () => {
    setKey(FAKE, false);
    expect(sessionStorage.getItem("kampa.key")).toBe(FAKE);
    expect(localStorage.getItem("kampa.key")).toBeNull();
    expect(getKey()).toBe(FAKE);

    clearKey();
    setKey(FAKE, true);
    expect(localStorage.getItem("kampa.key")).toBe(FAKE);
    expect(sessionStorage.getItem("kampa.key")).toBeNull();
    expect(getKey()).toBe(FAKE);
  });

  it("switching tiers does not leave the old copy behind", () => {
    setKey(FAKE, true);
    setKey("sk-ant-test-001", false);
    expect(localStorage.getItem("kampa.key")).toBeNull();
    expect(getKey()).toBe("sk-ant-test-001");
  });

  it("reads session before local", () => {
    localStorage.setItem("kampa.key", "sk-ant-test-local");
    sessionStorage.setItem("kampa.key", "sk-ant-test-session");
    expect(getKey()).toBe("sk-ant-test-session");
  });

  it("clearKey clears both tiers and leaves the draft", () => {
    localStorage.setItem("kampa.key", FAKE);
    sessionStorage.setItem("kampa.key", FAKE);
    setDraft({ intake: initialState.intake, step: 2 });
    clearKey();
    expect(getKey()).toBeNull();
    expect(getDraft()?.step).toBe(2);
  });

  it("round-trips the draft", () => {
    const intake = {
      ...initialState.intake,
      sell: "coffee",
      budget: 400,
      channels: ["Email"],
    };
    setDraft({ intake, step: 3 });
    expect(getDraft()).toEqual({ intake, step: 3 });
  });

  it("survives a corrupted draft", () => {
    sessionStorage.setItem("kampa.draft", "{not json");
    expect(getDraft()).toBeNull();
  });

  it("clearAll wipes key and draft from both tiers", () => {
    setKey(FAKE, true);
    setDraft({ intake: initialState.intake, step: 1 });
    localStorage.setItem("kampa.draft", "{}");
    clearAll();
    expect(getKey()).toBeNull();
    expect(getDraft()).toBeNull();
  });
});
