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
  var modeColors = { count: "sp-c-green", hold: "sp-c-orange", rest: "sp-c-blue" };

  setText("#mode-label", modeLabels[s.mode] || "");

  if (s.mode === "count") {
    output.mainValue = s.reps;
    setText("#sub-label", "reps");
  } else {
    output.mainValue = s.timerRemaining;
    setText("#sub-label", "remaining");
  }

  setText("#main-value", s.mode === "count" ? String(s.reps) : formatTime(s.timerRemaining));

  if (s.mode === "rest") {
    setText("#set-label", "Next: Set " + (s.set + 1));
  } else {
    setText("#set-label", "Set " + s.set);
  }

  if (s.bilateral) {
    setText("#side-l", s.activeSide === "L" ? "[L]" : " L ");
    setText("#side-r", s.activeSide === "R" ? "[R]" : " R ");
    setStyle("#sides", "visibility", "visible");
  } else {
    setStyle("#sides", "visibility", "hidden");
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
  updateDisplay(output);
}

function getUserInterface(input, output) {
  return { template: "t" };
}
