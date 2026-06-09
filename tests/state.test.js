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

  describe("in rest mode", function () {
    function enterRest() {
      var s = createState();
      s.reps = 5;
      return transitionTap(s).state;
    }

    it("ends rest early and returns to previous mode", function () {
      var s = enterRest();
      var result = actionTap(s);
      expect(result.state.mode).toBe("count");
      expect(result.state.timerRunning).toBe(false);
    });

    it("increments set when ending rest early", function () {
      var s = enterRest();
      var result = actionTap(s);
      expect(result.state.set).toBe(2);
    });
  });

  describe("in hold mode", function () {
    function freshHold() {
      var s = createState();
      s.mode = "hold";
      return s;
    }

    it("starts hold timer when stopped", function () {
      var s = freshHold();
      var result = actionTap(s);
      expect(result.state.timerRunning).toBe(true);
      expect(result.state.timerRemaining).toBe(30);
    });

    it("uses configured holdDuration", function () {
      var s = freshHold();
      s.holdDuration = 45;
      var result = actionTap(s);
      expect(result.state.timerRemaining).toBe(45);
    });

    it("ends hold early when timer is running", function () {
      var s = freshHold();
      s.timerRunning = true;
      s.timerRemaining = 15;
      var result = actionTap(s);
      expect(result.state.mode).toBe("rest");
      expect(result.state.previousMode).toBe("hold");
    });
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

  describe("in rest mode", function () {
    function enterRest() {
      var s = createState();
      s.reps = 5;
      return transitionTap(s).state;
    }

    it("adds 10s to rest timer", function () {
      var s = enterRest();
      expect(s.timerRemaining).toBe(30);
      var result = transitionTap(s);
      expect(result.state.timerRemaining).toBe(40);
      expect(result.state.restDuration).toBe(40);
    });
  });

  describe("in hold mode", function () {
    it("adds 10s to hold duration before starting", function () {
      var s = createState();
      s.mode = "hold";
      expect(s.holdDuration).toBe(30);
      var result = transitionTap(s);
      expect(result.state.holdDuration).toBe(40);
    });

    it("does nothing while hold timer is running", function () {
      var s = createState();
      s.mode = "hold";
      s.timerRunning = true;
      s.timerRemaining = 20;
      var result = transitionTap(s);
      expect(result.state.timerRemaining).toBe(20);
    });
  });
});

describe("tick", function () {
  function enterRest() {
    var s = createState();
    s.reps = 5;
    return transitionTap(s).state;
  }

  it("does nothing when timer is not running", function () {
    var s = createState();
    var result = tick(s);
    expect(result.state).toEqual(s);
    expect(result.effects).toEqual([]);
  });

  it("decrements timerRemaining in rest mode", function () {
    var s = enterRest();
    var result = tick(s);
    expect(result.state.timerRemaining).toBe(29);
    expect(result.state.timerRunning).toBe(true);
  });

  it("completes rest when timer reaches 0", function () {
    var s = enterRest();
    s.timerRemaining = 1;
    var result = tick(s);
    expect(result.state.mode).toBe("count");
    expect(result.state.timerRunning).toBe(false);
    expect(result.state.timerRemaining).toBe(0);
  });

  it("increments set on rest completion", function () {
    var s = enterRest();
    s.timerRemaining = 1;
    expect(s.set).toBe(1);
    var result = tick(s);
    expect(result.state.set).toBe(2);
  });

  it("returns to previousMode on rest completion", function () {
    var s = enterRest();
    s.timerRemaining = 1;
    expect(s.previousMode).toBe("count");
    var result = tick(s);
    expect(result.state.mode).toBe("count");
  });

  it("resets reps on rest completion", function () {
    var s = enterRest();
    s.timerRemaining = 1;
    var result = tick(s);
    expect(result.state.reps).toBe(0);
  });

  it("resets activeSide to L on rest completion", function () {
    var s = enterRest();
    s.timerRemaining = 1;
    s.activeSide = "R";
    var result = tick(s);
    expect(result.state.activeSide).toBe("L");
  });

  describe("in hold mode", function () {
    it("decrements hold timer", function () {
      var s = createState();
      s.mode = "hold";
      s.timerRunning = true;
      s.timerRemaining = 20;
      var result = tick(s);
      expect(result.state.timerRemaining).toBe(19);
    });

    it("transitions to rest when hold timer completes", function () {
      var s = createState();
      s.mode = "hold";
      s.timerRunning = true;
      s.timerRemaining = 1;
      var result = tick(s);
      expect(result.state.mode).toBe("rest");
      expect(result.state.previousMode).toBe("hold");
      expect(result.state.timerRunning).toBe(true);
      expect(result.state.timerRemaining).toBe(30);
    });
  });
});

describe("actionLongPress", function () {
  it("switches from count to hold when fresh", function () {
    var s = createState();
    var result = actionLongPress(s);
    expect(result.state.mode).toBe("hold");
  });
  it("switches from hold to count when fresh", function () {
    var s = createState();
    s.mode = "hold";
    var result = actionLongPress(s);
    expect(result.state.mode).toBe("count");
  });
  it("is ignored mid-set in count mode", function () {
    var s = createState();
    s.reps = 5;
    var result = actionLongPress(s);
    expect(result.state.mode).toBe("count");
    expect(result.state.reps).toBe(5);
  });
  it("is ignored when hold timer is running", function () {
    var s = createState();
    s.mode = "hold";
    s.timerRunning = true;
    s.timerRemaining = 15;
    var result = actionLongPress(s);
    expect(result.state.mode).toBe("hold");
  });
  it("is ignored in rest mode", function () {
    var s = createState();
    s.mode = "rest";
    s.timerRunning = true;
    var result = actionLongPress(s);
    expect(result.state.mode).toBe("rest");
  });
  it("resets set counter to 1", function () {
    var s = createState();
    s.set = 3;
    var result = actionLongPress(s);
    expect(result.state.set).toBe(1);
  });
  it("resets reps to 0", function () {
    var s = createState();
    var result = actionLongPress(s);
    expect(result.state.reps).toBe(0);
  });
  it("resets hold and rest durations to 30", function () {
    var s = createState();
    s.holdDuration = 60;
    s.restDuration = 45;
    var result = actionLongPress(s);
    expect(result.state.holdDuration).toBe(30);
    expect(result.state.restDuration).toBe(30);
  });
  it("resets activeSide to L", function () {
    var s = createState();
    s.activeSide = "R";
    var result = actionLongPress(s);
    expect(result.state.activeSide).toBe("L");
  });
  it("preserves bilateral setting", function () {
    var s = createState();
    s.bilateral = true;
    var result = actionLongPress(s);
    expect(result.state.bilateral).toBe(true);
  });
});
