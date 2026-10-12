import type { Eyes } from "./types";

export const HATS = [
  ["none", "None"],
  ["cap", "Cap"],
  ["beanie", "Beanie"],
  ["tophat", "Top hat"],
  ["crown", "Crown"],
  ["ears", "Cat ears"],
  ["party", "Party"],
  ["bow", "Bow"],
  ["flower", "Flower"],
  ["witch", "Witch"],
  ["phones", "Headphones"],
  ["horns", "Devil horns"],
] as const;
export const SHIRTS = [
  ["none", "None"],
  ["tee", "T-shirt"],
  ["stripe", "Striped"],
  ["long", "Long sleeve"],
  ["hoodie", "Hoodie"],
  ["tank", "Tank top"],
  ["crop", "Crop top"],
  ["sailor", "Sailor"],
  ["dress", "Dress"],
  ["sweater", "Sweater"],
  ["offshoulder", "Off-shoulder"],
  ["halter", "Halter crop"],
] as const;
export const PANTS = [
  ["none", "None"],
  ["shorts", "Shorts"],
  ["jeans", "Long pants"],
  ["skirt", "Skirt"],
  ["mini", "Mini skirt"],
] as const;
export const HAIRS = [
  ["none", "None"],
  ["short", "Short"],
  ["spiky", "Spiky"],
  ["bob", "Bob"],
  ["long", "Long"],
  ["twintails", "Twintails"],
  ["bun", "Bun"],
  ["ponytail", "Ponytail"],
  ["hime", "Hime cut"],
  ["twinbuns", "Space buns"],
  ["braid", "Braid"],
  ["wavy", "Wavy"],
  ["curly", "Curly puff"],
  ["pixie", "Pixie"],
  ["sidepony", "Side pony"],
] as const;
export type HatId = (typeof HATS)[number][0];
export type ShirtId = (typeof SHIRTS)[number][0];
export type PantsId = (typeof PANTS)[number][0];
export type HairId = (typeof HAIRS)[number][0];

export type Look = {
  hair: HairId;
  hairColor: string;
  anime: boolean;
  hat: HatId;
  hatColor: string;
  shirt: ShirtId;
  shirtColor: string;
  pants: PantsId;
  pantsColor: string;
  socks: boolean;
  socksColor: string;
  clip: ClipId;
  clipColor: string;
  streak: boolean;
  streakColor: string;
  ahoge: boolean;
  thighHigh: boolean;
  garter: boolean;
};
export const DEFAULT_LOOK: Look = {
  hair: "none",
  hairColor: "#3b2a20",
  anime: false,
  hat: "none",
  hatColor: "#e5566d",
  shirt: "none",
  shirtColor: "#4a90e2",
  pants: "none",
  pantsColor: "#3b4a7a",
  socks: false,
  socksColor: "#1b1b1f",
  clip: "none",
  clipColor: "#ffd24a",
  streak: false,
  streakColor: "#e5566d",
  ahoge: false,
  thighHigh: false,
  garter: false,
};

export const SKINS = ["#ffe3cf", "#f5c9a0", "#d9a273", "#a86f4a", "#7a4a2e"];
export const HAIR_COLORS = [
  "#1b1b1f",
  "#3b2a20",
  "#7b4a2a",
  "#e8c36a",
  "#ff7eb6",
  "#6b2fa0",
  "#4a90e2",
  "#dfe6ff",
  "#8b1e2d",
  "#2b1b4a",
  "#ffb7d5",
];
export const CLOTH_COLORS = [
  "#ffffff",
  "#1b1b1f",
  "#e5566d",
  "#f0a030",
  "#2fbf71",
  "#4a90e2",
  "#b8a9ff",
  "#3b4a7a",
  "#ff7eb6",
  "#2b1b4a",
  "#c1272d",
  "#f5e6c8",
];

export const CLIPS = [
  ["none", "None"],
  ["star", "Star"],
  ["heart", "Heart"],
  ["x", "X pin"],
  ["bunny", "Bunny"],
  ["pins", "Hairpins"],
  ["ribbons", "Twin ribbons"],
] as const;
export type ClipId = (typeof CLIPS)[number][0];

export type Character = {
  id: string;
  name: string;
  color: string;
  eyes: Partial<Eyes>;
  look: Partial<Look>;
};

// Same chibi body as Stick. Anime-style eyes are bigger, with a colored iris.
const SK = "#ffd9b8",
  BLK = "#2b2b33";
