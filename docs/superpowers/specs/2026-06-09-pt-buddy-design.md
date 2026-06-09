# PT Buddy — SuuntoPlus Sports App Design

A SuuntoPlus Sports App for the Suunto Race S that helps track physical therapy exercises during a workout. Provides a rep counter, hold timer, and rest timer with bilateral (left/right) support.

## Platform

- **Target:** SuuntoPlus Sports App (compatible with Suunto Race S and other SuuntoPlus-capable watches)
- **Tech stack:** JavaScript (logic), HTML/CSS (display), JSON (manifest)
- **Dev tools:** SuuntoPlus Editor VS Code extension (simulator, build, deploy)
- **No external dependencies** — no HR, GPS, or sensor data needed

## Modes

The app has two exercise modes and one transitional state:

### Count Mode
- Tracks reps via button taps
- User decides when a set is done by pressing the transition button
- Green color theme

### Hold Mode
- Countdown timer for isometric exercises (wall sits, single-leg stands, etc.)
- Default duration: 30 seconds, adjustable in 10s increments before starting
- Vibrates on completion
- Orange color theme

### Rest (transitional state)
- Countdown timer between sets
- Only entered after completing a set in Count or Hold mode — never selected directly
- Default duration: 30 seconds, adjustable in 10s increments during rest
- Vibrates on completion, then returns to the exercise mode for the next set
- Blue color theme

## State Machine

### Standard (bilateral off)

```
Count (tap reps) ──[transition btn]──► Rest ──[timer expires]──► Count (next set)
Hold  (countdown) ──[timer expires]──► Rest ──[timer expires]──► Hold  (next set)
```

### Bilateral (L/R mode on)

```
Count(L) ──[transition btn]──► Count(R) ──[transition btn]──► Rest ──► Count(L) next set
Hold(L)  ──[timer expires]───► Hold(R)  ──[timer expires]───► Rest ──► Hold(L)  next set
```

### Mode Switching

- Long-press action button toggles between Count and Hold mode
- Only available when starting a new exercise (0 reps / hold not started)
- Locked out mid-set to prevent accidental switches
- Switching exercise type resets the set counter to 1

### Bilateral Toggle

- Long-press transition button toggles bilateral (L/R) mode on/off
- Only available when starting a new exercise
- When on, each set requires completing both sides before rest
- In bilateral Count mode, the transition button means "done with this side" on the first side (L→R), and "done with set" on the second side (R→Rest)
- Display shows L/R indicator with the active side highlighted

### New Exercise Reset

- Long-press action button at exercise start resets reps and set counter to 1
- Works whether switching modes (Count↔Hold) or staying in the same mode (e.g., moving from calf raises to squats)
- Also resets hold/rest durations back to 30s defaults

## Button Mapping

Two-button interaction model:

### Action Button (primary)

| State | Tap | Long Press |
|-------|-----|------------|
| Count (mid-set) | +1 rep | — |
| Count (fresh, 0 reps) | +1 rep | Toggle Count ↔ Hold |
| Hold (stopped) | Start hold timer | Toggle Count ↔ Hold |
| Hold (running) | End early → next phase | — |
| Rest (running) | End rest early → next set | — |

### Transition Button (secondary)

| State | Tap | Long Press |
|-------|-----|------------|
| Count (mid-set) | Done with set → Rest | — |
| Count (fresh, 0 reps) | — | Toggle bilateral on/off |
| Hold (stopped) | +10s to hold duration | Toggle bilateral on/off |
| Hold (running) | — | — |
| Rest (running) | +10s to rest duration | — |

## Watch Display

Round AMOLED layout with three color-coded screens.

### Common Elements
- Mode label at top (COUNT / HOLD / REST)
- Large central number (rep count or mm:ss timer)
- Unit label below center ("reps" / "remaining")
- Set indicator at bottom ("Set 2" or "Next: Set 3" during rest)
- Progress arc around the display edge for timed modes

### Count Screen
- Green theme (#4CAF50)
- Large rep count in center
- When bilateral: L/R pills below mode label, active side highlighted in green

### Hold Screen
- Orange theme (#FF9800)
- Countdown timer in mm:ss format
- Progress arc depletes as time passes
- When bilateral: L/R pills below mode label, active side highlighted in orange

### Rest Screen
- Blue theme (#2196F3)
- Countdown timer in mm:ss format
- Progress arc depletes as time passes
- Bottom shows "Next: Set N" instead of current set

## Haptic Feedback

| Event | Pattern | Purpose |
|-------|---------|---------|
| Hold timer complete | 3 short pulses | Done — switch sides or rest |
| Rest timer complete | 2 long pulses | Get ready — next set starting |
| Side switch (L→R) | 1 short pulse | Quick nudge — swap sides |
| 5-second warning | 1 short pulse | Heads up — timer almost done |

No vibration on rep count taps.

## Defaults

| Setting | Default | Adjustment |
|---------|---------|------------|
| Hold duration | 30s | Tap transition button before starting (+10s per tap) |
| Rest duration | 30s | Tap transition button during rest (+10s per tap) |
| Bilateral | Off | Long-press transition button at exercise start |
| Set counter | 1 | Auto-increments after each complete cycle |

All adjustments are on-the-fly. Durations reset to defaults when switching exercise type.

## Technical Architecture

### Project Files

| File | Purpose |
|------|---------|
| `manifest.json` | App metadata (name, version, icon), no input resources required |
| `main.js` | State machine, timers, rep counting, button handling, vibration triggers |
| `display.html` | Watch face template with CSS for all three mode screens |

### SuuntoPlus Callbacks

- **`onLoad()`** — Initialize state: mode=Count, reps=0, set=1, bilateral=off, holdDuration=30, restDuration=30
- **`evaluate()`** — Called each tick: update timer countdowns, process button events, trigger state transitions and vibrations

### State Variables

```
mode: "count" | "hold" | "rest"
reps: number
set: number
bilateral: boolean
activeSide: "L" | "R"
timerRemaining: number (seconds)
holdDuration: number (seconds, default 30)
restDuration: number (seconds, default 30)
timerRunning: boolean
previousMode: "count" | "hold" (for rest → return)
```

## Testing & Distribution

### Local Development
1. Install SuuntoPlus Editor VS Code extension
2. Test in the built-in simulator (renders watch display, simulates button events)
3. Deploy to Suunto Race S over USB or Bluetooth via "Deploy to Watch" command
4. Test during a real workout — start any sport mode, select PT Buddy as the SuuntoPlus app

### Publishing
1. Build a source package using the editor's "Create Source Package" command
2. Submit to Suunto for review — no partner account required (open submission since March 2026)
3. After approval, the app appears in the SuuntoPlus Store for all compatible watches

## Scope — What's NOT in MVP

- No pre-programmed exercise playlists or routines
- No workout history or summary logging
- No phone/cloud sync
- No configurable defaults (hardcoded 30s for hold and rest)
- No custom vibration patterns
