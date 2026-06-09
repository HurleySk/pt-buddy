// PT Buddy - SuuntoPlus Sports App
// Built from src/ — do not edit directly
// Run: npm run build

function createState() {
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

function isFresh(state) {
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

function actionTap(state) {
  var next = Object.assign({}, state);
  var effects = [];
  if (state.mode === "count") {
    next.reps = state.reps + 1;
  } else if (state.mode === "rest") {
    return completeRest(next, effects);
  } else if (state.mode === "hold") {
    if (!state.timerRunning) {
      next.timerRunning = true;
      next.timerRemaining = state.holdDuration;
    } else {
      return transitionFromExercise(next, effects);
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
  return { state: next, effects: effects };
}

function transitionTap(state) {
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
    next.timerRemaining = state.timerRemaining + 10;
    next.restDuration = state.restDuration + 10;
    return { state: next, effects: effects };
  } else if (state.mode === "hold") {
    if (!state.timerRunning) {
      next.holdDuration = state.holdDuration + 10;
    }
    return { state: next, effects: effects };
  }
  return { state: state, effects: effects };
}

function transitionLongPress(state) {
  if (!isFresh(state)) {
    return { state: state, effects: [] };
  }
  var next = Object.assign({}, state);
  next.bilateral = !state.bilateral;
  next.activeSide = "L";
  return { state: next, effects: [] };
}

function actionLongPress(state) {
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

function tick(state) {
  if (!state.timerRunning) {
    return { state: state, effects: [] };
  }
  var next = Object.assign({}, state);
  var effects = [];
  next.timerRemaining = state.timerRemaining - 1;
  if (next.timerRemaining === 5) {
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
// Connects the state machine to SuuntoPlus watch APIs.
// API calls below are best-guess from documentation — verify against
// the SuuntoPlus Editor reference and adjust as needed.

var appState;
var lastTickTime = 0;

function applyEffects(effects) {
  for (var i = 0; i < effects.length; i++) {
    var e = effects[i];
    if (e.type === "vibrate") {
      if (typeof SUUNTO !== "undefined" && SUUNTO.alarms) {
        for (var j = 0; j < e.count; j++) {
          SUUNTO.alarms.vibrate(e.pattern);
        }
      }
    }
  }
}

function processResult(result) {
  appState = result.state;
  applyEffects(result.effects);
}

function updateDisplay() {
  if (typeof SUUNTO === "undefined") return;

  var modeLabels = { count: "COUNT", hold: "HOLD", rest: "REST" };
  var themeColors = { count: "#4CAF50", hold: "#FF9800", rest: "#2196F3" };
  var s = appState;

  SUUNTO.outputs.mode_label = modeLabels[s.mode] || "";
  SUUNTO.outputs.theme_color = themeColors[s.mode] || "#fff";

  if (s.mode === "count") {
    SUUNTO.outputs.main_value = String(s.reps);
    SUUNTO.outputs.sub_label = "reps";
  } else {
    var mins = Math.floor(s.timerRemaining / 60);
    var secs = s.timerRemaining % 60;
    SUUNTO.outputs.main_value = mins + ":" + (secs < 10 ? "0" : "") + secs;
    SUUNTO.outputs.sub_label = "remaining";
  }

  if (s.mode === "rest") {
    SUUNTO.outputs.set_label = "Next: Set " + (s.set + 1);
  } else {
    SUUNTO.outputs.set_label = "Set " + s.set;
  }

  SUUNTO.outputs.bilateral = s.bilateral;
  SUUNTO.outputs.active_side = s.activeSide;

  if (s.mode === "hold" || s.mode === "rest") {
    var total = s.mode === "hold" ? s.holdDuration : s.restDuration;
    SUUNTO.outputs.progress = total > 0 ? s.timerRemaining / total : 0;
  } else {
    SUUNTO.outputs.progress = 0;
  }
}

function onLoad() {
  appState = createState();
  updateDisplay();
}

function evaluate(context) {
  var now = 0;
  if (context && context.time != null) {
    now = context.time;
  } else if (typeof SUUNTO !== "undefined" && SUUNTO.time != null) {
    now = SUUNTO.time;
  }

  if (now - lastTickTime >= 1) {
    lastTickTime = now;
    if (appState.timerRunning) {
      processResult(tick(appState));
    }
  }

  if (context && context.button) {
    if (context.button.action === "tap") {
      processResult(actionTap(appState));
    } else if (context.button.action === "longpress") {
      processResult(actionLongPress(appState));
    } else if (context.button.transition === "tap") {
      processResult(transitionTap(appState));
    } else if (context.button.transition === "longpress") {
      processResult(transitionLongPress(appState));
    }
  }

  updateDisplay();
}