const A = { size: 1.15, pupil: 1.5, gap: 24 };
export const CHARACTERS: Character[] = [
  { id: "stick", name: "Stick", color: "#43474f", eyes: {}, look: {} },
  {
    id: "mika",
    name: "Mika",
    color: "#ffe3cf",
    eyes: { ...A, pupilColor: "#e0457b" },
    look: {
      hair: "twintails",
      hairColor: "#ff7eb6",
      anime: true,
      shirt: "tee",
      shirtColor: "#ffffff",
      pants: "skirt",
      pantsColor: "#e5566d",
    },
  },
  {
    id: "ren",
    name: "Ren",
    color: "#f5c9a0",
    eyes: { ...A, pupilColor: "#3b82f6" },
    look: {
      hair: "spiky",
      hairColor: "#2b3a67",
      anime: true,
      shirt: "hoodie",
      shirtColor: "#e5566d",
      pants: "jeans",
      pantsColor: "#3b4a7a",
    },
  },
  {
    id: "sora",
    name: "Sora",
    color: "#d9a273",
    eyes: { ...A, pupilColor: "#7c5cff" },
    look: {
      hair: "short",
      hairColor: "#c9d1e0",
      anime: true,
      shirt: "long",
      shirtColor: "#2fbf71",
      pants: "jeans",
      pantsColor: "#43474f",
    },
  },
  {
    id: "hana",
    name: "Hana",
    color: "#ffe3cf",
    eyes: { ...A, pupilColor: "#2fbf71" },
    look: {
      hair: "bob",
      hairColor: "#7b4a2a",
      anime: true,
      shirt: "tee",
      shirtColor: "#f0a030",
      pants: "shorts",
      pantsColor: "#4a90e2",
    },
  },
  {
    id: "yuki",
    name: "Yuki",
    color: "#f5c9a0",
    eyes: { ...A, pupilColor: "#38bdf8" },
    look: {
      hair: "long",
      hairColor: "#dfe6ff",
      anime: true,
      shirt: "hoodie",
      shirtColor: "#b8a9ff",
      pants: "skirt",
      pantsColor: "#43474f",
    },
  },
  {
    id: "nova",
    name: "Nova",
    color: "#7a4a2e",
    eyes: { ...A, pupilColor: "#f0a030" },
    look: {
      hair: "bun",
      hairColor: "#6b2fa0",
      anime: true,
      shirt: "stripe",
      shirtColor: "#f0a030",
      pants: "jeans",
      pantsColor: "#2b3a67",
    },
  },
  {
    id: "luna",
    name: "Luna",
    color: "#ffe3cf",
    eyes: { ...A, pupilColor: "#7c5cff" },
    look: {
      hair: "wavy",
      hairColor: "#2b1b4a",
      anime: true,
      hat: "witch",
      hatColor: "#2b1b4a",
      shirt: "dress",
      shirtColor: "#2b1b4a",
      socks: true,
      socksColor: "#6b2fa0",
    },
  },
  {
    id: "cherry",
    name: "Cherry",
    color: "#ffe3cf",
    eyes: { ...A, pupilColor: "#e0457b" },
    look: {
      hair: "twinbuns",
      hairColor: "#ff7eb6",
      anime: true,
      hat: "bow",
      hatColor: "#e5566d",
      shirt: "crop",
      shirtColor: "#ffffff",
      pants: "mini",
      pantsColor: "#e5566d",
      socks: true,
      socksColor: "#ffffff",
    },
  },
  {
    id: "sakura",
    name: "Sakura",
    color: "#ffe3cf",
    eyes: { ...A, pupilColor: "#8b5a2b" },
    look: {
      hair: "hime",
      hairColor: "#1b1b1f",
      anime: true,
      hat: "bow",
      hatColor: "#e5566d",
      shirt: "sailor",
      shirtColor: "#ffffff",
      pants: "skirt",
      pantsColor: "#2b3a67",
      socks: true,
      socksColor: "#ffffff",
    },
  },
  {
    id: "scarlett",
    name: "Scarlett",
    color: "#f5c9a0",
    eyes: { ...A, pupilColor: "#2fbf71" },
    look: {
      hair: "wavy",
      hairColor: "#8b1e2d",
      anime: true,
      hat: "flower",
      hatColor: "#ffffff",
      shirt: "dress",
      shirtColor: "#c1272d",
    },
  },
  {
    id: "mimi",
    name: "Mimi",
    color: "#ffe3cf",
    eyes: { ...A, pupilColor: "#38bdf8" },
    look: {
      hair: "pixie",
      hairColor: "#dfe6ff",
      anime: true,
      hat: "ears",
      hatColor: "#43474f",
      shirt: "crop",
      shirtColor: "#1b1b1f",
      pants: "mini",
      pantsColor: "#ff7eb6",
      socks: true,
      socksColor: "#1b1b1f",
    },
  },
  {
    id: "bella",
    name: "Bella",
    color: "#a86f4a",
    eyes: { ...A, pupilColor: "#f0a030" },
    look: {
      hair: "curly",
      hairColor: "#1b1b1f",
      anime: true,
      hat: "phones",
      hatColor: "#e5566d",
      shirt: "crop",
      shirtColor: "#f0a030",
      pants: "shorts",
      pantsColor: "#ffffff",
    },
  },
  {
    id: "ivy",
    name: "Ivy",
    color: "#d9a273",
    eyes: { ...A, pupilColor: "#2fbf71" },
    look: {
      hair: "braid",
      hairColor: "#7b4a2a",
      anime: true,
      shirt: "sweater",
      shirtColor: "#2fbf71",
      pants: "mini",
      pantsColor: "#f5e6c8",
      socks: true,
      socksColor: "#ffffff",
    },
  },
  {
    id: "pk-yuki",
    name: "Yuki ♡",
    color: SK,
    eyes: { ...A, pupilColor: "#3b9bff" },
    look: {
      hair: "long",
      hairColor: "#c9d1ff",
      anime: true,
      shirt: "hoodie",
      shirtColor: "#b8a9ff",
      pants: "mini",
      pantsColor: BLK,
    },
  },
  {
    id: "pk-luna",
    name: "Luna ♡",
    color: SK,
    eyes: { ...A, pupilColor: "#a855f7" },
    look: {
      hair: "hime",
      hairColor: "#1b1b1f",
      anime: true,
      hat: "ears",
      hatColor: "#1b1b1f",
      clip: "x",
      clipColor: "#ff7eb6",
      shirt: "halter",
      shirtColor: "#1b1b1f",
      pants: "mini",
      pantsColor: "#1b1b1f",
      garter: true,
    },
  },
  {
    id: "pk-momo",
    name: "Momo",
    color: SK,
    eyes: { ...A, pupilColor: "#e0457b" },
    look: {
      hair: "twintails",
      hairColor: "#ff9bc0",
      anime: true,
      hat: "bow",
      hatColor: "#ff7eb6",
      clip: "bunny",
      clipColor: "#ffffff",
      shirt: "offshoulder",
      shirtColor: "#ffffff",
      pants: "mini",
      pantsColor: "#ffb7d5",
      socks: true,
      socksColor: "#ffffff",
    },
  },
  {
    id: "pk-rei",
    name: "Rei",
    color: SK,
    eyes: { ...A, pupilColor: "#8b5cf6" },
    look: {
      hair: "long",
      hairColor: "#f6e3a1",
      anime: true,
      hat: "horns",
      hatColor: BLK,
      shirt: "offshoulder",
      shirtColor: BLK,
      pants: "mini",
      pantsColor: BLK,
      garter: true,
    },
  },
  {
    id: "pk-sora",
    name: "Sora ♡",
    color: SK,
    eyes: { ...A, pupilColor: "#38bdf8" },
    look: {
      hair: "bob",
      hairColor: "#9be3f0",
      anime: true,
      ahoge: true,
      clip: "star",
      clipColor: "#ffd24a",
      shirt: "sailor",
      shirtColor: "#bfe3ff",
      pants: "skirt",
      pantsColor: "#8fb4ff",
    },
  },
  {
    id: "pk-mei",
    name: "Mei",
    color: SK,
    eyes: { ...A, pupilColor: "#e5223a" },
    look: {
      hair: "long",
      hairColor: "#f4f1f1",
      anime: true,
      streak: true,
      streakColor: "#d42a3a",
      clip: "ribbons",
      clipColor: "#1b1b1f",
      shirt: "offshoulder",
      shirtColor: "#1b1b1f",
      pants: "mini",
      pantsColor: "#1b1b1f",
      garter: true,
    },
  },
  {
    id: "pk-nami",
    name: "Nami",
    color: SK,
    eyes: { ...A, pupilColor: "#7c5cff" },
    look: {
      hair: "wavy",
      hairColor: "#b9a7f5",
      anime: true,
      clip: "heart",
      clipColor: "#ff7eb6",
      shirt: "offshoulder",
      shirtColor: "#b8a9ff",
      pants: "mini",
      pantsColor: "#1b1b1f",
      socks: true,
      thighHigh: true,
      socksColor: BLK,
    },
  },
  {
    id: "pk-rina",
    name: "Rina",
    color: SK,
    eyes: { ...A, pupilColor: "#22b8cf" },
    look: {
      hair: "long",
      hairColor: "#1b1b1f",
      anime: true,
      streak: true,
      streakColor: "#37c5c5",
      clip: "pins",
      clipColor: "#e5e7eb",
      shirt: "offshoulder",
      shirtColor: "#ffffff",
      pants: "mini",
      pantsColor: "#1b1b1f",
    },
  },
];
