/**
 * Game configuration ported from the Roblox `Config.luau` module.
 * Units are Roblox "studs" (1 unit = 1 stud) so the original tuning numbers carry over unchanged.
 */
import { DefaultGraphics, type GraphicsSettings } from './graphics.js';

/** [distance, damage] — damage applies from that distance onward. */
export type DamageStep = [number, number];

/** Spread values in degrees (port of `sp(...)`). */
export interface SpreadCfg {
  hip: number;
  ads: number;
  move: number;
  air: number;
  perShot: number;
  maxBloom: number;
  recover: number;
}

/** Recoil pattern: x = pitch up (deg), y = yaw (deg). */
export interface RecoilCfg {
  pattern: { x: number; y: number }[];
  reset: number;
  adsMult: number;
  jitter: number;
}

/** Projectile description for launchers. */
export interface ProjectileCfg {
  speed: number;
  gravity: number;
  radius: number;
  damage: [number, number];
  kind: 'Rocket' | 'Grenade';
}

export type WeaponClass = 'Pistol' | 'Revolver' | 'AR' | 'SMG' | 'Shotgun' | 'LMG' | 'Marksman' | 'Sniper' | 'Launcher' | 'Melee';

/** Fully resolved weapon config (class defaults merged in). */
export interface WeaponCfg {
  name: string;
  cls: WeaponClass;
  model: string;
  color: number;
  rpm: number;
  damage: DamageStep[];
  mag: number;
  reserve: number;
  reloadTime: number;
  reloadEmptyTime: number;
  fireMode: 'Semi' | 'Auto';
  pellets: number;
  range: number;
  headMult: number;
  equipTime: number;
  reloadStyle: 'Mag' | 'Shell' | 'Cylinder' | 'Rocket';
  adsTime: number;
  adsFov: number;
  sprintOutTime: number;
  moveMult: number;
  adsMoveMult: number;
  kick: number;
  spread: SpreadCfg;
  recoil: RecoilCfg;
  cycle?: { time: number; dropAds: boolean };
  scope?: boolean;
  projectile?: ProjectileCfg;
  shellStart?: number;
  shellTime?: number;
  shellEnd?: number;
}

const deg = (d: number) => (d * Math.PI) / 180;
export { deg };

export const CameraCfg = { hipFov: 80, sprintFov: 3, tacFov: 4, sensitivity: 0.0022, recoilDelay: 0.12, recoilRecover: 4, scopeSway: 0.35 };

export const MovementCfg = {
  walkSpeed: 12, crouchSpeed: 6.5, sprintSpeed: 18, tacSpeed: 21.5,
  tacTime: 4, tacDoubleTap: 0.3,
  accel: 90, decel: 120,
  jumpHeight: 5.5, gravity: 196.2,
  slideMinSpeed: 15, slideSpeed: 26, slideBoost: 1.2, slideMax: 34,
  slideFriction: 19, slideSteer: 0.8, slideEndSpeed: 9, slideCooldown: 0.45,
  eye: { stand: 4.6, crouch: 3.1, slide: 2.4 },
  height: { stand: 5, crouch: 3.4, slide: 2.8 },
  radius: 1,
  stepHeight: 1.6,
};

export const HealthCfg = { max: 150, regenDelay: 5, regenRate: 35 };
export const ArmorCfg = { plateArmor: 50, maxEquipped: 3, maxCarried: 5, startCarried: 2, startArmor: 150, applyTime: 2.4 };
export const QuickMeleeCfg = { damage: 60, back: 300, range: 7, time: 0.55, hitAt: 0.35, cooldown: 0.8 };

/** One melee attack: used by the quick melee key and by both knife attacks. */
export interface MeleeStrikeCfg {
  /** Damage from the front. */
  damage: number;
  /** Damage when hitting from behind. */
  back: number;
  /** Reach in studs. */
  range: number;
  /** Swing duration (seconds); also locks other actions. */
  time: number;
  /** Seconds into the swing when the hit lands. */
  hitAt: number;
  /** Minimum seconds between swings. */
  cooldown: number;
  /** Pull the player toward an enemy in front of them. */
  lunge: boolean;
  /** Name shown in the kill feed. */
  label: string;
}

