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

function transitionToRest(state, effects) {
  var next = Object.assign({}, state);
  next.previousMode = state.mode;
  next.mode = "rest";
  next.timerRemaining = state.restDuration;
  next.timerRunning = true;
  next.reps = 0;
  return { state: next, effects: effects };
}

export function actionTap(state) {
  var next = Object.assign({}, state);
  var effects = [];
  if (state.mode === "count") {
    next.reps = state.reps + 1;
  } else if (state.mode === "rest") {
    return completeRest(next, effects);
  }
  return { state: next, effects: effects };
}

function completeRest(state, effects) {
  var next = Object.assign({}, state);
  next.mode = state.previousMode;
  next.set = state.set + 1;
  next.reps = 0;
  next.timerRunning = false;
  next.timerRemaining = 0;
  next.activeSide = "L";
  return { state: next, effects: effects };
}

export function transitionTap(state) {
  var next = Object.assign({}, state);
  var effects = [];
  if (state.mode === "count") {
    if (state.reps === 0) {
      return { state: state, effects: effects };
    }
    return transitionToRest(next, effects);
  } else if (state.mode === "rest") {
    next.timerRemaining = state.timerRemaining + 10;
    next.restDuration = state.restDuration + 10;
    return { state: next, effects: effects };
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
  if (next.timerRemaining <= 0) {
    next.timerRunning = false;
    if (state.mode === "rest") {
      return completeRest(next, effects);
    }
  }
  return { state: next, effects: effects };
}
