import { describe, it, expect } from "vitest";
import { createState, isFresh, actionTap, transitionTap } from "../src/state.js";

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

describe("actionTap", function () {
  it("increments reps in count mode", function () {
    var s = createState();
    var result = actionTap(s);
    expect(result.state.reps).toBe(1);
    expect(result.effects).toEqual([]);
  });

  it("accumulates reps over multiple taps", function () {
    var s = createState();
    var r1 = actionTap(s);
    var r2 = actionTap(r1.state);
    var r3 = actionTap(r2.state);
    expect(r3.state.reps).toBe(3);
  });

  it("does not change mode", function () {
    var s = createState();
    var result = actionTap(s);
    expect(result.state.mode).toBe("count");
  });
});

describe("transitionTap", function () {
  describe("in count mode", function () {
    it("does nothing with 0 reps", function () {
      var s = createState();
      var result = transitionTap(s);
      expect(result.state.mode).toBe("count");
      expect(result.state.reps).toBe(0);
    });

    it("transitions to rest with reps > 0", function () {
      var s = createState();
      s.reps = 10;
      var result = transitionTap(s);
      expect(result.state.mode).toBe("rest");
    });

    it("sets previousMode to count", function () {
      var s = createState();
      s.reps = 10;
      var result = transitionTap(s);
      expect(result.state.previousMode).toBe("count");
    });

    it("starts rest timer with restDuration", function () {
      var s = createState();
      s.reps = 10;
      var result = transitionTap(s);
      expect(result.state.timerRunning).toBe(true);
      expect(result.state.timerRemaining).toBe(30);
    });

    it("resets reps to 0", function () {
      var s = createState();
      s.reps = 10;
      var result = transitionTap(s);
      expect(result.state.reps).toBe(0);
    });
  });
});
