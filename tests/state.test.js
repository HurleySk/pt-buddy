import { describe, it, expect } from "vitest";
import { createState, isFresh, actionTap, transitionTap, tick, actionLongPress, transitionLongPress } from "../src/state.js";

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
  it("true for count with 0 reps", function () {
    expect(isFresh(createState())).toBe(true);
  });
  it("false for count with reps", function () {
    var s = createState(); s.reps = 3;
    expect(isFresh(s)).toBe(false);
  });
  it("true for hold with timer stopped", function () {
    var s = createState(); s.mode = "hold";
    expect(isFresh(s)).toBe(true);
  });
  it("false for hold with timer running", function () {
    var s = createState(); s.mode = "hold"; s.timerRunning = true;
    expect(isFresh(s)).toBe(false);
  });
  it("false for rest mode", function () {
    var s = createState(); s.mode = "rest";
    expect(isFresh(s)).toBe(false);
  });
});

describe("actionTap (Up)", function () {
  it("increments reps in count mode", function () {
    var result = actionTap(createState());
    expect(result.state.reps).toBe(1);
    expect(result.effects).toEqual([]);
  });
  it("accumulates reps", function () {
    var r = actionTap(actionTap(actionTap(createState()).state).state);
    expect(r.state.reps).toBe(3);
  });

  describe("in rest mode", function () {
    it("adds 15s to rest timer", function () {
      var s = createState(); s.reps = 5;
      var rest = transitionTap(s).state;
      var result = actionTap(rest);
      expect(result.state.timerRemaining).toBe(45);
      expect(result.state.restDuration).toBe(45);
    });
  });

  describe("in hold mode", function () {
    it("cycles duration in setup", function () {
      var s = createState(); s.mode = "hold";
      var result = actionTap(s);
      expect(result.state.holdDuration).toBe(45);
      expect(result.state.timerRunning).toBe(false);
    });
    it("cycles through all presets", function () {
      var s = createState(); s.mode = "hold"; s.holdDuration = 3;
      var durations = [3];
      for (var i = 0; i < 7; i++) {
        s = actionTap(s).state;
        durations.push(s.holdDuration);
      }
      expect(durations).toEqual([3, 5, 15, 30, 45, 60, 90, 3]);
    });
    it("adds 15s when timer running", function () {
      var s = createState(); s.mode = "hold"; s.timerRunning = true; s.timerRemaining = 20; s.holdDuration = 30;
      var result = actionTap(s);
      expect(result.state.timerRemaining).toBe(35);
      expect(result.state.holdDuration).toBe(45);
    });
  });
});

describe("transitionTap (Down)", function () {
  describe("in count mode", function () {
    it("toggles bilateral on with 0 reps", function () {
      var result = transitionTap(createState());
      expect(result.state.bilateral).toBe(true);
      expect(result.state.activeSide).toBe("L");
    });
    it("toggles bilateral off with 0 reps", function () {
      var s = createState(); s.bilateral = true;
      var result = transitionTap(s);
      expect(result.state.bilateral).toBe(false);
    });
    it("transitions to rest with reps > 0", function () {
      var s = createState(); s.reps = 5;
      var result = transitionTap(s);
      expect(result.state.mode).toBe("rest");
      expect(result.state.previousMode).toBe("count");
      expect(result.state.timerRunning).toBe(true);
      expect(result.state.timerRemaining).toBe(30);
    });
  });

  describe("in rest mode", function () {
    it("skips rest and returns to previous mode", function () {
      var s = createState(); s.reps = 5;
      var rest = transitionTap(s).state;
      var result = transitionTap(rest);
      expect(result.state.mode).toBe("count");
      expect(result.state.timerRunning).toBe(false);
      expect(result.state.set).toBe(2);
    });
    it("preserves restDuration across sets", function () {
      var s = createState(); s.reps = 5;
      var rest = transitionTap(s).state;
      rest.restDuration = 45;
      var result = transitionTap(rest);
      expect(result.state.restDuration).toBe(45);
    });
  });

  describe("in hold mode", function () {
    it("toggles bilateral in setup", function () {
      var s = createState(); s.mode = "hold";
      var result = transitionTap(s);
      expect(result.state.bilateral).toBe(true);
      expect(result.state.activeSide).toBe("L");
      expect(result.state.timerRunning).toBe(false);
    });
    it("toggles bilateral off in setup", function () {
      var s = createState(); s.mode = "hold"; s.bilateral = true;
      expect(transitionTap(s).state.bilateral).toBe(false);
    });
    it("ends hold when timer running", function () {
      var s = createState(); s.mode = "hold"; s.timerRunning = true; s.timerRemaining = 15;
      var result = transitionTap(s);
      expect(result.state.mode).toBe("rest");
      expect(result.state.previousMode).toBe("hold");
    });
  });

  describe("bilateral count", function () {
    it("switches L to R", function () {
      var s = createState(); s.bilateral = true; s.reps = 5;
      var result = transitionTap(s);
      expect(result.state.mode).toBe("count");
      expect(result.state.activeSide).toBe("R");
      expect(result.state.reps).toBe(0);
    });
    it("transitions to rest from R side", function () {
      var s = createState(); s.bilateral = true; s.activeSide = "R"; s.reps = 5;
      var result = transitionTap(s);
      expect(result.state.mode).toBe("rest");
    });
  });
});

