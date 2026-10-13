/** Small colour helpers shared by the hair and clothes drawing. All colours are #rrggbb. */
const parse = (c: string): [number, number, number] => {
  const m = /^#?([0-9a-f]{6})$/i.exec(c);
  const n = m ? parseInt(m[1], 16) : 0x808080;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const hex = (r: number, g: number, b: number) =>
  "#" +
  [r, g, b]
    .map((v) =>
      Math.round(Math.min(255, Math.max(0, v)))
        .toString(16)
        .padStart(2, "0"),
    )
    .join("");

/** Blend colour a towards colour b by k (0 = a, 1 = b). */
export const mix = (a: string, b: string, k: number) => {
  const [r1, g1, b1] = parse(a),
    [r2, g2, b2] = parse(b);
  return hex(r1 + (r2 - r1) * k, g1 + (g2 - g1) * k, b1 + (b2 - b1) * k);
};
/** Darker version of c (k = 0..1). */
export const shade = (c: string, k: number) => mix(c, "#000000", k);
/** Lighter version of c (k = 0..1). */
export const tint = (c: string, k: number) => mix(c, "#ffffff", k);
export const lum = (c: string) => {
  const [r, g, b] = parse(c);
  return 0.299 * r + 0.587 * g + 0.114 * b;
};

/** The tones a hair colour is painted with: base, a rim light, a shadow, strand lines and a shine. */
export type Tones = {
  base: string;
  top: string; // gradient top (lit)
  bot: string; // gradient bottom (in shade)
  deep: string; // cast shadows between locks
  line: string; // thin strand lines
  light: string; // glossy clumps and rim light
  shine: string; // the bright highlight arcs
};
export function hairTones(c: string): Tones {
  const dark = lum(c) < 70; // near-black hair needs lighter lines, otherwise the detail is invisible
  return {
    base: c,
    top: tint(c, dark ? 0.3 : 0.2),
    bot: shade(c, dark ? 0.12 : 0.24),
    deep: dark ? "#000000" : shade(c, 0.58),
    line: dark ? tint(c, 0.32) : shade(c, 0.45),
    light: tint(c, dark ? 0.5 : 0.42),
    shine: tint(c, 0.75),
  };
}
