export const BASE_W = 72, BASE_H = 128; // pet size in px at 100% (SVG viewBox is 100 x 178)
export const COLORS = ['#43474f', '#e5566d', '#4a90e2', '#2fbf71', '#f0a030']; // body colors; first is the default charcoal
export const INK = '#111';

// Object behavior (names match the items in reactions.ts)
export const SCARY = ['a gun', 'a sword', 'a bomb']; // the pet runs away from these when you bring them close
export const APPROACH = ['a cake', 'a piano', 'a cat']; // the pet walks over to these when you leave them somewhere
export const WEAPONS = ['a gun', 'a sword']; // these always appear to the right of the pet, at head level
export const FLEE_LINES = ['Keep that away from me!', 'Nope nope nope!', 'I am out of here!', 'Not coming near that!'];

export const AI_CHANCE = 0.25; // about 1 in 4 object reactions is answered by the AI instead of a scripted line
