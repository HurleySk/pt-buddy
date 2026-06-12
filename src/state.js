function copy(obj) {
  var result = {};
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

export function createState() {
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

export function isFresh(state) {
  if (state.mode === "count") return state.reps === 0;
  if (state.mode === "hold") return !state.timerRunning;
  return false;
}

var DURATION_PRESETS = [3, 5, 15, 30, 45, 60, 90];

function cycleDuration(value) {
  for (var i = 0; i < DURATION_PRESETS.length; i++) {
    if (DURATION_PRESETS[i] === value) {
      return DURATION_PRESETS[(i + 1) % DURATION_PRESETS.length];
    }
  }
  for (var i = 0; i < DURATION_PRESETS.length; i++) {
    if (DURATION_PRESETS[i] > value) return DURATION_PRESETS[i];
  }
  return DURATION_PRESETS[0];
}

function reduceTimer(remaining) {
  if (remaining > 15) return remaining - 15;
  if (remaining > 5) return 5;
  if (remaining > 3) return 3;
  return 0;
}

function transitionFromExercise(state, effects) {
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

function transitionToRest(state, effects) {
  var next = copy(state);
  next.previousMode = state.mode;
  next.mode = "rest";
  next.timerRemaining = Math.max(state.restDuration, 3);
  next.timerRunning = true;
  next.reps = 0;
  return { state: next, effects: effects };
}

function completeRest(state, effects) {
  effects.push({ type: "vibrate", pattern: "long", count: 2 });
  var next = copy(state);
  next.mode = state.previousMode;
  next.set = state.set + 1;
  next.reps = 0;
  next.activeSide = "L";
  if (state.previousMode === "hold") {
    next.timerRunning = true;
    next.timerRemaining = next.holdDuration;
  } else {
    next.timerRunning = false;
    next.timerRemaining = 0;
  }
  return { state: next, effects: effects };
}

// Up button tap
export function actionTap(state) {
  var next = copy(state);
  var effects = [];
  if (state.mode === "count") {
    next.reps = state.reps + 1;
  } else if (state.mode === "rest") {
    next.timerRemaining = state.timerRemaining + 15;
    next.restDuration = state.restDuration + 15;
  } else if (state.mode === "hold") {
    if (!state.timerRunning) {
      next.holdDuration = cycleDuration(state.holdDuration);
    } else {
      next.timerRemaining = state.timerRemaining + 15;
      next.holdDuration = state.holdDuration + 15;
    }
  }
  return { state: next, effects: effects };
}

// Down button tap
export function transitionTap(state) {
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
      next.bilateral = !state.bilateral;
      next.activeSide = "L";
      return { state: next, effects: effects };
    }
    return transitionFromExercise(next, effects);
  }
  return { state: state, effects: effects };
}

// Up button long press
export function actionLongPress(state) {
  if (state.mode === "rest") {
    var next = copy(state);
    var effects = [];
    var newRemaining = Math.max(reduceTimer(state.timerRemaining), 3);
    if (newRemaining >= state.timerRemaining) {
      return { state: state, effects: [] };
    }
    var diff = state.timerRemaining - newRemaining;
    next.restDuration = state.restDuration - diff;
    next.timerRemaining = newRemaining;
    return { state: next, effects: effects };
  }
  if (state.mode === "hold") {
    var next = copy(state);
    var effects = [];
    if (!state.timerRunning) {
      next.timerRunning = true;
      next.timerRemaining = state.holdDuration;
      return { state: next, effects: effects };
    }
    var newRemaining = reduceTimer(state.timerRemaining);
    var diff = state.timerRemaining - newRemaining;
    next.holdDuration = state.holdDuration - diff;
    if (newRemaining <= 0) {
      next.timerRemaining = 0;
      next.timerRunning = false;
      return transitionFromExercise(next, effects);
    }
    next.timerRemaining = newRemaining;
    return { state: next, effects: effects };
  }
  return { state: state, effects: [] };
}

// Down button long press -- mode switch / new exercise
export function transitionLongPress(state) {
  if (state.mode === "rest") {
    var effects = [{ type: "vibrate", pattern: "short", count: 2 }];
    var next = copy(state);
    next.mode = state.previousMode;
    next.set = 1;
    next.reps = 0;
    next.timerRunning = false;
    next.timerRemaining = 0;
    next.holdDuration = 30;
    next.restDuration = 30;
    next.activeSide = "L";
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

export function tick(state) {
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
