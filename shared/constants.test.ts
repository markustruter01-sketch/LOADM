import { describe, expect, it } from "vitest";
import { isPassing, passMarkFor, roleHas, isFlyingSquadron, THRESHOLDS } from "./constants";

describe("pass mark resolution", () => {
  it("falls back to the default pass mark", () => {
    expect(passMarkFor({})).toBe(THRESHOLDS.DEFAULT_PASS_MARK);
    expect(passMarkFor({ passingThreshold: null })).toBe(THRESHOLDS.DEFAULT_PASS_MARK);
  });
  it("uses the item's own threshold when set", () => {
    expect(passMarkFor({ passingThreshold: 85 })).toBe(85);
    expect(isPassing(84, { passingThreshold: 85 })).toBe(false);
    expect(isPassing(85, { passingThreshold: 85 })).toBe(true);
  });
});

describe("roles", () => {
  it("builds capabilities cumulatively", () => {
    expect(roleHas("student", "train")).toBe(true);
    expect(roleHas("student", "operate")).toBe(false);
    expect(roleHas("loadmaster", "operate")).toBe(true);
    expect(roleHas("instructor", "command")).toBe(false);
    expect(roleHas("command", "instruct")).toBe(true);
  });
});

describe("squadrons", () => {
  it("distinguishes flying squadrons from AMG", () => {
    expect(isFlyingSquadron("33SQN")).toBe(true);
    expect(isFlyingSquadron("AMG")).toBe(false);
    expect(isFlyingSquadron("33")).toBe(false);
  });
});
