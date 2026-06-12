// PT Buddy - SuuntoPlus Sports App
// Built from src/ -- do not edit directly
// Run: npm run build

var copy = function(obj) {
  var result = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

var createState = function() {
  return {
    mode: "count",
    reps: 0,
    set: 1,
    bilateral: false,
    activeSide: "L",
    timerRemaining: 0,
    holdDuration: 30,
    restDuration: 30,
    timerRunning: false,
    previousMode: "count"
  };
}

var isFresh = function(state) {
  if (state.mode === "count") return state.reps === 0;
  if (state.mode === "hold") return !state.timerRunning;
  return false;
}

var transitionFromExercise = function(state, effects) {
  var next = copy(state);
  if (state.bilateral && state.activeSide === "L") {
    effects.push({ type: "vibrate", pattern: "short", count: 1 });
    next.activeSide = "R";
    next.timerRemaining = state.holdDuration;
    next.timerRunning = true;
    return { state: next, effects: effects };
  }
  effects.push({ type: "vibrate", pattern: "short", count: 3 });
  return transitionToRest(next, effects);
}

var transitionToRest = function(state, effects) {
  var next = copy(state);
  next.previousMode = state.mode;
  next.mode = "rest";
  next.timerRemaining = state.restDuration;
  next.timerRunning = true;
  next.reps = 0;
  return { state: next, effects: effects };
}

var completeRest = function(state, effects) {
  effects.push({ type: "vibrate", pattern: "long", count: 2 });
  var next = copy(state);
  next.mode = state.previousMode;
  next.set = state.set + 1;
  next.reps = 0;
  next.timerRunning = false;
  next.timerRemaining = 0;
  next.activeSide = "L";
  next.restDuration = 30;
  return { state: next, effects: effects };
}

// Up button tap
var actionTap = function(state) {
  var next = copy(state);
  var effects = [];
  if (state.mode === "count") {
    next.reps = state.reps + 1;
  } else if (state.mode === "rest") {
    next.timerRemaining = state.timerRemaining + 15;
    next.restDuration = state.restDuration + 15;
  } else if (state.mode === "hold") {
    if (!state.timerRunning) {
      next.holdDuration = state.holdDuration + 15;
    } else {
      next.timerRemaining = state.timerRemaining + 15;
      next.holdDuration = state.holdDuration + 15;
    }
  }
  return { state: next, effects: effects };
}

// Down button tap
var transitionTap = function(state) {
  var next = copy(state);
  var effects = [];
  if (state.mode === "count") {
    if (state.reps === 0) {
      next.bilateral = !state.bilateral;
      next.activeSide = "L";
      return { state: next, effects: effects };
    }
    if (state.bilateral && state.activeSide === "L") {
      effects.push({ type: "vibrate", pattern: "short", count: 1 });
      next.activeSide = "R";
      next.reps = 0;
      return { state: next, effects: effects };
    }
    return transitionToRest(next, effects);
  } else if (state.mode === "rest") {
    return completeRest(next, effects);
  } else if (state.mode === "hold") {
    if (!state.timerRunning) {
      next.timerRunning = true;
      next.timerRemaining = state.holdDuration;
      return { state: next, effects: effects };
    }
    return transitionFromExercise(next, effects);
  }
  return { state: state, effects: effects };
}

// Up button long press
var actionLongPress = function(state) {
  if (state.mode === "rest") {
    var next = copy(state);
    var effects = [];
    if (state.timerRemaining > 15) {
      next.timerRemaining = state.timerRemaining - 15;
      next.restDuration = state.restDuration - 15;
    } else {
      return completeRest(next, effects);
    }
    return { state: next, effects: effects };
  }
  if (state.mode === "hold") {
    var next = copy(state);
    var effects = [];
    if (!state.timerRunning) {
      if (state.holdDuration > 15) {
        next.holdDuration = state.holdDuration - 15;
      }
      return { state: next, effects: effects };
    }
    if (state.timerRemaining > 15) {
      next.timerRemaining = state.timerRemaining - 15;
      next.holdDuration = state.holdDuration - 15;
    } else {
      next.timerRemaining = 0;
      next.timerRunning = false;
      return transitionFromExercise(next, effects);
    }
    return { state: next, effects: effects };
  }
  if (!isFresh(state)) {
    return { state: state, effects: [] };
  }
  var next = copy(state);
  if (state.mode === "count") {
    next.mode = "hold";
  } else if (state.mode === "hold") {
    next.mode = "count";
  }
  next.reps = 0;
  next.set = 1;
  next.holdDuration = 30;
  next.restDuration = 30;
  next.timerRunning = false;
  next.timerRemaining = 0;
  next.activeSide = "L";
  return { state: next, effects: [] };
}

// Down button long press
var transitionLongPress = function(state) {
  if (!isFresh(state)) {
    return { state: state, effects: [] };
  }
  var next = copy(state);
  next.bilateral = !state.bilateral;
  next.activeSide = "L";
  return { state: next, effects: [] };
}

var tick = function(state) {
  if (!state.timerRunning) {
    return { state: state, effects: [] };
  }
  var next = copy(state);
  var effects = [];
  next.timerRemaining = state.timerRemaining - 1;
  if (next.timerRemaining <= 5 && state.timerRemaining > 5) {
    effects.push({ type: "vibrate", pattern: "short", count: 1 });
  }
  if (next.timerRemaining <= 0) {
    next.timerRunning = false;
    if (state.mode === "hold") {
      return transitionFromExercise(next, effects);
    } else if (state.mode === "rest") {
      return completeRest(next, effects);
    }
  }
  return { state: next, effects: effects };
}

// --- SuuntoPlus Bridge ---

var appState;
var isPaused = 1;

var applyEffects = function(effects) {
  for (var i = 0; i < effects.length; i++) {
    var e = effects[i];
    if (e.type === "vibrate") {
      if (e.pattern === "long" && e.count === 2) {
        playIndication("Interval");
      } else if (e.pattern === "short" && e.count === 3) {
        playIndication("StopTimer");
      } else if (e.pattern === "short" && e.count === 1) {
        playIndication("Info");
      }
    }
  }
};

var processResult = function(result) {
  appState = result.state;
  applyEffects(result.effects);
};

var formatTime = function(seconds) {
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return m + ":" + (s < 10 ? "0" : "") + s;
};

var updateDisplay = function(output) {
  var s = appState;
  var modeLabels = { count: "COUNT", hold: "HOLD", rest: "REST" };

  setText("#mode-label", modeLabels[s.mode] || "");

  if (s.mode === "count") {
    output.mainValue = s.reps;
    setText("#main-value", String(s.reps));
    setText("#sub-label", "reps");
  } else if (s.mode === "hold" && !s.timerRunning) {
    output.mainValue = s.holdDuration;
    setText("#main-value", formatTime(s.holdDuration));
    setText("#sub-label", "duration");
  } else {
    output.mainValue = s.timerRemaining;
    setText("#main-value", formatTime(s.timerRemaining));
    setText("#sub-label", "remaining");
  }

  if (s.mode === "rest") {
    setText("#set-label", "Next: Set " + (s.set + 1));
  } else {
    setText("#set-label", "Set " + s.set);
  }

  if (s.bilateral) {
    setText("#side-l", s.activeSide === "L" ? "[L]" : " L ");
    setText("#side-r", s.activeSide === "R" ? "[R]" : " R ");
  } else {
    setText("#side-l", "");
    setText("#side-r", "");
  }

  if (s.mode === "hold" || s.mode === "rest") {
    var total = s.mode === "hold" ? s.holdDuration : s.restDuration;
    output.progress = total > 0 ? s.timerRemaining / total : 0;
  } else {
    output.progress = 0;
  }
};

function onLoad(input, output) {
  appState = createState();
  isPaused = 1;
}

function onExerciseStart(input, output) {
  isPaused = 0;
}

function onExercisePause(input, output) {
  isPaused = 1;
}

function onExerciseContinue(input, output) {
  isPaused = 0;
}

function evaluate(input, output) {
  if (isPaused) return;

  if (appState.timerRunning) {
    processResult(tick(appState));
  }

  updateDisplay(output);
}

function onEvent(input, output, eventId) {
  if (eventId === 1) {
    processResult(actionTap(appState));
  } else if (eventId === 2) {
    processResult(actionLongPress(appState));
  } else if (eventId === 3) {
    processResult(transitionTap(appState));
  } else if (eventId === 4) {
    processResult(transitionLongPress(appState));
  }
}

function getUserInterface(input, output) {
  return { template: "t" };
}