describe("actionLongPress (Up long)", function () {
  it("no-op in count mode", function () {
    var s = createState();
    var result = actionLongPress(s);
    expect(result.state).toEqual(s);
    expect(result.effects).toEqual([]);
  });
  it("no-op mid-set in count", function () {
    var s = createState(); s.reps = 5;
    expect(actionLongPress(s).state.mode).toBe("count");
  });

  describe("starts hold timer in setup (GO)", function () {
    it("starts timer with current holdDuration", function () {
      var s = createState(); s.mode = "hold"; s.holdDuration = 45;
      var result = actionLongPress(s);
      expect(result.state.timerRunning).toBe(true);
      expect(result.state.timerRemaining).toBe(45);
      expect(result.state.holdDuration).toBe(45);
    });
    it("starts timer with default duration", function () {
      var s = createState(); s.mode = "hold";
      var result = actionLongPress(s);
      expect(result.state.timerRunning).toBe(true);
      expect(result.state.timerRemaining).toBe(30);
    });
  });

  describe("reduce hold timer (steps below 15)", function () {
    it("subtracts 15s above 15", function () {
      var s = createState(); s.mode = "hold"; s.timerRunning = true; s.timerRemaining = 25; s.holdDuration = 30;
      var result = actionLongPress(s);
      expect(result.state.timerRemaining).toBe(10);
      expect(result.state.holdDuration).toBe(15);
    });
    it("steps from 10 to 5", function () {
      var s = createState(); s.mode = "hold"; s.timerRunning = true; s.timerRemaining = 10; s.holdDuration = 30;
      var result = actionLongPress(s);
      expect(result.state.timerRemaining).toBe(5);
      expect(result.state.mode).toBe("hold");
    });
    it("steps from 5 to 3", function () {
      var s = createState(); s.mode = "hold"; s.timerRunning = true; s.timerRemaining = 5; s.holdDuration = 30;
      var result = actionLongPress(s);
      expect(result.state.timerRemaining).toBe(3);
    });
    it("auto-advances from 3 or below", function () {
      var s = createState(); s.mode = "hold"; s.timerRunning = true; s.timerRemaining = 3;
      var result = actionLongPress(s);
      expect(result.state.mode).toBe("rest");
    });
  });

  describe("reduce rest timer", function () {
    it("subtracts 15s above 15", function () {
      var s = createState(); s.reps = 5;
      var rest = transitionTap(s).state;
      var result = actionLongPress(rest);
      expect(result.state.timerRemaining).toBe(15);
      expect(result.state.restDuration).toBe(15);
    });
    it("steps from 10 to 5", function () {
      var s = createState(); s.mode = "rest"; s.previousMode = "count"; s.timerRunning = true; s.timerRemaining = 10; s.restDuration = 30;
      var result = actionLongPress(s);
      expect(result.state.timerRemaining).toBe(5);
      expect(result.state.restDuration).toBe(25);
    });
    it("auto-completes from 3 or below", function () {
      var s = createState(); s.mode = "rest"; s.previousMode = "count"; s.timerRunning = true; s.timerRemaining = 3; s.restDuration = 15;
      var result = actionLongPress(s);
      expect(result.state.mode).toBe("count");
      expect(result.state.set).toBe(2);
      expect(result.state.restDuration).toBe(12);
    });
  });
});

