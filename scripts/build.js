import { readFileSync, writeFileSync } from "fs";

var stateCode = readFileSync("src/state.js", "utf-8");

// Strip ES module export statements
var cleanCode = stateCode.replace(/^export /gm, "");

var mainJs = '// PT Buddy - SuuntoPlus Sports App\n'
  + '// Built from src/state.js — do not edit directly\n'
  + '// Run: npm run build\n\n'
  + cleanCode + '\n'
  + '// --- SuuntoPlus Integration ---\n\n'
  + 'var appState;\n\n'
  + 'function onLoad() {\n'
  + '  appState = createState();\n'
  + '}\n\n'
  + 'function evaluate() {\n'
  + '  // TODO: wire up in Task 10\n'
  + '}\n';

writeFileSync("main.js", mainJs);
console.log("Built main.js");
