import { readFileSync, writeFileSync } from "fs";

var stateCode = readFileSync("src/state.js", "utf-8");
var cleanCode = stateCode.replace(/^export /gm, "");
var bridge = readFileSync("src/bridge.js", "utf-8");

var mainJs = "// PT Buddy - SuuntoPlus Sports App\n"
  + "// Built from src/ — do not edit directly\n"
  + "// Run: npm run build\n\n"
  + cleanCode + "\n"
  + bridge + "\n";

writeFileSync("main.js", mainJs);
console.log("Built main.js");
