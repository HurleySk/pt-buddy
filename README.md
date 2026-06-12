# PT Buddy

A SuuntoPlus Sports App for tracking physical therapy exercises on your Suunto watch. Count reps, time holds, manage rest periods between sets, and track bilateral (L/R) exercises -- all from your wrist during a workout.

## Features

- **Count mode** -- tap to count reps
- **Hold mode** -- configurable isometric hold timer (default 30s, adjustable in 15s increments)
- **Rest timer** -- auto-starts between sets (default 30s, adjustable)
- **Bilateral L/R** -- tracks left and right sides separately before resting
- **Haptic feedback** -- vibration cues for side switches, warnings, and transitions
- **Two-button control** -- Up adjusts values, Down proceeds through the workout

## Controls

The top right button is **Up** (adjust), the bottom right button is **Down** (proceed).

### Count Mode

| Button | 0 reps | Reps > 0 |
|--------|--------|----------|
| Up | +1 rep | +1 rep |
| Up long | Switch to Hold mode | -- |
| Down | Toggle bilateral L/R | End set, start rest |

### Hold Mode

| Button | Before start | Timer running |
|--------|-------------|---------------|
| Up | +15s duration | +15s to timer |
| Up long | -15s duration | -15s from timer |
| Down | Start timer | End hold, advance |

### Rest Mode

| Button | Action |
|--------|--------|
| Up | +15s to timer |
| Up long | -15s from timer |
| Down | Skip rest, start next set |

## Development

Requires [Node.js](https://nodejs.org/) and the [SuuntoPlus Editor](https://marketplace.visualstudio.com/items?itemName=suunto.suuntoplus-editor) VS Code extension.

```bash
npm install
npm test        # run 59 state machine tests
npm run build   # build main.js from src/
```

### Testing in the simulator

1. Open the project in VS Code
2. `Ctrl+Shift+P` > **SuuntoPlus: Open SuuntoPlus Simulator**
3. Select your watch model and click Play

### Deploying to watch

1. Connect your Suunto watch via Bluetooth (enable in VS Code settings: SuuntoPlus > Enable Bluetooth)
2. Unpair the watch from the Suunto mobile app first (watch: Settings > Connectivity > Paired devices > MobileApp > Forget)
3. `Ctrl+Shift+P` > **SuuntoPlus: Deploy Default App To Watch**

## Architecture

The app uses a pure-function state machine pattern:

- `src/state.js` -- all logic as pure functions: state in, `{state, effects}` out
- `src/bridge.js` -- SuuntoPlus SDK integration: maps button events to state functions, renders display
- `t.html` -- watch face template with SuuntoPlus CSS classes
- `tests/state.test.js` -- Vitest test suite (59 tests)
- `scripts/build.js` -- concatenates state + bridge into `main.js` (strips ES module exports, converts function declarations to var expressions for ES5 compatibility)

The state machine is fully testable without any watch or SDK dependencies.

## ES5 Constraints

The Suunto watch runtime is ES5 only. Key restrictions:

- No `let`, `const`, arrow functions, template literals, or destructuring
- No `Object.assign` -- use a manual shallow copy
- Global `function` declarations are reserved for SDK callbacks (`onLoad`, `evaluate`, `onEvent`, etc.)
- Custom functions must use `var name = function() {}` syntax

## Compatible Watches

Tested on Suunto Race S. Should work on any Suunto watch that supports SuuntoPlus Sports Apps with UI version 2.

## License

[MIT](LICENSE)
