/** Weapon camo applied to the gun body material. */
export interface CamoCfg {
  id: string;
  name: string;
  /** Unlock tier label shown in the menu. */
  tier: 'Base' | 'Rare' | 'Epic' | 'Legendary';
  /** Body color override (hex). `null` keeps the weapon's factory finish. */
  color: number | null;
  metalness: number;
  roughness: number;
  /** Faint glow for premium camos. */
  emissive?: number;
  /** CSS background used for the swatch in the menu. */
  swatch: string;
}

/** Operator skin: colors of the first-person sleeves and gloves. */
export interface OperatorCfg {
  id: string;
  name: string;
  faction: string;
  sleeve: number;
  glove: number;
  /** CSS accent for the operator portrait card. */
  accent: string;
}

/** Crosshair / reticle color. */
export interface ReticleCfg {
  id: string;
  name: string;
  color: string;
}

/** Calling card banner shown on the player card. */
export interface CallingCardCfg {
  id: string;
  name: string;
  background: string;
}

/** The player's chosen cosmetics. Purely visual — never affects gameplay. */
export interface Cosmetics {
  camo: string;
  operator: string;
  reticle: string;
  callingCard: string;
  callsign: string;
}

export const Camos: CamoCfg[] = [
  { id: 'factory', name: 'Factory', tier: 'Base', color: null, metalness: 0.15, roughness: 0.6, swatch: 'linear-gradient(135deg,#3a3a3e,#26262a)' },
  { id: 'woodland', name: 'Woodland', tier: 'Base', color: 0x4a5a34, metalness: 0.1, roughness: 0.8, swatch: 'radial-gradient(circle at 30% 30%,#5d6b3c 20%,transparent 21%),radial-gradient(circle at 70% 60%,#2f2a1e 18%,transparent 19%),#46542f' },
  { id: 'desert', name: 'Desert Tan', tier: 'Base', color: 0xb49a6a, metalness: 0.1, roughness: 0.8, swatch: 'linear-gradient(135deg,#c9b082,#9c8358)' },
  { id: 'arctic', name: 'Arctic', tier: 'Rare', color: 0xd8dde2, metalness: 0.1, roughness: 0.7, swatch: 'radial-gradient(circle at 40% 40%,#9aa6b0 15%,transparent 16%),linear-gradient(135deg,#eef2f5,#c3cbd2)' },
  { id: 'urban', name: 'Urban Digital', tier: 'Rare', color: 0x5d6168, metalness: 0.2, roughness: 0.6, swatch: 'repeating-linear-gradient(90deg,#4b4f55 0 6px,#6c7179 6px 12px,#3a3d42 12px 16px)' },
  { id: 'crimson', name: 'Crimson Ops', tier: 'Epic', color: 0x8a1c1c, metalness: 0.35, roughness: 0.45, swatch: 'linear-gradient(135deg,#b32626,#4d0d0d)' },
  { id: 'cobalt', name: 'Cobalt Strike', tier: 'Epic', color: 0x1f4c8f, metalness: 0.45, roughness: 0.4, swatch: 'linear-gradient(135deg,#3a7ad9,#122a52)' },
  { id: 'gold', name: 'Gold', tier: 'Legendary', color: 0xd4a83a, metalness: 0.9, roughness: 0.25, emissive: 0x2a1c00, swatch: 'linear-gradient(135deg,#ffe08a,#c08a1e 55%,#7a5410)' },
  { id: 'damascus', name: 'Damascus', tier: 'Legendary', color: 0x8f6a3a, metalness: 0.8, roughness: 0.3, emissive: 0x1a0d00, swatch: 'repeating-linear-gradient(60deg,#c9944a 0 4px,#6e3f16 4px 9px,#e0b46a 9px 11px)' },
  { id: 'obsidian', name: 'Obsidian', tier: 'Legendary', color: 0x141418, metalness: 0.95, roughness: 0.15, emissive: 0x1a0828, swatch: 'linear-gradient(135deg,#2a1a3a,#060608 60%,#3a1f5a)' },
];

export const Operators: OperatorCfg[] = [
  { id: 'ranger', name: 'Ranger', faction: 'Coalition', sleeve: 0x5a6648, glove: 0x2a2a2c, accent: '#9fb07a' },
  { id: 'ghost', name: 'Ghost', faction: 'Coalition', sleeve: 0x2e3236, glove: 0x18181a, accent: '#c9ced4' },
  { id: 'nomad', name: 'Nomad', faction: 'Allegiance', sleeve: 0x8c7552, glove: 0x4a3a28, accent: '#d6b27a' },
  { id: 'frost', name: 'Frost', faction: 'Coalition', sleeve: 0xc9d0d6, glove: 0x5a636c, accent: '#a8d4ff' },
  { id: 'viper', name: 'Viper', faction: 'Allegiance', sleeve: 0x2c3a2c, glove: 0x7a1e1e, accent: '#e05a4a' },
  { id: 'phantom', name: 'Phantom', faction: 'Shadow', sleeve: 0x1a1a22, glove: 0x3c1f5a, accent: '#b57aff' },
];

export const Reticles: ReticleCfg[] = [
  { id: 'white', name: 'White', color: '#ffffff' },
  { id: 'green', name: 'Green', color: '#6dff7a' },
  { id: 'cyan', name: 'Cyan', color: '#4ff0ff' },
  { id: 'yellow', name: 'Yellow', color: '#ffe14f' },
  { id: 'red', name: 'Red', color: '#ff4f4f' },
  { id: 'magenta', name: 'Magenta', color: '#ff5fe0' },
];

export const CallingCards: CallingCardCfg[] = [
  { id: 'verdansk', name: 'Verdansk Dusk', background: 'linear-gradient(100deg,#1b2a2c 0%,#c4632f 60%,#f2b45a 100%)' },
  { id: 'gulag', name: 'Gulag Winner', background: 'linear-gradient(100deg,#0d0d0d 0%,#3a3a3a 50%,#9fb07a 100%)' },
  { id: 'gascloud', name: 'Gas Circle', background: 'radial-gradient(circle at 80% 50%,#3affd6 0%,#0f4a52 35%,#071416 70%)' },
  { id: 'redline', name: 'Redline', background: 'repeating-linear-gradient(115deg,#1a0606 0 18px,#5c1010 18px 22px),#1a0606' },
  { id: 'stealth', name: 'Night Ops', background: 'linear-gradient(100deg,#05080d,#14243a 60%,#2e4a6e)' },
  { id: 'gold-rush', name: 'Gold Rush', background: 'linear-gradient(100deg,#2a1c05,#a87a1e 55%,#ffe08a)' },
];

export const DefaultCosmetics: Cosmetics = { camo: 'factory', operator: 'ranger', reticle: 'white', callingCard: 'verdansk', callsign: 'OPERATOR' };

/**
 * Looks up an item by id, falling back to the first entry when the id is unknown (e.g. stale saved data).
 * @param list catalog to search
 * @param id item id
 * @returns the matching item or the catalog default
 */
export function findCosmetic<T extends { id: string }>(list: T[], id: string): T {
  return list.find((x) => x.id === id) ?? list[0];
}
