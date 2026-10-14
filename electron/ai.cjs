// AI layer for the pet. Three modes:
//   off    - built-in lines only, no network at all
//   ollama - local Ollama (chat model + vision model)
//   key    - the user's own API key (Anthropic or OpenAI)
// The camera (screen glance) is only allowed in "ollama" mode with both models installed,
// so screenshots never leave the PC. This is enforced here, not in the UI.
const { app, safeStorage, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");

const OLLAMA = "http://127.0.0.1:11434";
const CHAT_MODEL = process.env.PET_MODEL || "llama3.2:3b";
const VISION_MODEL = process.env.PET_VISION_MODEL || "gemma3:4b";
const DEFAULT_MODEL = { anthropic: "claude-haiku-5-5", openai: "gpt-4o-mini" };

// ---------- settings (userData/ai-settings.json, API key encrypted when the OS allows it) ----------
const DEFAULTS = { mode: "off", provider: "anthropic", model: "" };
let cache = null;
const file = () => path.join(app.getPath("userData"), "ai-settings.json");
function load() {
  if (cache) return cache;
  try {
    cache = { ...DEFAULTS, ...JSON.parse(fs.readFileSync(file(), "utf8")) };
  } catch {
    cache = { ...DEFAULTS };
  }
  return cache;
}
const save = () => fs.writeFileSync(file(), JSON.stringify(cache, null, 2));

function getKey() {
  const s = load();
  if (s.keyEnc) {
    try {
      return safeStorage.decryptString(Buffer.from(s.keyEnc, "base64"));
    } catch {
      return "";
    }
  }
  return s.keyPlain || "";
}
function setKey(k) {
  const s = load();
  delete s.keyEnc;
  delete s.keyPlain;
  if (!k) return;
  if (safeStorage.isEncryptionAvailable())
    s.keyEnc = safeStorage.encryptString(k).toString("base64");
  else s.keyPlain = k;
}

/** What the UI may see. The key itself never leaves this process. */
function getSettings() {
  const s = load();
  return {
    mode: s.mode,
    provider: s.provider,
    model: s.model,
    hasKey: !!(s.keyEnc || s.keyPlain),
  };
}
function update(p) {
  const s = load();
  if (["off", "ollama", "key"].includes(p.mode)) s.mode = p.mode;
  if (["anthropic", "openai"].includes(p.provider)) {
    if (p.provider !== s.provider && p.model === undefined) s.model = "";
    s.provider = p.provider;
  }
  if (typeof p.model === "string") s.model = p.model.trim();
  if (typeof p.apiKey === "string") setKey(p.apiKey.trim());
  save();
  return getSettings();
}

// ---------- Ollama status / setup ----------
const ollamaExe = () => {
  const p = path.join(
    process.env.LOCALAPPDATA || "",
    "Programs",
    "Ollama",
    "ollama.exe",
  );
  return fs.existsSync(p) ? p : null;
};

async function ollamaStatus() {
  try {
    const r = await fetch(`${OLLAMA}/api/tags`, {
      signal: AbortSignal.timeout(1500),
    });
    if (!r.ok) throw new Error("bad status");
    const names = ((await r.json()).models || []).map((m) => m.name);
    return {
      state: "running",
      hasChat: names.includes(CHAT_MODEL),
      hasVision: names.includes(VISION_MODEL),
    };
  } catch {
    return {
      state: ollamaExe() ? "stopped" : "missing",
      hasChat: false,
      hasVision: false,
    };
  }
}

async function status() {
  const o = await ollamaStatus();
  const mode = load().mode;
  const missing = [];
  if (o.state === "running") {
    if (!o.hasChat) missing.push(CHAT_MODEL);
    if (!o.hasVision) missing.push(VISION_MODEL);
  }
  let reason = "";
  if (mode === "off")
    reason = "The camera needs local AI. Switch to Ollama in the AI tab.";
  else if (mode === "key")
    reason =
      "The camera only works with local Ollama, so your screenshots never leave this PC. Switch to Ollama in the AI tab.";
  else if (o.state === "missing") reason = "Ollama is not installed.";
  else if (o.state === "stopped") reason = "Ollama is not running.";
  else if (missing.length) reason = `Missing models: ${missing.join(", ")}.`;
  return {
    ollama: o,
    models: { chat: CHAT_MODEL, vision: VISION_MODEL },
    cameraReady: reason === "",
    cameraReason: reason,
  };
}

const openDownload = () => shell.openExternal("https://ollama.com/download");

async function startOllama() {
  const exe = ollamaExe();
  if (!exe) return;
  try {
    const p = spawn(exe, ["serve"], {
      detached: true,
      stdio: "ignore",
      windowsHide: true,
    });
    p.on("error", () => {});
    p.unref();
  } catch {
    /* ignore */
  }
  for (let i = 0; i < 16; i++) {
    await new Promise((r) => setTimeout(r, 500));
    if ((await ollamaStatus()).state === "running") return;
  }
}

async function pullModel(name, onProgress) {
  const res = await fetch(`${OLLAMA}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: name, stream: true }),
  });
  if (!res.ok || !res.body)
    throw new Error(`Could not download ${name} (${res.status}).`);
  const dec = new TextDecoder();
  let buf = "";
  for await (const chunk of res.body) {
    buf += dec.decode(chunk, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line) continue;
      const j = JSON.parse(line);
      if (j.error) throw new Error(j.error);
      onProgress({
        model: name,
        status: j.status || "",
        completed: j.completed || 0,
        total: j.total || 0,
      });
    }
  }
}

let pulling = false;
async function pullMissing(onProgress) {
  if (pulling) throw new Error("A download is already running.");
  pulling = true;
  try {
    const o = await ollamaStatus();
    if (o.state !== "running") throw new Error("Ollama is not running.");
    if (!o.hasChat) await pullModel(CHAT_MODEL, onProgress);
    if (!o.hasVision) await pullModel(VISION_MODEL, onProgress);
  } finally {
    pulling = false;
  }
}

// ---------- chat ----------
async function httpError(res) {
  let msg = "";
  try {
    msg = (await res.json()).error?.message || "";
  } catch {
    /* ignore */
  }
  const code =
    res.status === 401 || res.status === 403
      ? "badkey"
      : res.status === 429
        ? "ratelimit"
        : res.status === 404
          ? "nomodel"
          : "http";
  return Object.assign(new Error(`${res.status} ${msg}`.trim()), { code });
}

async function post(url, headers, body, ms = 120000) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(ms),
    });
  } catch (e) {
    const timeout = e && (e.name === "TimeoutError" || e.name === "AbortError");
    throw Object.assign(new Error(String((e && e.message) || e)), {
      code: timeout ? "timeout" : "unreachable",
    });
  }
  if (!res.ok) throw await httpError(res);
  return res.json();
}

async function chatOllama(system, user, schema, model, images) {
  const data = await post(
    `${OLLAMA}/api/chat`,
    {},
    {
      model,
      stream: false,
      format: schema,
      options: { temperature: 0.9 },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user, ...(images && { images }) },
      ],
    },
  );
  return JSON.parse(data.message.content);
}

async function chatCloud(system, user, schema) {
  const s = load();
  const key = getKey();
  if (!key) throw Object.assign(new Error("No API key"), { code: "nokey" });
  const model = s.model || DEFAULT_MODEL[s.provider];
  if (s.provider === "anthropic") {
    const data = await post(
      "https://api.anthropic.com/v1/messages",
      { "x-api-key": key, "anthropic-version": "2023-06-01" },
      {
        model,
        max_tokens: 400,
        system,
        tools: [
          {
            name: "reply",
            description: "Send the pet's reply.",
            input_schema: schema,
          },
        ],
        tool_choice: { type: "tool", name: "reply" },
        messages: [{ role: "user", content: user }],
      },
      60000,
    );
    const block = (data.content || []).find((b) => b.type === "tool_use");
    if (!block) throw new Error("Empty reply");
    return block.input;
  }
  const data = await post(
    "https://api.openai.com/v1/chat/completions",
    { Authorization: `Bearer ${key}` },
    {
      model,
      max_completion_tokens: 400,
      response_format: {
        type: "json_schema",
        json_schema: { name: "pet_reply", strict: true, schema },
      },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    },
    60000,
  );
  return JSON.parse(data.choices[0].message.content);
}

/** opts.vision + opts.images: screenshot call. Only ever allowed with local Ollama. */
async function chat(system, user, schema, opts = {}) {
  const mode = load().mode;
  if (mode === "off")
    throw Object.assign(new Error("AI is off"), { code: "off" });
  if (opts.vision) {
    if (mode !== "ollama")
      throw Object.assign(new Error("Camera needs Ollama"), { code: "camera" });
    return chatOllama(system, user, schema, VISION_MODEL, opts.images);
  }
  if (mode === "ollama") return chatOllama(system, user, schema, CHAT_MODEL);
  return chatCloud(system, user, schema);
}

const TEST_SCHEMA = {
  type: "object",
  properties: { says: { type: "string" } },
  required: ["says"],
  additionalProperties: false,
};
async function test() {
  const r = await chat(
    "You are a tiny desktop pet. Reply in under 8 words.",
    "Say hi.",
    TEST_SCHEMA,
  );
  return String(r.says || "").slice(0, 80);
}

/** Short, user-facing text (it ends up in the pet's speech bubble). */
function describeError(err) {
  const ollama = load().mode === "ollama";
  switch (err && err.code) {
    case "off":
      return "AI is turned off.";
    case "unreachable":
      return ollama
        ? "I cannot reach Ollama. Check the AI tab."
        : "I cannot reach the AI service. Check your internet.";
    case "nomodel":
      return ollama
        ? "My Ollama model is missing. Download it in the AI tab."
        : "That model name was not found. Check the AI tab.";
    case "nokey":
      return "No API key yet. Add one in the AI tab.";
    case "badkey":
      return "My API key was rejected. Check the AI tab.";
    case "ratelimit":
      return "The AI service says slow down. Try again soon.";
    case "timeout":
      return "The AI took too long to answer.";
    case "camera":
      return "The camera only works with local Ollama.";
    default:
      return `AI error: ${String((err && err.message) || err).slice(0, 120)}`;
  }
}

module.exports = {
  getSettings,
  update,
  status,
  openDownload,
  startOllama,
  pullMissing,
  chat,
  test,
  describeError,
};
