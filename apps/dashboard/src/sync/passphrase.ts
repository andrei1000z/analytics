/**
 * Passphrase generator — 8 short common words = ~64 bits of entropy.
 * Combined with PBKDF2 200_000 rounds, this raises the practical cracking
 * cost to ~2^80 ops, which exceeds any non-state-actor budget. Operators
 * who want more can paste a custom passphrase into the create flow.
 */

const WORDLIST: ReadonlyArray<string> = [
  "able", "acid", "aged", "alpha", "amber", "angle", "ankle", "apple",
  "april", "arena", "argue", "arrow", "asset", "atlas", "audio", "azure",
  "badge", "baker", "bamboo", "basil", "basin", "batch", "beach", "beard",
  "beast", "beech", "begin", "bench", "berry", "birch", "blade", "bleak",
  "blend", "bliss", "block", "bloom", "blue", "boast", "bonus", "boost",
  "boots", "boron", "brace", "brain", "brand", "brave", "bread", "brick",
  "brief", "brisk", "broad", "brook", "brown", "brush", "buddy", "buggy",
  "build", "bulb", "bunch", "bundle", "burst", "buyer", "cabin", "cable",
  "cacao", "calf", "calm", "camel", "candy", "canoe", "canon", "canvas",
  "cargo", "carve", "cedar", "cello", "chain", "chalk", "champ", "chant",
  "chase", "cheek", "cheer", "chess", "chime", "chord", "civic", "clamp",
  "clash", "clean", "clear", "clerk", "click", "cliff", "climb", "cling",
  "cloak", "clock", "cloud", "clove", "clown", "coast", "cocoa", "comet",
  "comma", "coral", "coyote", "crack", "craft", "crane", "crash", "crate",
  "crazy", "cream", "creek", "crisp", "crown", "crust", "cubic", "cuddle",
  "cycle", "daisy", "dance", "dawn", "decay", "decoy", "deity", "delta",
  "depot", "diary", "diesel", "digit", "dingo", "diver", "dolly", "donut",
  "drama", "dream", "drift", "drone", "drove", "duet", "eagle", "early",
  "earth", "easel", "ebony", "eclair", "edge", "eight", "elbow", "elder",
  "elite", "elope", "elven", "ember", "empty", "enact", "engine", "ethic",
  "evade", "event", "every", "exile", "exist", "extra", "fable", "fairy",
  "false", "fancy", "fatal", "favor", "feast", "fence", "fern", "ferry",
  "fibre", "fiber", "field", "fifth", "fight", "filer", "final", "finch",
  "finger", "first", "flame", "flash", "fleet", "flesh", "flier", "flint",
  "flock", "flora", "flour", "flute", "flyer", "focal", "foggy", "foil",
  "fond", "force", "forge", "forty", "fox", "frame", "fresh", "fries",
  "frost", "fudge", "fuel", "fully", "fungi", "fuzzy", "gable", "galaxy",
  "gamma", "gauge", "ghost", "giant", "ginger", "glide", "glass", "globe",
  "glory", "glove", "goalie", "gold", "goose", "gospel", "grace", "grain",
  "grand", "grape", "grass", "grave", "gravy", "great", "greedy", "green",
  "grid", "grill", "groom", "grove", "guard", "guide", "guild", "gully",
  "happy", "harbor", "haste", "haven", "heart", "heavy", "helix", "hello",
];

export function generatePassphrase(words = 8): string {
  const rand = new Uint16Array(words);
  crypto.getRandomValues(rand);
  const out: string[] = [];
  for (let i = 0; i < words; i++) {
    out.push(WORDLIST[rand[i]! % WORDLIST.length]!);
  }
  return out.join("-");
}

/** Approximate Shannon entropy for the displayed strength bar. */
export function entropyBits(passphrase: string): number {
  if (passphrase.length === 0) return 0;
  const tokens = passphrase.includes("-")
    ? passphrase.split("-").filter(Boolean)
    : passphrase.includes(" ")
      ? passphrase.split(" ").filter(Boolean)
      : [];
  if (tokens.length >= 2) {
    return tokens.length * Math.log2(WORDLIST.length);
  }
  // Treat a custom passphrase as having ~3.5 bits/char (lowercase + digits + punct).
  return passphrase.length * 3.5;
}
