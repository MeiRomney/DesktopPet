import { useState } from "react";
import type { ReactNode } from "react";
import type { AiMode, AiProvider, OllamaState } from "../types";
import type { AiApi } from "../hooks/useAi";

const Section = ({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
}) => (
  <section className="cpSection">
    <h3>{title}</h3>
    {hint && <p className="cpHint">{hint}</p>}
    {children}
  </section>
);

const Row = ({
  label,
  ok,
  detail,
}: {
  label: string;
  ok: boolean;
  detail: string;
}) => (
  <div className="cpRow">
    <span>{label}</span>
    <span className="cpHint">
      {ok ? "✓ " : "✗ "}
      {detail}
    </span>
  </div>
);

const MODES: [AiMode, string][] = [
  ["off", "Off"],
  ["ollama", "Ollama (local)"],
  ["key", "My API key"],
];
const MODE_TEXT: Record<AiMode, string> = {
  off: "The pet only says its built-in lines. Nothing leaves your PC and nothing needs to be installed.",
  ollama:
    "The AI runs on your PC through Ollama. Free and private. This is also the only mode where the Camera works.",
  key: "Use your own Anthropic or OpenAI key. Chat messages and the pet's memories are sent to that provider and billed to your key.",
};
const PROVIDERS: [AiProvider, string][] = [
  ["anthropic", "Anthropic"],
  ["openai", "OpenAI"],
];
const DEFAULT_MODEL: Record<AiProvider, string> = {
  anthropic: "claude-haiku-5-5",
  openai: "gpt-4o-mini",
};
const OLLAMA_TEXT: Record<OllamaState, string> = {
  missing: "Not installed",
  stopped: "Installed, not running",
  running: "Running",
};

export function AiTab({ ai }: { ai: AiApi }) {
  const { settings, status, pull, busy, note } = ai;
  const [key, setKey] = useState("");
  const o = status?.ollama;
  const missingModels =
    !!o && o.state === "running" && (!o.hasChat || !o.hasVision);
  const pct =
    pull && pull.total
      ? Math.min(100, Math.round((pull.completed / pull.total) * 100))
      : 0;

  return (
    <>
      <Section
        title="How should the pet think?"
        hint={MODE_TEXT[settings.mode]}
      >
        <div className="seg" role="group">
          {MODES.map(([v, label]) => (
            <button
              key={v}
              className={`segBtn${v === settings.mode ? " on" : ""}`}
              aria-pressed={v === settings.mode}
              onClick={() => ai.update({ mode: v })}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      {settings.mode === "ollama" && (
        <Section
          title="Local AI (Ollama)"
          hint="The two models need about 5 GB of disk space. This page updates by itself, so you can install Ollama and come back."
        >
          <Row
            label="Ollama app"
            ok={o?.state === "running"}
            detail={o ? OLLAMA_TEXT[o.state] : "Checking..."}
          />
          <Row
            label={`Chat model (${status?.models.chat ?? "llama3.2:3b"})`}
            ok={!!o?.hasChat}
            detail={o?.hasChat ? "Ready" : "Not downloaded"}
          />
          <Row
            label={`Vision model for Camera (${status?.models.vision ?? "gemma3:4b"})`}
            ok={!!o?.hasVision}
            detail={o?.hasVision ? "Ready" : "Not downloaded"}
          />
          <div className="zoneRow">
            {o?.state === "missing" && (
              <button className="pill on" onClick={ai.openDownload}>
                Download Ollama
              </button>
            )}
            {o?.state === "stopped" && (
              <button
                className="pill on"
                disabled={busy === "start"}
                onClick={ai.startOllama}
              >
                {busy === "start" ? "Starting..." : "Start Ollama"}
              </button>
            )}
            {missingModels && (
              <button
                className="pill on"
                disabled={busy === "pull"}
                onClick={ai.pullModels}
              >
                {busy === "pull" ? "Downloading..." : "Download models"}
              </button>
            )}
            {o?.state === "running" && !missingModels && (
              <button
                className="pill"
                disabled={busy === "test"}
                onClick={ai.test}
              >
                {busy === "test" ? "Testing..." : "Test chat"}
              </button>
            )}
          </div>
          {o?.state === "missing" && (
            <p className="cpHint">
              Already installed somewhere unusual? Start Ollama yourself and
              this page will notice.
            </p>
          )}
          {busy === "pull" && pull && (
            <>
              <div className="cpBar">
                <i style={{ width: `${pct}%` }} />
              </div>
              <p className="cpHint">
                {pull.model}: {pull.total ? `${pct}%` : pull.status}
              </p>
            </>
          )}
        </Section>
      )}

      {settings.mode === "key" && (
        <Section
          title="Cloud AI (your API key)"
          hint="The key is stored encrypted on this PC and only used to talk to the provider you pick. The Camera stays off in this mode."
        >
          <div className="zoneRow">
            {PROVIDERS.map(([v, label]) => (
              <button
                key={v}
                className={`pill${v === settings.provider ? " on" : ""}`}
                aria-pressed={v === settings.provider}
                onClick={() => ai.update({ provider: v })}
              >
                {label}
              </button>
            ))}
          </div>
          <input
            className="cpInput"
            type="password"
            autoComplete="off"
            value={key}
            placeholder={
              settings.hasKey
                ? "Key saved. Paste a new one to replace it"
                : "Paste your API key"
            }
            onChange={(e) => setKey(e.target.value)}
          />
          <input
            key={`${settings.provider}-${settings.model}`}
            className="cpInput"
            defaultValue={settings.model}
            placeholder={`Model (default: ${DEFAULT_MODEL[settings.provider]})`}
            onBlur={(e) =>
              e.target.value.trim() !== settings.model &&
              ai.update({ model: e.target.value })
            }
          />
          <div className="zoneRow">
            <button
              className="pill on"
              disabled={!key.trim()}
              onClick={async () => {
                await ai.update({ apiKey: key });
                setKey("");
              }}
            >
              Save key
            </button>
            {settings.hasKey && (
              <button
                className="pill"
                onClick={() => ai.update({ apiKey: "" })}
              >
                Remove key
              </button>
            )}
            <button
              className="pill"
              disabled={!settings.hasKey || busy === "test"}
              onClick={ai.test}
            >
              {busy === "test" ? "Testing..." : "Test connection"}
            </button>
          </div>
        </Section>
      )}

      {note && <p className="cpHint">{note}</p>}
    </>
  );
}
