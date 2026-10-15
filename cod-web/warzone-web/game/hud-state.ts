/** A kill feed line. */
export interface KillFeedEntry {
  id: number;
  killer: string;
  victim: string;
  weapon: string;
  headshot: boolean;
  killerIsPlayer: boolean;
  victimIsPlayer: boolean;
}

/** XP popup (small tags) or medal banner. */
export interface ScorePopup {
  id: number;
  label: string;
  xp: number;
  medal: boolean;
}

/** Scoreboard row. */
export interface ScoreRow {
  name: string;
  kills: number;
  deaths: number;
  isPlayer: boolean;
}

/** Radar blip in player-relative space (-1..1). */
export interface RadarDot {
  x: number;
  y: number;
}

/** A killstreak reward held by the player. */
export interface HeldStreak {
  id: string;
  name: string;
  color: string;
}

/** Snapshot of everything the React HUD renders, pushed from the game loop ~30x/s. */
export interface HudState {
  health: number;
  maxHealth: number;
  armor: number;
  plates: number;
  /** Weapon swap prompt when standing next to a dropped gun, e.g. "SWAP FOR AK47". */
  pickupPrompt: string | null;
  /** Short feedback after collecting loot, e.g. "+ AMMO". */
  lootToast: string | null;
  plateProgress: number; // 0 = not plating
  weaponName: string;
  weaponClass: string;
  ammo: number;
  reserve: number;
  reloading: boolean;
  slot: 0 | 1 | 2;
  /** Name of the knife in slot 3. */
  meleeName: string;
  primaryName: string;
  secondaryName: string;
  frags: number;
  flashes: number;
  cookProgress: number;
  spreadPx: number;
  ads: number;
  scoped: boolean;
  holdingBreath: boolean;
  hitmarkerAge: number; // seconds since last hit (big = none)
  hitmarkerKill: boolean;
  hitmarkerHead: boolean;
  damageDirs: { angle: number; age: number }[];
  killFeed: KillFeedEntry[];
  popups: ScorePopup[];
  medal: ScorePopup | null;
  kills: number;
  deaths: number;
  streak: number;
  /** Earned killstreak rewards, oldest first (T uses the first one). */
  streaks: HeldStreak[];
  /** Next reward to earn and how many kills away it is; null once all are passed. */
  nextStreak: { name: string; remaining: number; color: string } | null;
  /** Seconds of UAV left (0 = inactive). */
  uav: number;
  xp: number;
  level: number;
  levelProgress: number;
  dead: boolean;
  respawnIn: number;
  killedBy: string;
  flash: number; // 0..1 white-out
  hurt: number; // 0..1 red vignette
  stance: string;
  tacSprint: boolean;
  scoreboard: ScoreRow[];
  showScoreboard: boolean;
  radar: RadarDot[];
  fps: number;
}
