import { describe, it, expect } from "vitest";
import { createState, isFresh } from "../src/state.js";

describe("createState", function () {
  it("returns default state", function () {
    var s = createState();
    expect(s.mode).toBe("count");
    expect(s.reps).toBe(0);
    expect(s.set).toBe(1);
    expect(s.bilateral).toBe(false);
    expect(s.activeSide).toBe("L");
    expect(s.timerRemaining).toBe(0);
    expect(s.holdDuration).toBe(30);
    expect(s.restDuration).toBe(30);
    expect(s.timerRunning).toBe(false);
    expect(s.previousMode).toBe("count");
  });
});

describe("isFresh", function () {
  it("returns true for count mode with 0 reps", function () {
    var s = createState();
    expect(isFresh(s)).toBe(true);
  });

  it("returns false for count mode with reps", function () {
    var s = createState();
    s.reps = 3;
    expect(isFresh(s)).toBe(false);
  });

  it("returns true for hold mode with timer stopped", function () {
    var s = createState();
    s.mode = "hold";
    expect(isFresh(s)).toBe(true);
  });

  it("returns false for hold mode with timer running", function () {
    var s = createState();
    s.mode = "hold";
    s.timerRunning = true;
    expect(isFresh(s)).toBe(false);
  });

  it("returns false for rest mode", function () {
    var s = createState();
    s.mode = "rest";
    expect(isFresh(s)).toBe(false);
  });
});
