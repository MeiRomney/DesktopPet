export const SHORTCUTS = [
  {
    id: "pet",
    keys: ["Ctrl", "Alt", "P"],
    label: "Pet",
    desc: "Hides it (runs off screen) or brings it back.",
  },
  {
    id: "panel",
    keys: ["Ctrl", "Alt", "O"],
    label: "Control panel",
    desc: "Opens it, or minimizes it when it is in front.",
  },
  {
    id: "emote",
    keys: ["Ctrl", "Alt", "E"],
    label: "Random emote",
    desc: "The pet does one random dance move.",
  },
  {
    id: "dance",
    keys: ["Ctrl", "Alt", "D"],
    label: "Dance-off",
    desc: "Starts a dance-off with your saved duration and moves. Press again to stop.",
  },
  {
    id: "toys",
    keys: ["Ctrl", "Alt", "T"],
    label: "Summon a toy",
    desc: "Drops a random toy next to the pet.",
  },
  {
    id: "mute",
    keys: ["Ctrl", "Alt", "M"],
    label: "Mute",
    desc: "Hides or shows the pet's speech bubbles.",
  },
] as const;
