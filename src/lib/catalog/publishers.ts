import type { Tier } from "./config";

function normalize(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[.'’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const AAA = [
  "electronic arts",
  "ea",
  "ubisoft",
  "ubisoft entertainment",
  "activision",
  "blizzard entertainment",
  "activision blizzard",
  "bethesda softworks",
  "bethesda game studios",
  "xbox game studios",
  "playstation publishing",
  "sony interactive entertainment",
  "nintendo",
  "square enix",
  "capcom",
  "sega",
  "bandai namco entertainment",
  "bandai namco",
  "warner bros games",
  "warner bros interactive entertainment",
  "wb games",
  "2k",
  "take-two interactive",
  "rockstar games",
  "cd projekt red",
  "cd projekt",
  "fromsoftware",
  "riot games",
  "epic games",
  "valve",
  "mojang studios",
  "mojang",
  "bungie",
  "respawn entertainment",
  "dice",
  "bioware",
  "naughty dog",
  "insomniac games",
  "santa monica studio",
  "guerrilla",
  "sucker punch productions",
  "konami",
  "koei tecmo",
  "atlus",
  "platinumgames",
  "hal laboratory",
  "game freak",
  "intelligent systems",
  "monolith soft",
  "netherrealm studios",
  "infinity ward",
  "treyarch",
  "sledgehammer games",
  "343 industries",
  "the coalition",
  "turn 10",
  "playground games",
  "rare",
].map(normalize);

const AA = [
  "focus entertainment",
  "thq nordic",
  "deep silver",
  "plaion",
  "paradox interactive",
  "coffee stain publishing",
  "coffee stain",
  "annapurna interactive",
  "team17",
  "private division",
  "gearbox publishing",
  "larian studios",
  "supergiant games",
  "hello games",
  "remedy entertainment",
  "housemarque",
  "kepler interactive",
  "thunderful publishing",
  "fireshine games",
  "maximum games",
  "505 games",
  "curve games",
  "merge games",
  "handy games",
  "dontnod entertainment",
  "asobo studio",
  "machinegames",
  "arkane studios",
  "id software",
  "obsidian entertainment",
  "inexile entertainment",
  "double fine productions",
].map(normalize);

const AAA_SET = new Set(AAA);
const AA_SET = new Set(AA);

export function publicCreditName(name: string): string {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (/^ubisoft\b/i.test(trimmed)) return "Ubisoft";
  return trimmed;
}

export function tierForPublishers(publishers: string[]): Tier {
  const names = publishers.map(normalize);
  if (names.some((name) => AAA_SET.has(name))) return "AAA";
  if (names.some((name) => AA_SET.has(name))) return "AA";
  return "INDIE";
}
