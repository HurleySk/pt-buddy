import { readFileSync, writeFileSync } from "fs";

var stateCode = readFileSync("src/state.js", "utf-8");
var cleanCode = stateCode.replace(/^export /gm, "");

var sdkCallbacks = ["onLoad", "evaluate", "onEvent", "getUserInterface",
  "onExerciseStart", "onExercisePause", "onExerciseContinue"];

cleanCode = cleanCode.replace(/^function (\w+)\(/gm, function(match, name) {
  if (sdkCallbacks.indexOf(name) >= 0) return match;
  return "var " + name + " = function(";
});

var bridge = readFileSync("src/bridge.js", "utf-8");

var bridgeClean = bridge.replace(/^function (\w+)\(/gm, function(match, name) {
  if (sdkCallbacks.indexOf(name) >= 0) return match;
  return "var " + name + " = function(";
});

var mainJs = "// PT Buddy - SuuntoPlus Sports App\n"
  + "// Built from src/ -- do not edit directly\n"
  + "// Run: npm run build\n\n"
  + cleanCode + "\n"
  + bridgeClean + "\n";

writeFileSync("main.js", mainJs);
console.log("Built main.js");
