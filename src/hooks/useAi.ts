import { useCallback, useEffect, useState } from "react";
import type {
  AiMode,
  AiProvider,
  AiPullProgress,
  AiSettings,
  AiStatus,
} from "../types";

type Patch = Partial<{
  mode: AiMode;
  provider: AiProvider;
  model: string;
  apiKey: string;
}>;

/** AI settings and live Ollama status for the control panel. The real work happens in electron/ai.cjs. */
export function useAi() {
  const [settings, setSettings] = useState<AiSettings>({
    mode: "off",
    provider: "anthropic",
    model: "",
    hasKey: false,
  });
  const [status, setStatus] = useState<AiStatus | null>(null);
  const [pull, setPull] = useState<AiPullProgress | null>(null);
  const [busy, setBusy] = useState<"" | "start" | "pull" | "test">("");
  const [note, setNote] = useState("");

  const refresh = useCallback(async () => {
    try {
      setStatus(await window.api.ai.status());
    } catch {
      /* keep the last status */
    }
  }, []);

  useEffect(() => {
    window.api.ai.getSettings().then(setSettings);
    refresh();
    const t = window.setInterval(refresh, 4000); // picks up "I just installed Ollama" by itself
    const off = window.api.ai.onProgress(setPull);
    return () => {
      window.clearInterval(t);
      off();
    };
  }, [refresh]);

  const update = async (p: Patch) => {
    setNote("");
    setSettings(await window.api.ai.update(p));
    refresh();
  };
  const startOllama = async () => {
    setBusy("start");
    await window.api.ai.startOllama();
    await refresh();
    setBusy("");
  };
  const pullModels = async () => {
    setBusy("pull");
    setNote("");
    const r = await window.api.ai.pullModels();
    setPull(null);
    setBusy("");
    if (!r.ok) setNote(r.error || "Download failed.");
    refresh();
  };
  const test = async () => {
    setBusy("test");
    setNote("");
    const r = await window.api.ai.test();
    setBusy("");
    setNote(
      r.ok ? `It works. The pet says: "${r.says}"` : `Test failed: ${r.error}`,
    );
  };

  return {
    settings,
    status,
    pull,
    busy,
    note,
    update,
    startOllama,
    pullModels,
    test,
    openDownload: window.api.ai.openDownload,
  };
}
export type AiApi = ReturnType<typeof useAi>;
