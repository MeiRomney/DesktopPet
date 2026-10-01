const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  screen,
  ipcMain,
  globalShortcut,
  nativeImage,
  desktopCapturer,
} = require("electron");
const path = require("path");
const fs = require("fs");

const MODEL = process.env.PET_MODEL || "llama3.2:3b"; // change with PET_MODEL
const VISION_MODEL = process.env.PET_VISION_MODEL || "gemma3:4b"; // must support images
const OLLAMA = "http://127.0.0.1:11434/api/chat";
const POSES = ["neutral", "happy", "scared", "angry", "sad", "shocked"];
let win, tray;

const PERSONA = `You are Stick, a small living stickman on the user's desktop. You have real feelings, opinions and a memory. Be funny, expressive and consistent with what you remember (grudges, favorites, fears). Everything is cartoon slapstick: react dramatically but never gruesomely. "says" must be under 14 words. "note" is a short first-person memory of what just happened.`;
const REACT_SCHEMA = {
  type: "object",
  properties: {
    pose: { type: "string", enum: POSES },
    says: { type: "string" },
    note: { type: "string" },
  },
  required: ["pose", "says", "note"],
};
const SUMMARY_SCHEMA = {
  type: "object",
  properties: { summary: { type: "string" } },
  required: ["summary"],
};

// ---- memory (local JSON file) ----
const memFile = () => path.join(app.getPath("userData"), "memory.json");
const loadMem = () => {
  try {
    return JSON.parse(fs.readFileSync(memFile(), "utf8"));
  } catch {
    return { summary: "", events: [] };
  }
};
const saveMem = (m) => fs.writeFileSync(memFile(), JSON.stringify(m, null, 2));

// ---- Ollama ----
async function chat(system, user, schema, model = MODEL, images) {
  const res = await fetch(OLLAMA, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      format: schema,
      options: { temperature: 0.9 },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user, ...(images && { images }) },
      ],
    }),
  });
  if (!res.ok)
    throw new Error(`Ollama returned ${res.status} (is the model pulled?)`);
  return JSON.parse((await res.json()).message.content);
}

async function compact(mem) {
  if (mem.events.length <= 24) return;
  const old = mem.events.splice(0, mem.events.length - 12);
  const s = await chat(
    "Condense these memories into a first-person summary of max 60 words. Keep grudges, likes and fears.",
    `Old summary: ${mem.summary}\nEvents:\n${old.join("\n")}`,
    SUMMARY_SCHEMA,
  );
  mem.summary = s.summary;
}

// Scripted events are logged here without any AI call, so the pet still remembers them when you chat.
ipcMain.on("remember", (_e, text) => {
  const mem = loadMem();
  mem.events.push(String(text));
  if (mem.events.length > 60) mem.events.splice(0, mem.events.length - 60);
  saveMem(mem);
});

// Occasional glance at the desktop. The screenshot only goes to your local Ollama.
const LOOK_PERSONA =
  PERSONA +
  ` You can see a screenshot of the user's desktop. Ignore the small stickman, that is you. Make ONE playful remark about what the user seems to be doing (the app, the activity, the colors). Never read out or repeat private text such as messages, emails, names, passwords or numbers.`;
ipcMain.handle("look", async () => {
  try {
    const display = screen.getPrimaryDisplay();
    const { width, height } = display.size;
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: {
        width: 1280,
        height: Math.round((1280 * height) / width),
      },
    });
    const src =
      sources.find((x) => x.display_id === String(display.id)) || sources[0];
    const img = src.thumbnail.toJPEG(70).toString("base64");
    const r = await chat(
      LOOK_PERSONA,
      "Here is a screenshot of the desktop. Make one short remark.",
      REACT_SCHEMA,
      VISION_MODEL,
      [img],
    );
    const mem = loadMem();
    mem.events.push(`I glanced at the desktop: ${r.note}`);
    saveMem(mem);
    return { ok: true, pose: r.pose, says: r.says };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

ipcMain.handle("react", async (_e, event) => {
  const mem = loadMem();
  const prompt = `What you remember about the user: ${mem.summary || "nothing yet"}\nRecent events:\n${
    mem.events
      .slice(-12)
      .map((e) => "- " + e)
      .join("\n") || "- none"
  }\n\nNEW EVENT: ${event}`;
  try {
    const r = await chat(PERSONA, prompt, REACT_SCHEMA);
    mem.events.push(`${event} -> I felt ${r.pose}: ${r.note}`);
    await compact(mem);
    saveMem(mem);
    return { ok: true, pose: r.pose, says: r.says };
  } catch (err) {
    return { ok: false, error: String(err.message || err) };
  }
});

// ---- window ----
function createWindow() {
  const { x, y, width, height } = screen.getPrimaryDisplay().bounds;
  win = new BrowserWindow({
    x,
    y,
    width,
    height,
    transparent: true,
    backgroundColor: "#00000000",
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    hasShadow: false,
    webPreferences: { preload: path.join(__dirname, "preload.cjs") },
  });
  win.setAlwaysOnTop(true, "screen-saver");
  win.setIgnoreMouseEvents(true, { forward: true }); // click-through by default
  if (process.env.PET_DEV) win.loadURL("http://127.0.0.1:5173");
  else win.loadFile(path.join(__dirname, "../dist/index.html"));
}

const toggle = () => (win.isVisible() ? win.hide() : win.show());

app.whenReady().then(() => {
  createWindow();
  tray = new Tray(
    nativeImage.createFromPath(path.join(__dirname, "../assets/icon.png")),
  );
  tray.setToolTip("Stick");
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: "Show / Hide", click: toggle },
      { label: "Quit", click: () => app.quit() },
    ]),
  );
  tray.on("click", toggle);
  globalShortcut.register("Control+Alt+P", toggle);
});

ipcMain.on(
  "click-through",
  (_e, on) => win && win.setIgnoreMouseEvents(on, { forward: true }),
);
ipcMain.on("hide", () => win && win.hide());
app.on("will-quit", () => globalShortcut.unregisterAll());
