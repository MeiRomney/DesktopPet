import type { ToyActDef } from "../toyActs";

/** The toy and its effect, drawn on top of the pet while an act plays. */
export function ToyActProps({ act, emoji }: { act: ToyActDef; emoji: string }) {
  return (
    <>
      <div className={`toyProp prop-${act.id}`}>
        <span className="toyEmoji">{emoji}</span>
      </div>
      {act.fx && <div className={`toyProp fx-${act.id}`}>{act.fx}</div>}
    </>
  );
}
