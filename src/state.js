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

function transitionFromExercise(state, effects) {
  var next = Object.assign({}, state);
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
  var next = Object.assign({}, state);
  next.previousMode = state.mode;
  next.mode = "rest";
  next.timerRemaining = state.restDuration;
  next.timerRunning = true;
  next.reps = 0;
  return { state: next, effects: effects };
}

// Up button tap
export function actionTap(state) {
  var next = Object.assign({}, state);
  var effects = [];
  if (state.mode === "count") {
    next.reps = state.reps + 1;
  } else if (state.mode === "rest") {
    next.timerRemaining = state.timerRemaining + 15;
    next.restDuration = state.restDuration + 15;
    return { state: next, effects: effects };
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

function completeRest(state, effects) {
  effects.push({ type: "vibrate", pattern: "long", count: 2 });
  var next = Object.assign({}, state);
  next.mode = state.previousMode;
  next.set = state.set + 1;
  next.reps = 0;
  next.timerRunning = false;
  next.timerRemaining = 0;
  next.activeSide = "L";
  next.restDuration = 30;
  return { state: next, effects: effects };
}

// Down button tap
export function transitionTap(state) {
  var next = Object.assign({}, state);
  var effects = [];
  if (state.mode === "count") {
    if (state.reps === 0) {
      return { state: state, effects: effects };
    }
    next.reps = state.reps - 1;
    return { state: next, effects: effects };
  } else if (state.mode === "rest") {
    if (state.timerRemaining > 15) {
      next.timerRemaining = state.timerRemaining - 15;
      next.restDuration = state.restDuration - 15;
    } else {
      return completeRest(next, effects);
    }
    return { state: next, effects: effects };
  } else if (state.mode === "hold") {
    if (!state.timerRunning) {
      if (state.holdDuration > 15) {
        next.holdDuration = state.holdDuration - 15;
      }
    } else {
      if (state.timerRemaining > 15) {
        next.timerRemaining = state.timerRemaining - 15;
        next.holdDuration = state.holdDuration - 15;
      } else {
        next.timerRemaining = 0;
        next.timerRunning = false;
        return transitionFromExercise(next, effects);
      }
    }
    return { state: next, effects: effects };
  }
  return { state: state, effects: effects };
}

// Down button long press
export function transitionLongPress(state) {
  if (!isFresh(state)) {
    return { state: state, effects: [] };
  }
  var next = Object.assign({}, state);
  next.bilateral = !state.bilateral;
  next.activeSide = "L";
  return { state: next, effects: [] };
}

// Up button long press
export function actionLongPress(state) {
  if (!isFresh(state)) {
    return { state: state, effects: [] };
  }
  var next = Object.assign({}, state);
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

// Next/middle button tap
export function nextTap(state) {
  var next = Object.assign({}, state);
  var effects = [];
  if (state.mode === "count") {
    if (state.reps === 0) {
      return { state: state, effects: effects };
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

export function tick(state) {
  if (!state.timerRunning) {
    return { state: state, effects: [] };
  }
  var next = Object.assign({}, state);
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