describe("transitionLongPress (Down long)", function () {
  it("switches count to hold when fresh", function () {
    var result = transitionLongPress(createState());
    expect(result.state.mode).toBe("hold");
  });
  it("switches hold to count when fresh", function () {
    var s = createState(); s.mode = "hold";
    expect(transitionLongPress(s).state.mode).toBe("count");
  });
  it("resets state on mode switch", function () {
    var s = createState(); s.set = 3; s.holdDuration = 60; s.restDuration = 45;
    var result = transitionLongPress(s);
    expect(result.state.set).toBe(1);
    expect(result.state.holdDuration).toBe(30);
    expect(result.state.restDuration).toBe(30);
    expect(result.state.activeSide).toBe("L");
  });
  it("preserves bilateral setting", function () {
    var s = createState(); s.bilateral = true;
    expect(transitionLongPress(s).state.bilateral).toBe(true);
  });
  it("ignored mid-set in count", function () {
    var s = createState(); s.reps = 5;
    expect(transitionLongPress(s).state.mode).toBe("count");
  });
  describe("new exercise from rest", function () {
    it("returns to previous mode setup", function () {
      var s = createState(); s.mode = "rest"; s.previousMode = "count"; s.timerRunning = true; s.set = 3;
      var result = transitionLongPress(s);
      expect(result.state.mode).toBe("count");
      expect(result.state.timerRunning).toBe(false);
    });
    it("resets set to 1", function () {
      var s = createState(); s.mode = "rest"; s.previousMode = "hold"; s.set = 3;
      var result = transitionLongPress(s);
      expect(result.state.set).toBe(1);
      expect(result.state.mode).toBe("hold");
    });
    it("resets durations to defaults", function () {
      var s = createState(); s.mode = "rest"; s.previousMode = "count"; s.holdDuration = 60; s.restDuration = 45;
      var result = transitionLongPress(s);
      expect(result.state.holdDuration).toBe(30);
      expect(result.state.restDuration).toBe(30);
    });
    it("preserves bilateral", function () {
      var s = createState(); s.mode = "rest"; s.previousMode = "count"; s.bilateral = true;
      expect(transitionLongPress(s).state.bilateral).toBe(true);
    });
    it("vibrates on new exercise", function () {
      var s = createState(); s.mode = "rest"; s.previousMode = "count";
      expect(transitionLongPress(s).effects).toContainEqual({ type: "vibrate", pattern: "short", count: 2 });
    });
    it("resets activeSide to L", function () {
      var s = createState(); s.mode = "rest"; s.previousMode = "count"; s.activeSide = "R";
      expect(transitionLongPress(s).state.activeSide).toBe("L");
    });
  });
  it("ignored when hold timer running", function () {
    var s = createState(); s.mode = "hold"; s.timerRunning = true;
    expect(transitionLongPress(s).state.mode).toBe("hold");
  });
});

describe("tick", function () {
  it("does nothing when timer not running", function () {
    var s = createState();
    expect(tick(s).state).toEqual(s);
    expect(tick(s).effects).toEqual([]);
  });
  it("decrements rest timer", function () {
    var s = createState(); s.reps = 5;
    var rest = transitionTap(s).state;
    expect(tick(rest).state.timerRemaining).toBe(29);
  });
  it("completes rest at 0", function () {
    var s = createState(); s.reps = 5;
    var rest = transitionTap(s).state;
    rest.timerRemaining = 1;
    var result = tick(rest);
    expect(result.state.mode).toBe("count");
    expect(result.state.timerRunning).toBe(false);
    expect(result.state.set).toBe(2);
  });
  it("decrements hold timer", function () {
    var s = createState(); s.mode = "hold"; s.timerRunning = true; s.timerRemaining = 20;
    expect(tick(s).state.timerRemaining).toBe(19);
  });
  it("transitions to rest when hold completes", function () {
    var s = createState(); s.mode = "hold"; s.timerRunning = true; s.timerRemaining = 1;
    var result = tick(s);
    expect(result.state.mode).toBe("rest");
    expect(result.state.previousMode).toBe("hold");
    expect(result.state.timerRunning).toBe(true);
    expect(result.state.timerRemaining).toBe(30);
  });
  it("resets activeSide on rest completion", function () {
    var s = createState(); s.reps = 5;
    var rest = transitionTap(s).state;
    rest.timerRemaining = 1; rest.activeSide = "R";
    expect(tick(rest).state.activeSide).toBe("L");
  });
});