/** The V-key quick melee expressed as a strike. */
export const QuickMeleeStrike: MeleeStrikeCfg = { ...QuickMeleeCfg, lunge: true, label: 'Melee' };

/** Equipped knife: LMB is a fast slash, RMB is a slower lunging stab that hits much harder. */
export const KnifeCfg: { slash: MeleeStrikeCfg; stab: MeleeStrikeCfg } = {
  slash: { damage: 70, back: 300, range: 6.5, time: 0.4, hitAt: 0.14, cooldown: 0.35, lunge: false, label: 'Knife' },
  stab: { damage: 150, back: 300, range: 7.5, time: 0.75, hitAt: 0.32, cooldown: 0.9, lunge: true, label: 'Knife' },
};

export const FragCfg = { count: 2, fuse: 3.5, speed: 70, radius: 16, damage: [170, 20] as [number, number] };
export const FlashCfg = { count: 2, fuse: 1.6, speed: 66, radius: 50, duration: 4.5 };

/** XP tags from `Config.Scoring`. */
export const ScoreTags: Record<string, { xp: number; label: string; medal?: boolean }> = {
  Kill: { xp: 100, label: 'KILL' },
  Headshot: { xp: 50, label: 'HEADSHOT' },
  DoubleKill: { xp: 75, label: 'DOUBLE KILL', medal: true },
  TripleKill: { xp: 150, label: 'TRIPLE KILL', medal: true },
  QuadKill: { xp: 250, label: 'QUAD KILL', medal: true },
  PentaKill: { xp: 400, label: 'PENTA KILL', medal: true },
  Collateral: { xp: 100, label: 'COLLATERAL', medal: true },
  ArmorBreak: { xp: 15, label: 'ARMOR BREAK' },
  Longshot: { xp: 50, label: 'LONGSHOT', medal: true },
  PointBlank: { xp: 25, label: 'POINT BLANK' },
  Backstab: { xp: 75, label: 'BACKSTAB', medal: true },
  Revenge: { xp: 50, label: 'REVENGE', medal: true },
  FirstBlood: { xp: 100, label: 'FIRST BLOOD', medal: true },
  Streak3: { xp: 100, label: '3 KILL STREAK', medal: true },
  Streak5: { xp: 200, label: '5 KILL STREAK', medal: true },
  Streak10: { xp: 500, label: '10 KILL STREAK', medal: true },
};
export const ScoringCfg = { multiWindow: 4, longshot: 150, pointBlank: 6 };

function pattern(up: number, side: number, n: number, phase = 0) {
  const t: { x: number; y: number }[] = [];
  for (let i = 1; i <= n; i++) t.push({ x: up * Math.max(0.55, 1 - i * 0.03), y: side * Math.sin(i * 1.25 + phase) });
  return t;
}
function rc(up: number, side: number, reset = 0.25, adsMult = 0.7, jitter = 0.15, n = 14): RecoilCfg {
  return { pattern: pattern(up, side, n), reset, adsMult, jitter };
}
function sp(hip: number, ads: number, move: number, air: number, perShot: number, maxBloom: number, recover: number): SpreadCfg {
  return { hip, ads, move, air, perShot, maxBloom, recover };
}

type Partial2 = Partial<WeaponCfg> & { cls: WeaponClass };

