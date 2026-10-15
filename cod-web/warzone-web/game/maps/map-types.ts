import type { World } from '../world.js';

/** Lighting and atmosphere for a map. */
export interface MapAtmosphere {
  /** Sky / fog color. */
  sky: number;
  /** Fog start as a fraction of the view distance. */
  fogNear: number;
  /** Hemisphere light sky color. */
  hemiSky: number;
  /** Hemisphere light ground color. */
  hemiGround: number;
  hemiIntensity: number;
  sunColor: number;
  sunIntensity: number;
  /** Sun direction (scaled internally). */
  sunDir: [number, number, number];
}

/** A playable map: size, look, recommended lobby and a builder that fills the world. */
export interface MapDef {
  id: string;
  name: string;
  /** Short label shown on the map card, e.g. "LARGE". */
  size: 'SMALL' | 'MEDIUM' | 'LARGE' | 'HUGE';
  /** One-line pitch shown on the map card. */
  desc: string;
  /** Half the side length in studs (playable area is 2·half × 2·half). */
  half: number;
  /** Suggested bot count for a good pace on this map. */
  recommendedBots: number;
  atmosphere: MapAtmosphere;
  /** Fills the world with geometry and spawn points. */
  build: (w: World) => void;
}
