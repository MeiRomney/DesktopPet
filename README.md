# Stick: an AI desktop pet (Windows)

A stickman that lives on your desktop, reacts in real time through a local Ollama model, and remembers what you did to it.

## Setup
1. Install Node.js 20+ (https://nodejs.org) and Ollama for Windows (https://ollama.com/download).
2. `ollama pull llama3.2:3b` (any small instruct model works; try a few and set `PET_MODEL`).
3. In this folder: `npm install`
4. `npm run dev`

## Use it
- Drag the pet anywhere. Click it (without dragging) to open the panel.
- Emoji buttons place an object on screen; click the object to use it on the pet.
- Type in the box to talk. Say "go away" / "leave" / "hide" and it says goodbye, then hides.
- Bring it back with the tray icon or Ctrl+Alt+P. Quit from the tray menu.
- Different model: `set PET_MODEL=qwen2.5:3b` then `npm run dev` (PowerShell: `$env:PET_MODEL="qwen2.5:3b"`).
- Memory file: `%APPDATA%\desktop-pet\memory.json` (delete it to reset the pet).
- Run without the dev server: `npm start`.

## Structure
- `electron/main.cjs`: overlay window, tray, shortcut, Ollama calls, memory
- `electron/preload.cjs`: safe bridge between window and app
- `src/App.tsx`: pet, dragging, panel, objects, click-through logic
- `src/styles.css`, `index.html`, `vite.config.ts`, `tsconfig.json`

## Notes
- Recording in OBS: use Display Capture (Window Capture can show a black background for transparent overlays).
- Primary monitor only for now.