const Classes: Record<WeaponClass, Omit<Partial<WeaponCfg>, 'cls'>> = {
  Melee: { model: 'Knife', fireMode: 'Semi', pellets: 1, range: 7, headMult: 1, equipTime: 0.25, reloadStyle: 'Mag', adsTime: 0.1, adsFov: 80, sprintOutTime: 0, moveMult: 1.1, adsMoveMult: 1.1, kick: 0, spread: sp(0, 0, 0, 0, 0, 0, 1), recoil: rc(0, 0, 0.1, 1, 0, 1) },
  Pistol: { model: 'Pistol', fireMode: 'Semi', pellets: 1, range: 1200, headMult: 1.4, equipTime: 0.3, reloadStyle: 'Mag', adsTime: 0.14, adsFov: 68, sprintOutTime: 0.08, moveMult: 1.04, adsMoveMult: 0.85, kick: 0.8, spread: sp(2.2, 0.15, 1.4, 2.5, 0.4, 1.4, 4), recoil: rc(1.1, 0.2, 0.3, 0.8, 0.2, 8) },
  Revolver: { model: 'Revolver', fireMode: 'Semi', pellets: 1, range: 1500, headMult: 1.6, equipTime: 0.4, reloadStyle: 'Cylinder', adsTime: 0.16, adsFov: 66, sprintOutTime: 0.1, moveMult: 1.02, adsMoveMult: 0.8, kick: 2.4, spread: sp(2.4, 0.05, 1.4, 3, 0.8, 1.6, 3), recoil: rc(3.2, 0.3, 0.5, 0.8, 0.3, 6) },
  AR: { model: 'Rifle', fireMode: 'Auto', pellets: 1, range: 1500, headMult: 1.5, equipTime: 0.45, reloadStyle: 'Mag', adsTime: 0.2, adsFov: 62, sprintOutTime: 0.15, moveMult: 1, adsMoveMult: 0.6, kick: 1.0, spread: sp(1.9, 0.12, 1.3, 2.5, 0.12, 1.2, 3), recoil: rc(0.8, 0.3) },
  SMG: { model: 'SMG', fireMode: 'Auto', pellets: 1, range: 1100, headMult: 1.4, equipTime: 0.35, reloadStyle: 'Mag', adsTime: 0.16, adsFov: 66, sprintOutTime: 0.1, moveMult: 1.06, adsMoveMult: 0.72, kick: 0.7, spread: sp(1.6, 0.15, 0.9, 2.2, 0.1, 1.1, 3.5), recoil: rc(0.55, 0.25) },
  Shotgun: { model: 'Shotgun', fireMode: 'Semi', pellets: 8, range: 600, headMult: 1.2, equipTime: 0.5, reloadStyle: 'Shell', adsTime: 0.22, adsFov: 64, sprintOutTime: 0.15, moveMult: 0.97, adsMoveMult: 0.65, kick: 3.0, spread: sp(4.5, 2.6, 1.2, 2, 0.5, 1.5, 3), recoil: rc(3.5, 0.5, 0.6, 0.8, 0.4, 4) },
  LMG: { model: 'LMG', fireMode: 'Auto', pellets: 1, range: 1800, headMult: 1.4, equipTime: 0.7, reloadStyle: 'Mag', adsTime: 0.3, adsFov: 60, sprintOutTime: 0.22, moveMult: 0.9, adsMoveMult: 0.45, kick: 1.3, spread: sp(2.4, 0.2, 1.8, 3, 0.1, 1.4, 2.5), recoil: rc(0.95, 0.4, 0.3, 0.65, 0.2, 18) },
  Marksman: { model: 'Marksman', fireMode: 'Semi', pellets: 1, range: 2200, headMult: 1.6, equipTime: 0.55, reloadStyle: 'Mag', adsTime: 0.26, adsFov: 52, sprintOutTime: 0.2, moveMult: 0.93, adsMoveMult: 0.55, kick: 2.2, spread: sp(2.4, 0.05, 1.6, 3, 0.5, 1.5, 4), recoil: rc(2.4, 0.3, 0.4, 0.75, 0.3, 1) },
  Sniper: { model: 'Sniper', fireMode: 'Semi', pellets: 1, range: 4000, headMult: 2, equipTime: 0.7, reloadStyle: 'Mag', adsTime: 0.32, adsFov: 16, sprintOutTime: 0.25, moveMult: 0.88, adsMoveMult: 0.4, kick: 3.2, cycle: { time: 1.15, dropAds: true }, scope: true, spread: sp(5, 0.02, 3, 6, 0, 0, 5), recoil: rc(4.2, 0.5, 0.6, 0.8, 0.3, 1) },
  Launcher: { model: 'Launcher', fireMode: 'Semi', pellets: 1, range: 3000, headMult: 1, equipTime: 0.7, reloadStyle: 'Rocket', adsTime: 0.3, adsFov: 58, sprintOutTime: 0.25, moveMult: 0.88, adsMoveMult: 0.5, kick: 4.5, spread: sp(1.2, 0.05, 1.2, 2, 0, 0, 5), recoil: rc(4, 0.6, 0.8, 0.8, 0.2, 1) },
};

