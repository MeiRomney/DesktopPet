import type { CSSProperties, Ref } from "react";

type Props = {
  panelRef: Ref<HTMLDivElement>;
  placed?: CSSProperties; // placed = where to put the card when there is no room below the pet
  onSpawn(emoji: string, name: string): void;
  text: string;
  onText(t: string): void;
  onSend(): void;
  onClose(): void;
};

const QUICK: [string, string][] = [
  ["🔫", "a gun"],
  ["🗡️", "a sword"],
];

/** The small card that opens when you click the pet: two weapons, a chat box, and a way out. Everything else lives in the control panel. */
export function PetMenu({
  panelRef,
  placed,
  onSpawn,
  text,
  onText,
  onSend,
  onClose,
}: Props) {
  return (
    <div
      ref={panelRef}
      className={`panel${placed ? " placed" : ""}`}
      style={placed}
    >
      <div className="toys two">
        {QUICK.map(([e, n]) => (
          <button
            key={e}
            className="toy big"
            title={`Drop ${n}`}
            onClick={() => onSpawn(e, n)}
          >
            {e}
          </button>
        ))}
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
      <button className="nevermind" onClick={onClose}>
        Never mind
      </button>
    </div>
  );
}
