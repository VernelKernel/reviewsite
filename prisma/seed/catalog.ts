import type { CoverMotif } from "./covers";

export const reviewers = [
  {
    slug: "mira-chen",
    name: "Mira Chen",
    email: "mira.chen@example.com",
    bio: "Writes about whether a work does what it is attempting, and names the standard before she softens it.",
  },
  {
    slug: "owen-hale",
    name: "Owen Hale",
    email: "owen.hale@example.com",
    bio: "Most interested in how a work feels to move through, including when that feeling and the craft disagree.",
  },
  {
    slug: "priya-raman",
    name: "Priya Raman",
    email: "priya.raman@example.com",
    bio: "Says when a small team, an unfinished release, or an unusual structure changed the standard she used.",
  },
  {
    slug: "jonah-ellis",
    name: "Jonah Ellis",
    email: "jonah.ellis@example.com",
    bio: "Pays attention to the condition of the thing as shipped: performance, stability, and whether it can be played.",
  },
  {
    slug: "adele-march",
    name: "Adele March",
    email: "adele.march@example.com",
    bio: "Follows story, tone, and artistic intent, and marks when those are the subject of the evaluation.",
  },
  {
    slug: "luis-ortega",
    name: "Luis Ortega",
    email: "luis.ortega@example.com",
    bio: "Usually finishes a work before judging the ending, and says so when he has not.",
  },
  {
    slug: "naomi-okonkwo",
    name: "Naomi Okonkwo",
    email: "naomi.okonkwo@example.com",
    bio: "Will publish an early impression when the early hours are all she can honestly describe.",
  },
  {
    slug: "samir-shah",
    name: "Samir Shah",
    email: "samir.shah@example.com",
    bio: "Moves between execution and experience, and marks the mix when both shaped the judgment.",
  },
] as const;

export const platforms = [
  ["pc", "PC"],
  ["playstation-5", "PlayStation 5"],
  ["playstation-4", "PlayStation 4"],
  ["xbox-series", "Xbox Series X|S"],
  ["xbox-one", "Xbox One"],
  ["switch", "Nintendo Switch"],
] as const;

export const genres = [
  ["action", "Action"],
  ["roguelike", "Roguelike"],
  ["role-playing", "Role-playing"],
  ["adventure", "Adventure"],
  ["simulation", "Simulation"],
  ["shooter", "Shooter"],
  ["platformer", "Platformer"],
  ["fantasy", "Fantasy"],
  ["drama", "Drama"],
  ["strategy", "Strategy"],
  ["sports-and-racing", "Sports and racing"],
  ["horror", "Horror"],
  ["puzzle", "Puzzle"],
  ["fighting", "Fighting"],
] as const;

export const topics = [
  ["tutorial", "Tutorial"],
  ["controls", "Controls"],
  ["performance", "Performance"],
  ["difficulty", "Difficulty"],
  ["pacing", "Pacing"],
  ["writing", "Writing"],
  ["music", "Music"],
  ["technical-issues", "Technical issues"],
  ["combat", "Combat"],
  ["exploration", "Exploration"],
  ["story", "Story"],
  ["interface", "Interface"],
] as const;

export const dimensions: { slug: string; name: string; sortOrder: number; appliesTo: ("GAME" | "MOVIE")[] }[] = [
  { slug: "gameplay", name: "Gameplay", sortOrder: 1, appliesTo: ["GAME"] },
  { slug: "story", name: "Story", sortOrder: 2, appliesTo: ["GAME"] },
  { slug: "music", name: "Music", sortOrder: 3, appliesTo: ["GAME", "MOVIE"] },
  { slug: "art-direction", name: "Art direction", sortOrder: 4, appliesTo: ["GAME"] },
  { slug: "technical-quality", name: "Technical quality", sortOrder: 5, appliesTo: ["GAME"] },
  { slug: "performance", name: "Performance", sortOrder: 6, appliesTo: ["GAME"] },
  { slug: "controls", name: "Controls", sortOrder: 7, appliesTo: ["GAME"] },
  { slug: "atmosphere", name: "Atmosphere", sortOrder: 8, appliesTo: ["GAME", "MOVIE"] },
  { slug: "game-design", name: "Game Design", sortOrder: 9, appliesTo: ["GAME"] },
  { slug: "acting", name: "Acting", sortOrder: 1, appliesTo: ["MOVIE"] },
  { slug: "cinematography", name: "Cinematography", sortOrder: 2, appliesTo: ["MOVIE"] },
  { slug: "writing", name: "Writing", sortOrder: 3, appliesTo: ["MOVIE"] },
  { slug: "editing", name: "Editing", sortOrder: 4, appliesTo: ["MOVIE"] },
];