const rgb = (r: number, g: number, b: number) => (r << 16) | (g << 8) | b;
const d = (...s: DamageStep[]) => s;

const RAW: Record<string, Partial2> = {
  Knife: { cls: 'Melee', color: rgb(200, 204, 210), rpm: 90, damage: d([0, 70]), mag: 0, reserve: 0, reloadTime: 0, reloadEmptyTime: 0 },
  M1911: { cls: 'Pistol', color: rgb(46, 46, 50), rpm: 380, damage: d([0, 38], [20, 35], [50, 29], [90, 23]), mag: 8, reserve: 40, reloadTime: 1.5, reloadEmptyTime: 2.0 },
  M19: { cls: 'Pistol', color: rgb(40, 42, 46), rpm: 560, damage: d([0, 28], [25, 26], [55, 21], [100, 17]), mag: 15, reserve: 60, reloadTime: 1.4, reloadEmptyTime: 1.9 },
  G18: { cls: 'Pistol', color: rgb(34, 34, 36), rpm: 1000, fireMode: 'Auto', damage: d([0, 20], [20, 18], [45, 14], [80, 11]), mag: 20, reserve: 80, reloadTime: 1.5, reloadEmptyTime: 2.0, kick: 0.6, recoil: rc(0.7, 0.35, 0.2, 0.8, 0.3, 14) },
  Revolver357: { cls: 'Revolver', color: rgb(120, 120, 128), rpm: 170, damage: d([0, 80], [30, 72], [60, 62], [120, 52]), mag: 6, reserve: 24, reloadTime: 2.7, reloadEmptyTime: 2.7 },
  Revolver50: { cls: 'Revolver', color: rgb(60, 60, 64), rpm: 110, headMult: 1.5, damage: d([0, 115], [30, 100], [60, 85], [120, 70]), mag: 5, reserve: 15, reloadTime: 3.0, reloadEmptyTime: 3.0, kick: 3.4, recoil: rc(5.2, 0.4, 0.6, 0.8, 0.3, 5) },
  M4A1: {
    cls: 'AR', color: rgb(38, 38, 42), rpm: 785, damage: d([0, 28], [45, 26], [90, 23], [160, 19]), mag: 30, reserve: 150, reloadTime: 2.0, reloadEmptyTime: 2.8,
    recoil: {
      pattern: [[0.9, 0.05], [0.85, -0.1], [0.8, 0.15], [0.75, 0.25], [0.7, 0.2], [0.65, -0.1], [0.6, -0.3], [0.55, -0.35], [0.5, -0.2], [0.5, 0.1], [0.45, 0.3], [0.45, 0.35], [0.4, 0.1], [0.4, -0.25]].map(([x, y]) => ({ x, y })),
      reset: 0.25, adsMult: 0.7, jitter: 0.15,
    },
  },
  AK47: { cls: 'AR', color: rgb(86, 66, 46), rpm: 600, damage: d([0, 34], [40, 31], [90, 27], [160, 22]), mag: 30, reserve: 120, reloadTime: 2.3, reloadEmptyTime: 3.0, kick: 1.4, recoil: rc(1.15, 0.5, 0.3, 0.7, 0.25) },
  Grau: { cls: 'AR', color: rgb(56, 60, 52), rpm: 715, damage: d([0, 30], [50, 28], [100, 25], [170, 21]), mag: 30, reserve: 150, reloadTime: 2.1, reloadEmptyTime: 2.9, recoil: rc(0.85, 0.35) },
  MP5: { cls: 'SMG', color: rgb(36, 36, 40), rpm: 800, damage: d([0, 25], [25, 23], [60, 19], [100, 15]), mag: 30, reserve: 150, reloadTime: 1.8, reloadEmptyTime: 2.4 },
  P90: { cls: 'SMG', color: rgb(70, 74, 66), rpm: 900, damage: d([0, 22], [25, 20], [55, 17], [90, 13]), mag: 50, reserve: 200, reloadTime: 2.4, reloadEmptyTime: 3.0, recoil: rc(0.5, 0.3) },
  UZI: { cls: 'SMG', color: rgb(44, 44, 48), rpm: 950, damage: d([0, 21], [22, 19], [50, 16], [85, 12]), mag: 32, reserve: 160, reloadTime: 1.7, reloadEmptyTime: 2.2, kick: 0.9, recoil: rc(0.6, 0.45) },
  Model680: { cls: 'Shotgun', model: 'Pump', color: rgb(60, 52, 44), rpm: 80, pellets: 8, damage: d([0, 19], [12, 17], [25, 9], [45, 4]), mag: 6, reserve: 24, shellStart: 0.45, shellTime: 0.5, shellEnd: 0.45, reloadTime: 0, reloadEmptyTime: 0, cycle: { time: 0.55, dropAds: false } },
  Origin12: { cls: 'Shotgun', color: rgb(40, 40, 44), rpm: 240, pellets: 8, damage: d([0, 14], [12, 12], [25, 7], [45, 3]), mag: 8, reserve: 32, shellStart: 0.4, shellTime: 0.42, shellEnd: 0.4, reloadTime: 0, reloadEmptyTime: 0 },
  R725: { cls: 'Shotgun', model: 'Break', color: rgb(76, 62, 48), rpm: 240, pellets: 10, damage: d([0, 15], [14, 13], [28, 7], [50, 3]), mag: 2, reserve: 14, reloadStyle: 'Cylinder', reloadTime: 2.3, reloadEmptyTime: 2.3, kick: 3.6 },
  PKM: { cls: 'LMG', color: rgb(42, 44, 40), rpm: 650, damage: d([0, 31], [50, 29], [100, 25], [180, 21]), mag: 100, reserve: 200, reloadTime: 5.4, reloadEmptyTime: 6.2 },
  M91: { cls: 'LMG', color: rgb(64, 56, 46), rpm: 520, damage: d([0, 36], [55, 33], [110, 29], [190, 24]), mag: 75, reserve: 150, reloadTime: 4.8, reloadEmptyTime: 5.5, kick: 1.5, recoil: rc(1.1, 0.5, 0.3, 0.65, 0.25, 18) },
  MK14: { cls: 'Marksman', color: rgb(86, 74, 58), rpm: 450, damage: d([0, 52], [80, 48], [160, 40], [300, 34]), mag: 20, reserve: 80, reloadTime: 2.4, reloadEmptyTime: 3.2 },
  SKS: { cls: 'Marksman', color: rgb(96, 70, 48), rpm: 330, adsFov: 48, damage: d([0, 62], [90, 54], [180, 46], [300, 38]), mag: 10, reserve: 40, reloadTime: 2.2, reloadEmptyTime: 2.9, kick: 2.6 },
  Kar98k: { cls: 'Sniper', color: rgb(88, 66, 44), rpm: 52, adsFov: 18, damage: d([0, 140], [250, 130], [500, 115]), mag: 5, reserve: 20, reloadTime: 3.2, reloadEmptyTime: 3.4, cycle: { time: 1.1, dropAds: true } },
  HDR: { cls: 'Sniper', color: rgb(46, 50, 44), rpm: 48, adsFov: 13, damage: d([0, 165], [300, 155], [600, 135]), mag: 5, reserve: 15, reloadTime: 3.6, reloadEmptyTime: 3.8, cycle: { time: 1.3, dropAds: true }, kick: 3.8 },
  RPG7: { cls: 'Launcher', color: rgb(78, 82, 70), rpm: 40, damage: d([0, 0]), mag: 1, reserve: 3, reloadTime: 3.6, reloadEmptyTime: 3.6, projectile: { speed: 110, gravity: 8, radius: 24, damage: [250, 60], kind: 'Rocket' } },
  M79: { cls: 'Launcher', model: 'Grenade', color: rgb(80, 62, 44), rpm: 40, damage: d([0, 0]), mag: 1, reserve: 8, reloadTime: 2.4, reloadEmptyTime: 2.4, kick: 3, projectile: { speed: 95, gravity: 55, radius: 14, damage: [180, 30], kind: 'Grenade' } },
};

