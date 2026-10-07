import { useEffect } from "react";
import type { CSSProperties, Ref } from "react";
import { ITEMS } from "../reactions";

type Props = {
  panelRef: Ref<HTMLDivElement>;
  placed?: CSSProperties; // placed = where to put the menu when there is no room below the pet
  quick: [string, string]; // the two toys chosen in the control panel
  onSpawn(emoji: string, name: string): void;
  onOpenPanel(): void;
  text: string;
  onText(t: string): void;
  onSend(): void;
  onClose(): void;
};

/** What opens when you click the pet: no card, just your two toys, a button for the control panel, and the chat box. Esc or clicking the pet again closes it. */
export function PetMenu({
  panelRef,
  placed,
  quick,
  onSpawn,
  onOpenPanel,
  text,
  onText,
  onSend,
  onClose,
}: Props) {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  const toys = quick.flatMap((e) => ITEMS.filter(([x]) => x === e));
  return (
    <div
      ref={panelRef}
      className={`panel${placed ? " placed" : ""}`}
      style={placed}
    >
      <div className="toys three">
        {toys.map(([e, n]) => (
          <button
            key={e}
            className="toy big"
            title={`Drop ${n}`}
            onClick={() => onSpawn(e, n)}
          >
            {e}
          </button>
        ))}
        <button
          className="toy big"
          title="Open control panel"
          aria-label="Open control panel"
          onClick={onOpenPanel}
        >
          ⚙️
        </button>
      </div>
      <div className="chat">
        <input
          value={text}
          autoFocus
          placeholder="Say something"
          onChange={(e) => onText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSend()}
        />
        <button
          className="send"
          title="Send"
          aria-label="Send"
          onClick={onSend}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