type CreatorRoleName = "DEVELOPER" | "PUBLISHER" | "DIRECTOR";

export type WorkSeed = {
  slug: string;
  title: string;
  workType: "GAME" | "MOVIE";
  synopsis: string;
  genres: string[];
  platforms: string[];
  creators: { slug: string; name: string; role: CreatorRoleName }[];
  releases: { platform?: string; date: string; status?: "RELEASED" | "EARLY_ACCESS"; label?: string }[];
  alternateTitles?: string[];
  art: { bg: string; ink: string; accent: string; mute: string; motif: CoverMotif };
};

export const works: WorkSeed[] = [
  {
    slug: "hades",
    title: "Hades",
    workType: "GAME",
    synopsis: "A roguelike in which Zagreus fights toward the surface, and the story advances in the conversations between runs.",
    genres: ["action", "roguelike"],
    platforms: ["pc", "switch"],
    creators: [
      { slug: "supergiant-games", name: "Supergiant Games", role: "DEVELOPER" },
      { slug: "supergiant-games", name: "Supergiant Games", role: "PUBLISHER" },
    ],
    releases: [
      { platform: "pc", date: "2020-09-17" },
      { platform: "switch", date: "2020-09-17" },
    ],
    art: { bg: "#2A1214", ink: "#F2E4C8", accent: "#C45A3C", mute: "#6E2430", motif: "ring" },
  },
  {
    slug: "hades-ii",
    title: "Hades II",
    workType: "GAME",
    synopsis: "Supergiant’s follow-up, following Melinoë through an underworld still at war. These evaluations are about the early-access version.",
    genres: ["action", "roguelike"],
    platforms: ["pc"],
    creators: [
      { slug: "supergiant-games", name: "Supergiant Games", role: "DEVELOPER" },
      { slug: "supergiant-games", name: "Supergiant Games", role: "PUBLISHER" },
    ],
    releases: [{ platform: "pc", date: "2024-05-06", status: "EARLY_ACCESS", label: "Early access" }],
    art: { bg: "#1C2430", ink: "#E7D7A8", accent: "#7E8CFF", mute: "#3A4660", motif: "orbit" },
  },
  {
    slug: "cyberpunk-2077",
    title: "Cyberpunk 2077",
    workType: "GAME",
    synopsis: "An open-city role-playing game in Night City, built around a mercenary job that becomes a crisis of identity.",
    genres: ["role-playing", "shooter"],
    platforms: ["pc", "playstation-4", "playstation-5", "xbox-one", "xbox-series"],
    creators: [
      { slug: "cd-projekt-red", name: "CD Projekt Red", role: "DEVELOPER" },
      { slug: "cd-projekt", name: "CD Projekt", role: "PUBLISHER" },
    ],
    releases: [
      { platform: "pc", date: "2020-12-10" },
      { platform: "playstation-4", date: "2020-12-10" },
      { platform: "xbox-one", date: "2020-12-10" },
      { platform: "playstation-5", date: "2022-02-15" },
      { platform: "xbox-series", date: "2022-02-15" },
    ],
    alternateTitles: ["CP2077"],
    art: { bg: "#141820", ink: "#F2E7C9", accent: "#E23B8A", mute: "#2A3344", motif: "grid" },
  },
  {
    slug: "baldurs-gate-3",
    title: "Baldur’s Gate 3",
    workType: "GAME",
    synopsis: "A party role-playing game in the Forgotten Realms, where conversation, systems, and consequence share the same campaign.",
    genres: ["role-playing", "adventure"],
    platforms: ["pc", "playstation-5", "xbox-series"],
    creators: [
      { slug: "larian-studios", name: "Larian Studios", role: "DEVELOPER" },
      { slug: "larian-studios", name: "Larian Studios", role: "PUBLISHER" },
    ],
    releases: [
      { platform: "pc", date: "2023-08-03" },
      { platform: "playstation-5", date: "2023-09-06" },
      { platform: "xbox-series", date: "2023-12-07" },
    ],
    alternateTitles: ["BG3"],
    art: { bg: "#1A241C", ink: "#E6D3A1", accent: "#C6A15A", mute: "#314233", motif: "arch" },
  },
  {
    slug: "death-stranding",
    title: "Death Stranding",
    workType: "GAME",
    synopsis: "A delivery game about crossing a broken America on foot, with a story that treats connection as both plot and verb.",
    genres: ["adventure", "action"],
    platforms: ["playstation-4", "pc", "playstation-5"],
    creators: [
      { slug: "kojima-productions", name: "Kojima Productions", role: "DEVELOPER" },
      { slug: "sony-interactive", name: "Sony Interactive Entertainment", role: "PUBLISHER" },
      { slug: "hideo-kojima", name: "Hideo Kojima", role: "DIRECTOR" },
    ],
    releases: [
      { platform: "playstation-4", date: "2019-11-08" },
      { platform: "pc", date: "2020-07-14" },
      { platform: "playstation-5", date: "2022-09-23" },
    ],
    art: { bg: "#D7D2C8", ink: "#1C1C1C", accent: "#C6A15A", mute: "#8E8A82", motif: "horizon" },
  },
  {
    slug: "stardew-valley",
    title: "Stardew Valley",
    workType: "GAME",
    synopsis: "A farming life simulation made largely by one developer, about leaving an office job for a neglected farm and a small town.",
    genres: ["simulation", "role-playing"],
    platforms: ["pc", "switch", "playstation-4"],
    creators: [
      { slug: "concernedape", name: "ConcernedApe", role: "DEVELOPER" },
      { slug: "concernedape", name: "ConcernedApe", role: "PUBLISHER" },
    ],
    releases: [
      { platform: "pc", date: "2016-02-26" },
      { platform: "switch", date: "2017-10-05" },
      { platform: "playstation-4", date: "2016-12-13" },
    ],
    art: { bg: "#E7E1C8", ink: "#2C3A28", accent: "#D08A2A", mute: "#7E9A62", motif: "field" },
  },
  {
    slug: "starfield",
    title: "Starfield",
    workType: "GAME",
    synopsis: "A space role-playing game about joining a constellation of explorers and surveying a very large number of planets.",
    genres: ["role-playing", "adventure"],
    platforms: ["pc", "xbox-series"],
    creators: [
      { slug: "bethesda-game-studios", name: "Bethesda Game Studios", role: "DEVELOPER" },
      { slug: "bethesda-softworks", name: "Bethesda Softworks", role: "PUBLISHER" },
    ],
    releases: [
      { platform: "pc", date: "2023-09-06" },
      { platform: "xbox-series", date: "2023-09-06" },
    ],
    art: { bg: "#10141C", ink: "#E6E8EE", accent: "#8AA4C8", mute: "#2A3344", motif: "planet" },
  },
  {
    slug: "elden-ring",
    title: "Elden Ring",
    workType: "GAME",
    synopsis: "An open-field action game in the Lands Between, where combat is demanding and the map is the main invitation.",
    genres: ["action", "role-playing"],
    platforms: ["pc", "playstation-4", "playstation-5", "xbox-one", "xbox-series"],
    creators: [
      { slug: "fromsoftware", name: "FromSoftware", role: "DEVELOPER" },
      { slug: "bandai-namco", name: "Bandai Namco Entertainment", role: "PUBLISHER" },
    ],
    releases: [
      { platform: "pc", date: "2022-02-25" },
      { platform: "playstation-5", date: "2022-02-25" },
      { platform: "playstation-4", date: "2022-02-25" },
      { platform: "xbox-series", date: "2022-02-25" },
      { platform: "xbox-one", date: "2022-02-25" },
    ],
    art: { bg: "#1C1A14", ink: "#E6D3A1", accent: "#8C6A2F", mute: "#3A3428", motif: "ring" },
  },
  {
    slug: "palworld",
    title: "Palworld",
    workType: "GAME",
    synopsis: "An open-world survival game about capturing creatures and putting them to work. These evaluations discuss the early-access release.",
    genres: ["adventure", "simulation"],
    platforms: ["pc", "xbox-series"],
    creators: [
      { slug: "pocketpair", name: "Pocketpair", role: "DEVELOPER" },
      { slug: "pocketpair", name: "Pocketpair", role: "PUBLISHER" },
    ],
    releases: [
      { platform: "pc", date: "2024-01-19", status: "EARLY_ACCESS", label: "Early access" },
      { platform: "xbox-series", date: "2024-01-19", status: "EARLY_ACCESS", label: "Early access" },
    ],
    art: { bg: "#D5E4F2", ink: "#1C2830", accent: "#3C8D6E", mute: "#8FB4D0", motif: "bars" },
  },
  {
    slug: "celeste",
    title: "Celeste",
    workType: "GAME",
    synopsis: "A precision platformer about climbing a mountain, with an assist mode and a story that treats the climb as something internal.",
    genres: ["platformer", "action"],
    platforms: ["pc", "switch", "playstation-4"],
    creators: [
      { slug: "maddy-makes-games", name: "Maddy Makes Games", role: "DEVELOPER" },
      { slug: "maddy-makes-games", name: "Maddy Makes Games", role: "PUBLISHER" },
    ],
    releases: [
      { platform: "pc", date: "2018-01-25" },
      { platform: "switch", date: "2018-01-25" },
      { platform: "playstation-4", date: "2018-01-25" },
    ],
    art: { bg: "#2A3148", ink: "#F4EDE4", accent: "#E07A9A", mute: "#6E7CA8", motif: "peak" },
  },
  {
    slug: "no-mans-sky",
    title: "No Man’s Sky",
    workType: "GAME",
    synopsis: "A space exploration game that launched thin and kept changing for years. Reviewers here are explicit about which version they played.",
    genres: ["adventure", "simulation"],
    platforms: ["pc", "playstation-4", "playstation-5", "xbox-series"],
    creators: [
      { slug: "hello-games", name: "Hello Games", role: "DEVELOPER" },
      { slug: "hello-games", name: "Hello Games", role: "PUBLISHER" },
    ],
    releases: [
      { platform: "playstation-4", date: "2016-08-09" },
      { platform: "pc", date: "2016-08-12" },
      { platform: "xbox-series", date: "2020-11-10" },
      { platform: "playstation-5", date: "2020-11-12" },
    ],
    alternateTitles: ["NMS"],
    art: { bg: "#241C30", ink: "#F0E6C8", accent: "#D08A3A", mute: "#5A4670", motif: "planet" },
  },
  {
    slug: "the-green-knight",
    title: "The Green Knight",
    workType: "MOVIE",
    synopsis: "David Lowery’s adaptation of the medieval poem, following Gawain through a landscape that is more omen than quest.",
    genres: ["fantasy", "drama"],
    platforms: [],
    creators: [
      { slug: "david-lowery", name: "David Lowery", role: "DIRECTOR" },
      { slug: "a24", name: "A24", role: "PUBLISHER" },
    ],
    releases: [{ date: "2021-07-30", label: "United States theatrical" }],
    art: { bg: "#E4E0D4", ink: "#1E241C", accent: "#2F6B45", mute: "#C8C2B0", motif: "arch" },
  },
];

export const relations = [{ from: "hades-ii", to: "hades", kind: "SEQUEL" as const }];