/** All weapons, keyed by name, with class defaults filled in. */
export const Weapons: Record<string, WeaponCfg> = Object.fromEntries(
  Object.entries(RAW).map(([name, w]) => [name, { ...Classes[w.cls], ...w, name } as WeaponCfg])
);

/** Ordered class list for the loadout menu. */
export const ClassOrder: WeaponClass[] = ['AR', 'SMG', 'Shotgun', 'LMG', 'Marksman', 'Sniper', 'Launcher', 'Pistol', 'Revolver'];

/**
 * True for primary-slot weapons.
 * @param name weapon name
 * @returns whether the weapon goes into the primary slot
 */
export function isPrimary(name: string): boolean {
  const w = Weapons[name];
  return !!w && w.cls !== 'Pistol' && w.cls !== 'Revolver' && w.cls !== 'Melee';
}

/**
 * Damage at a given distance using the stepped falloff table.
 * @param steps falloff table
 * @param dist distance in studs
 * @returns damage value
 */
export function damageAt(steps: DamageStep[], dist: number): number {
  let dmg = steps[0][1];
  for (const [d0, v] of steps) if (dist >= d0) dmg = v;
  return dmg;
}

/** Perk identifiers, MW2019-style (one per slot). */
export type PerkId = 'Scavenger' | 'EOD' | 'QuickFix' | 'Overkill' | 'Restock' | 'FastHands' | 'Amped' | 'BattleHardened' | 'Shrapnel';

