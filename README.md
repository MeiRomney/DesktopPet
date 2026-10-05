# Stick: an AI desktop pet (Windows)

A stickman that lives on your desktop, reacts in real time through a local Ollama model, and remembers what you did to it.

## Setup
1. Install Node.js 20+ (https://nodejs.org) and Ollama for Windows (https://ollama.com/download).
2. `ollama pull llama3.2:3b` (any small instruct model works; try a few and set `PET_MODEL`).
3. In this folder: `npm install`
4. `npm run dev`

## Use it
- Drag the pet anywhere. Click it (without dragging) to open the panel.
- **Roam** (in the panel): *Free* wanders the whole screen, *Box* stays inside a rectangle you draw, *Edges* stays on the taskbar and the top of your app (see v0.4).
- Emoji buttons place an object on screen; click the object to use it on the pet.
- Type in the box to talk. Say "go away" / "leave" / "hide" and it says goodbye, then hides.
- Bring it back with the tray icon or Ctrl+Alt+P. Quit from the tray menu.
- Different model: `set PET_MODEL=qwen2.5:3b` then `npm run dev` (PowerShell: `$env:PET_MODEL="qwen2.5:3b"`).
- Memory file: `%APPDATA%\desktop-pet\memory.json` (delete it to reset the pet).
- Run without the dev server: `npm start`.

## Structure
```
electron/
  main.cjs            overlay window, tray, shortcut, Ollama calls, memory file
  preload.cjs         safe bridge between the window and the app (window.api)
  windows.cjs         foreground-window tracker for Edges mode (Windows only)
src/
  main.tsx            entry point
  App.tsx             wires the hooks and components together
  types.ts            shared types and the window.api typing
  constants.ts        sizes, colors, which objects scare or attract the pet, AI chance
  utils.ts            small helpers (clamp, rectFrom)
  edges.ts            Edges geometry: the rails it can stand on (taskbar, top of the focused app)
  reactions.ts        scripted lines for objects and idle chatter (no AI)
  hooks/
    usePetCore.ts     position, pose, size, shared refs, allowed-area bounds
    useSpeech.ts      bubbles, scripted lines, AI chat replies, random AI, screen glance
    useMovement.ts    walking, running away, wandering, staying inside the area
    useInteractions.ts dragging the pet and objects, spawning, reactions
    useZone.ts        roam mode (free / box / edges), the saved box, drawing it, edge options
    useEdges.ts       Edges mode: walks the rails, follows the focused app, snaps back after a drag
    usePupilTracking.ts  pupils follow the mouse
  components/
    Stickman.tsx      the character drawing (SVG)
    Panel.tsx         the control card (objects, color, size, zone, chat)
    SpeechBubbles.tsx pet bubble, your message bubble, thinking dots
    WorldObjects.tsx  emoji objects on the desktop
    ZoneOverlay.tsx   zone outline and the drawing layer
  styles/
    index.css         imports the files below
    base.css pet.css walk.css bubbles.css panel.css objects.css zone.css
```

## Notes
- Recording in OBS: use Display Capture (Window Capture can show a black background for transparent overlays).
- Primary monitor only for now.

## v0.2 behavior
- The pet wanders the desktop on its own (pauses while you hover, drag or have the panel open).
- Drag emoji objects around. The pet reacts as they get close, and drops onto it count as "used on the pet".
- Objects left elsewhere: the pet walks over to investigate them.
- Drag the pet to pick it up; it dangles and looks shocked until you let go.

## v0.3: when the AI is used
- **Chat:** every message you type gets a real AI reply (`PET_MODEL`).
- **Screen glance (optional):** every 8-15 minutes the pet looks at a screenshot of your primary monitor and comments (`PET_VISION_MODEL`, default `gemma3:4b`, run `ollama pull gemma3:4b`). Off by default: click 👀 in the panel to turn it on, 📸 to look right now. The screenshot goes only to your local Ollama and is never saved.
- **Everything else** (dropping objects, dragging, wandering, idle lines) is scripted, so it is instant and free. Those events are still logged to memory, so the pet can bring them up when you chat.

## v0.4: Edges mode (stay out of your way)
Panel > Roam > **Edges**. The pet stays on the edges instead of the middle of the screen, so your focused work area stays clear. It always stands upright, feet down: no climbing, no hanging.
- **Taskbar:** walks along the top of the taskbar. It follows the real work area, so a taskbar on any side of the screen is respected.
- **App tops:** stands on top of the window you are using. It only does this when there is a full pet-height of free room above the window (plus room for its speech bubble), so it never covers the app. A maximized app leaves no room, so the pet stays on the taskbar.
- You can turn either one off (at least one stays on). With only *App tops* on and no room above the app, it falls back to the taskbar.
- **Fullscreen apps** (video, games, F11 browser, slideshows): the pet hides itself, and comes back when you leave fullscreen. Ctrl+Alt+P still shows or hides it manually.
- Drop the pet in the middle of the screen and it hurries to the nearest edge. Drag objects out and it still walks over to investigate, then returns to the edges.
- The panel opens beside the pet instead of below it when the pet is on the taskbar.
- How it knows the focused app: a small background PowerShell process (started only while Edges mode is on) reads the foreground window's position, size and class name 2-3 times a second. It never reads titles, text or screenshots. Windows only; on other systems Edges mode uses the taskbar only. Primary monitor only, like the rest of the pet.
- Old saved zones keep working: a zone that was "on" opens as *Box*.
