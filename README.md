# PT Buddy

A SuuntoPlus Sports App for tracking physical therapy exercises on your Suunto watch. Count reps, time holds, manage rest periods between sets, and track bilateral (L/R) exercises — all from your wrist during a workout.

## Features

- **Count mode** — tap to count reps, tap to undo
- **Hold mode** — configurable isometric hold timer (default 30s, adjustable in 15s increments)
- **Rest timer** — auto-starts between sets (default 30s, adjustable)
- **Bilateral L/R** — tracks left and right sides separately before resting
- **Haptic feedback** — vibration cues for side switches, warnings, and transitions
- **Three-button control** — Up/Down adjust values, Next advances through the workout

## Controls

### Count Mode

| Button | Action |
|--------|--------|
| Up | +1 rep |
| Down | -1 rep |
| Next | End set, start rest timer |
| Up long press | Switch to Hold mode (when 0 reps) |
| Down long press | Toggle bilateral L/R (when 0 reps) |

### Hold Mode

| Button | Before start | Timer running |
|--------|-------------|---------------|
| Up | +15s duration | +15s to timer |
| Down | -15s duration (min 15s) | -15s from timer |
| Next | Start timer | End hold, advance |
| Up long press | Switch to Count mode | — |
| Down long press | Toggle bilateral L/R | — |

### Rest Mode

| Button | Action |
|--------|--------|
| Up | +15s to timer |
| Down | -15s from timer |
| Next | Skip rest, start next set |

## Development

Requires [Node.js](https://nodejs.org/) and the [SuuntoPlus Editor](https://marketplace.visualstudio.com/items?itemName=suunto.suuntoplus-editor) VS Code extension.

```bash
npm install
npm test        # run 77 state machine tests
npm run build   # build main.js from src/
```

### Testing in the simulator

1. Open the project in VS Code
2. `Ctrl+Shift+P` > **SuuntoPlus: Open SuuntoPlus Simulator**
3. Select your watch model and click Play

### Deploying to watch

1. Connect your Suunto watch via USB
2. `Ctrl+Shift+P` > **SuuntoPlus: Deploy Default App To Watch**

## Architecture

The app uses a pure-function state machine pattern:

- `src/state.js` — all game logic as pure functions: state in, `{state, effects}` out
- `src/bridge.js` — SuuntoPlus SDK integration: maps button events to state functions, renders display
- `t.html` — watch face template with SuuntoPlus CSS classes
- `tests/state.test.js` — Vitest test suite (77 tests)
- `scripts/build.js` — concatenates state + bridge into `main.js` (strips ES module exports)

The state machine is fully testable without any watch or SDK dependencies.

## Compatible Watches

Tested on Suunto Race S. Should work on any Suunto watch that supports SuuntoPlus Sports Apps with UI version 2.

## License

[MIT](LICENSE)