/** Perk definition shown in the loadout menu. */
export interface PerkCfg {
  id: PerkId;
  name: string;
  /** 0 = blue, 1 = red, 2 = yellow. */
  slot: 0 | 1 | 2;
  desc: string;
}

/** All perks, grouped by slot. Effects are applied in `Game`. */
export const Perks: PerkCfg[] = [
  { id: 'Scavenger', name: 'Scavenger', slot: 0, desc: 'Kills refill a magazine of reserve ammo for your current gun.' },
  { id: 'EOD', name: 'E.O.D.', slot: 0, desc: 'Take 50% less damage from explosives.' },
  { id: 'QuickFix', name: 'Quick Fix', slot: 0, desc: 'Kills and armor plates start health regen immediately.' },
  { id: 'Overkill', name: 'Overkill', slot: 1, desc: 'Carry two primary weapons.' },
  { id: 'Restock', name: 'Restock', slot: 1, desc: 'Lethal and tactical equipment recharge every 25 seconds.' },
  { id: 'FastHands', name: 'Fast Hands', slot: 1, desc: 'Reload 25% faster.' },
  { id: 'Amped', name: 'Amped', slot: 2, desc: 'Swap weapons twice as fast.' },
  { id: 'BattleHardened', name: 'Battle Hardened', slot: 2, desc: 'Flashbangs affect you 70% less.' },
  { id: 'Shrapnel', name: 'Shrapnel', slot: 2, desc: 'Spawn with an extra frag grenade.' },
];

/** Perk slot names (blue / red / yellow). */
export const PerkSlotNames = ['PERK 1', 'PERK 2', 'PERK 3'] as const;

/** Player loadout chosen in the menu. */
export interface Loadout {
  primary: string;
  /** Secondary weapon — may be a primary when the Overkill perk is equipped. */
  secondary: string;
  /** One perk per slot. */
  perks: [PerkId, PerkId, PerkId];
}

/** Default loadout. */
export const DefaultLoadout: Loadout = { primary: 'M4A1', secondary: 'M1911', perks: ['Scavenger', 'Overkill', 'Amped'] };

/** User-adjustable settings. */
export interface GameSettings {
  sensitivity: number; // hip-fire look multiplier, 1 = default
  /** Look multiplier while aiming down sights, applied on top of the automatic zoom scaling (1 = default). */
  adsSensitivity: number;
  fov: number;
  volume: number; // 0..1
  botCount: number;
  graphics: GraphicsSettings;
  /** Id of the map to deploy on (see `game/maps`). */
  mapId: string;
}

export const DefaultSettings: GameSettings = { sensitivity: 1, adsSensitivity: 1, fov: 80, volume: 0.6, botCount: 6, graphics: DefaultGraphics, mapId: 'shoot-house' };
