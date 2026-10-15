/** Killstreak reward identifiers. */
export type KillstreakId = 'UAV' | 'Airstrike' | 'CarePackage' | 'Mortar';

/** Static definition of a killstreak reward. */
export interface KillstreakCfg {
  id: KillstreakId;
  name: string;
  /** Consecutive kills (without dying) needed to earn it. */
  streak: number;
  desc: string;
  /** Accent color used by the HUD card (CSS). */
  color: string;
}

/** Rewards earned at exact streak counts. Kills made *by* a reward never count toward the streak. */
export const Killstreaks: Record<KillstreakId, KillstreakCfg> = {
  UAV: { id: 'UAV', name: 'UAV', streak: 3, desc: 'Radar shows every hostile for 20 seconds.', color: '#4fd8ff' },
  Airstrike: { id: 'Airstrike', name: 'Precision Airstrike', streak: 5, desc: 'A jet carpet-bombs the spot you are aiming at.', color: '#ff7a3d' },
  CarePackage: { id: 'CarePackage', name: 'Care Package', streak: 7, desc: 'Drops plates, ammo and a random primary in front of you.', color: '#f5b92e' },
  Mortar: { id: 'Mortar', name: 'Mortar Barrage', streak: 10, desc: 'Shells rain down around every hostile on the map.', color: '#ff4f6a' },
};

/** Rewards ordered by streak requirement. */
export const KillstreakOrder: KillstreakCfg[] = Object.values(Killstreaks).sort((a, b) => a.streak - b.streak);

/** Most rewards you can hold at once; extra ones are lost. */
export const MaxHeldStreaks = 3;

/** Weapon names used in the kill feed for streak kills. */
export const KillstreakWeapons = new Set<string>(['Airstrike', 'Mortar']);

/** UAV duration in seconds. */
export const UavDuration = 20;

/**
 * Reward earned at exactly this streak count, if any.
 * @param streak current kill streak
 * @returns the reward or null
 */
export function killstreakAt(streak: number): KillstreakCfg | null {
  return KillstreakOrder.find((k) => k.streak === streak) ?? null;
}

/**
 * Next reward still to be earned.
 * @param streak current kill streak
 * @returns the reward and how many kills remain, or null once every reward has been passed
 */
export function nextKillstreak(streak: number): { cfg: KillstreakCfg; remaining: number } | null {
  const cfg = KillstreakOrder.find((k) => k.streak > streak);
  return cfg ? { cfg, remaining: cfg.streak - streak } : null;
}
