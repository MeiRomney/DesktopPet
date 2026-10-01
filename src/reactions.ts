// Scripted reactions: free, instant, no AI. The AI is only used for chat and the occasional screen look.
export type Pose =
  | "neutral"
  | "happy"
  | "scared"
  | "angry"
  | "sad"
  | "shocked"
  | "wave";
type Line = [Pose, string];

export const ITEMS: [string, string][] = [
  ["🔫", "a gun"],
  ["🗡️", "a sword"],
  ["🍰", "a cake"],
  ["🎹", "a piano"],
  ["💣", "a bomb"],
  ["🐱", "a cat"],
];

const LINES: Record<string, { spawn: Line[]; use: Line[] }> = {
  "🔫": {
    spawn: [
      ["scared", "Is that a gun? Please put it down."],
      ["shocked", "Why is there a gun on my desktop?!"],
    ],
    use: [
      ["shocked", "AAH! I surrender, I surrender!"],
      ["scared", "That was NOT funny. A little funny."],
    ],
  },
  "🗡️": {
    spawn: [
      ["shocked", "A sword? I only have stick arms!"],
      ["scared", "Sharp things make me nervous."],
    ],
    use: [
      ["scared", "Eep! Careful, I am made of lines!"],
      ["angry", "Hey! Rude!"],
    ],
  },
  "🍰": {
    spawn: [
      ["happy", "Cake! Is it for me?!"],
      ["happy", "I love you. I mean the cake."],
    ],
    use: [
      ["happy", "Nom nom nom. Best day ever!"],
      ["happy", "Cake in the face? Worth it."],
    ],
  },
  "🎹": {
    spawn: [
      ["happy", "A piano! I can play one note."],
      ["neutral", "Ooh, fancy."],
    ],
    use: [
      ["shocked", "OOF! A piano fell on me!"],
      ["sad", "Ow. I am flat now. Like a B-flat."],
    ],
  },
  "💣": {
    spawn: [
      ["scared", "That ticking is making me anxious."],
      ["shocked", "Is that a bomb?! Hide!"],
    ],
    use: [
      ["shocked", "KABOOM! My ears are ringing!"],
      ["angry", "I am covered in soot now!"],
    ],
  },
  "🐱": {
    spawn: [
      ["happy", "A kitty! Hi hi hi!"],
      ["happy", "Can we keep it?"],
    ],
    use: [
      ["happy", "Purrfect. Judged by a cat again."],
      ["happy", "Best friend acquired!"],
    ],
  },
};
const VISIT: Record<string, string[]> = {
  scared: ["Just looking. From far away.", "Nobody touch it. I mean it."],
  happy: ["Ooh! Found it!", "Hehe, you left me a present."],
  neutral: ["Hm. Interesting.", "What do you do, little thing?"],
  shocked: ["It is still here...", "Scarier up close!"],
};
const IDLE = [
  "La la la~",
  "Anyone there?",
  "Nice desktop you have.",
  "Beep boop.",
  "Just stretching my legs.",
];

function pick<T>(a: T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}
const FALLBACK: Line[] = [["shocked", "What is that?!"]];

export const nearPose = (emoji: string): Pose =>
  LINES[emoji]?.spawn[0][0] ?? "shocked";
export const react = (emoji: string, kind: "spawn" | "use") => {
  const [pose, says] = pick(LINES[emoji]?.[kind] ?? FALLBACK);
  return { pose, says };
};
export const visit = (emoji: string) => {
  const pose = nearPose(emoji);
  return { pose, says: pick(VISIT[pose] ?? VISIT.neutral) };
};
export const idleLine = () => pick(IDLE);
