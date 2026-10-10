import type { Eyes } from "./types";

export const HATS = [
  ["none", "None"],
  ["cap", "Cap"],
  ["beanie", "Beanie"],
  ["tophat", "Top hat"],
  ["crown", "Crown"],
  ["ears", "Cat ears"],
  ["party", "Party"],
] as const;
export const SHIRTS = [
  ["none", "None"],
  ["tee", "T-shirt"],
  ["stripe", "Striped"],
  ["long", "Long sleeve"],
  ["hoodie", "Hoodie"],
  ["tank", "Tank top"],
] as const;
export const PANTS = [
  ["none", "None"],
  ["shorts", "Shorts"],
  ["jeans", "Long pants"],
  ["skirt", "Skirt"],
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
];

export type Character = {
  id: string;
  name: string;
  color: string;
  eyes: Partial<Eyes>;
  look: Partial<Look>;
};

// Same chibi body as Stick. Anime-style eyes are bigger, with a colored iris.
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
];
