import { useEffect, useState } from "react";
import { ControlPanel } from "./components/ControlPanel";
import { useAppearance } from "./hooks/useAppearance";
import { useLookSettings } from "./hooks/useLookSettings";
import { useQuickToys } from "./hooks/useQuickToys";
import { useSize } from "./hooks/useSize";
import { useZone } from "./hooks/useZone";

/** The control panel window: a normal desktop window. It never moves the pet itself. Settings go through
 *  localStorage, actions through window.api.bus. Closing this window quits the app (see electron/main.cjs). */
export default function ControlApp() {
  const appearance = useAppearance();
  const zone = useZone();
  const { size, changeSize } = useSize();
  const look = useLookSettings();
  const quick = useQuickToys();
  const [thinking, setThinking] = useState(false);

  useEffect(() => {
    document.title = "Stick: Control panel";
    document.documentElement.classList.add("ctrlWin");
    return window.api.bus.on((m) => {
      if (m.type === "thinking") setThinking(m.on);
    });
  }, []);

  return (
    <ControlPanel
      appearance={appearance}
      camera={{
        ...look,
        thinking,
        lookNow: () => window.api.bus.send({ type: "lookNow" }),
      }}
      zone={zone}
      size={size}
      onEmote={(id) => window.api.bus.send({ type: "emote", id })}
      onDanceOff={(seconds) =>
        window.api.bus.send({ type: "danceOff", seconds })
      }
      onDanceStop={() => window.api.bus.send({ type: "danceStop" })}
      onSize={changeSize}
      quick={quick}
      onSpawn={(emoji, name) =>
        window.api.bus.send({ type: "spawn", emoji, name })
      }
      onStartZone={() => window.api.bus.send({ type: "drawZone" })}
    />
  );
}