describe("bilateral hold flow", function () {
  it("L to R on hold timer completion", function () {
    var s = createState(); s.mode = "hold"; s.bilateral = true; s.timerRunning = true; s.timerRemaining = 1;
    var result = tick(s);
    expect(result.state.activeSide).toBe("R");
    expect(result.state.timerRunning).toBe(true);
    expect(result.state.timerRemaining).toBe(30);
  });
  it("R side to rest on completion", function () {
    var s = createState(); s.mode = "hold"; s.bilateral = true; s.activeSide = "R"; s.timerRunning = true; s.timerRemaining = 1;
    expect(tick(s).state.mode).toBe("rest");
  });
  it("uses holdDuration for R side", function () {
    var s = createState(); s.mode = "hold"; s.bilateral = true; s.holdDuration = 45; s.timerRunning = true; s.timerRemaining = 1;
    expect(tick(s).state.timerRemaining).toBe(45);
  });
  it("L to R on early exit via Down", function () {
    var s = createState(); s.mode = "hold"; s.bilateral = true; s.timerRunning = true; s.timerRemaining = 15;
    var result = transitionTap(s);
    expect(result.state.activeSide).toBe("R");
    expect(result.state.timerRunning).toBe(true);
  });
  it("returns to L after rest completes", function () {
    var s = createState(); s.bilateral = true; s.activeSide = "R"; s.reps = 5;
    var rest = transitionTap(s).state;
    rest.timerRemaining = 1;
    expect(tick(rest).state.activeSide).toBe("L");
  });
});

describe("haptic effects", function () {
  it("no vibration on rep count", function () {
    expect(actionTap(createState()).effects).toEqual([]);
  });
  it("3 short on hold completion", function () {
    var s = createState(); s.mode = "hold"; s.timerRunning = true; s.timerRemaining = 1;
    expect(tick(s).effects).toContainEqual({ type: "vibrate", pattern: "short", count: 3 });
  });
  it("2 long on rest completion", function () {
    var s = createState(); s.mode = "rest"; s.previousMode = "count"; s.timerRunning = true; s.timerRemaining = 1;
    expect(tick(s).effects).toContainEqual({ type: "vibrate", pattern: "long", count: 2 });
  });
  it("1 short on bilateral L to R (count)", function () {
    var s = createState(); s.bilateral = true; s.reps = 5;
    expect(transitionTap(s).effects).toContainEqual({ type: "vibrate", pattern: "short", count: 1 });
  });
  it("1 short on bilateral L to R (hold tick)", function () {
    var s = createState(); s.mode = "hold"; s.bilateral = true; s.timerRunning = true; s.timerRemaining = 1;
    expect(tick(s).effects).toContainEqual({ type: "vibrate", pattern: "short", count: 1 });
  });
  it("1 short at 5-second warning", function () {
    var s = createState(); s.mode = "hold"; s.timerRunning = true; s.timerRemaining = 6;
    var result = tick(s);
    expect(result.state.timerRemaining).toBe(5);
    expect(result.effects).toContainEqual({ type: "vibrate", pattern: "short", count: 1 });
  });
  it("2 long when skipping rest via Down", function () {
    var s = createState(); s.mode = "rest"; s.previousMode = "count"; s.timerRunning = true; s.timerRemaining = 20;
    expect(transitionTap(s).effects).toContainEqual({ type: "vibrate", pattern: "long", count: 2 });
  });
  it("3 short when ending hold via Down", function () {
    var s = createState(); s.mode = "hold"; s.timerRunning = true; s.timerRemaining = 15;
    expect(transitionTap(s).effects).toContainEqual({ type: "vibrate", pattern: "short", count: 3 });
  });
  it("3 short when Up long subtracts hold to 0", function () {
    var s = createState(); s.mode = "hold"; s.timerRunning = true; s.timerRemaining = 3;
    expect(actionLongPress(s).effects).toContainEqual({ type: "vibrate", pattern: "short", count: 3 });
  });
  it("2 long when Up long subtracts rest to 0", function () {
    var s = createState(); s.mode = "rest"; s.previousMode = "count"; s.timerRunning = true; s.timerRemaining = 3;
    expect(actionLongPress(s).effects).toContainEqual({ type: "vibrate", pattern: "long", count: 2 });
  });
});

describe("restDuration persistence", function () {
  it("persists extended rest across sets", function () {
    var s = createState(); s.reps = 5;
    var rest = transitionTap(s).state;
    var extended = actionTap(rest).state;
    expect(extended.restDuration).toBe(45);
    extended.timerRemaining = 1;
    var after = tick(extended).state;
    expect(after.restDuration).toBe(45);
  });
  it("next rest uses persisted duration", function () {
    var s = createState(); s.reps = 5;
    var rest = transitionTap(s).state;
    var extended = actionTap(rest).state;
    extended.timerRemaining = 1;
    var after = tick(extended).state;
    after.reps = 5;
    expect(transitionTap(after).state.timerRemaining).toBe(45);
  });
  it("new exercise resets rest to 30", function () {
    var s = createState(); s.mode = "rest"; s.previousMode = "count"; s.restDuration = 45;
    var result = transitionLongPress(s);
    expect(result.state.restDuration).toBe(30);
  });
});
