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
