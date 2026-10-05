/** The pet's speech bubble, your own message bubble, and the "thinking" dots. */
export function SpeechBubbles({ says, userSays, thinking, side }: { says: string; userSays: string; thinking: boolean; side: 'left' | 'right' }) {
  return (
    <>
      {says && <div className="bubble">{says}</div>}
      {userSays && <div className={`userBubble ${side}`}>{userSays}</div>}
      {thinking && <div className="thinking">...</div>}
    </>
  );
}
