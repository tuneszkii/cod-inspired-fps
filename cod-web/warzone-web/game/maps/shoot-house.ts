import { mulberry32 } from '../world.js';
import type { MapDef } from './map-types.js';
import { building, container, crates, perimeter } from './prefabs.js';

/**
 * The original arena: a compact urban crossroads with four two-story buildings, now with
 * climbable interiors and rooftops.
 */
export const ShootHouse: MapDef = {
  id: 'shoot-house',
  name: 'SHOOT HOUSE',
  size: 'SMALL',
  desc: 'The classic crossroads. Four buildings, one plaza, constant action.',
  half: 110,
  recommendedBots: 6,
  atmosphere: {
    sky: 0xa9b8c4, fogNear: 0.29, hemiSky: 0xd8e4ef, hemiGround: 0x6b5f4a, hemiIntensity: 1.1,
    sunColor: 0xfff0d6, sunIntensity: 2.6, sunDir: [80, 140, 50],
  },
  build: (w) => {
    const M = w.mats;
    const H = w.half;
    w.flat(0, 0, H * 2 + 400, H * 2 + 400, M.ground, 0);
    w.flat(0, 0, H * 2, 18, M.road);
    w.flat(0, 0, 18, H * 2, M.road, 0.025);
    perimeter(w, 14, M.concrete);

    building(w, -52, -50, 34, 26, { floors: 2, wallMat: M.brick, roofAccess: true });
    building(w, 55, -52, 28, 30, { floors: 2, wallMat: M.plaster, roofAccess: true });
    building(w, -55, 54, 30, 30, { floors: 2, wallMat: M.plaster, roofAccess: true });
    building(w, 52, 50, 34, 24, { floors: 2, wallMat: M.brick, roofAccess: true });

    // plaza
    w.box(0, 0, 0, 10, 3, 10, M.concrete);
    w.box(0, 3, 0, 4, 6, 4, M.concrete);
    for (const [x, z, ww, d] of [[-22, -14, 12, 1.5], [22, 14, 12, 1.5], [-14, 22, 1.5, 12], [14, -22, 1.5, 12]]) w.box(x, 0, z, ww, 3.4, d, M.sand);

    container(w, -85, -10, false, 0, 2);
    container(w, -85, 20, false, 1);
    container(w, 85, 10, false, 2, 2);
    container(w, 85, -22, false, 3);
    container(w, -20, -85, true, 1);
    container(w, 20, 85, true, 2, 2);
    container(w, 28, -88, true, 0);
    container(w, -26, 86, true, 3);

    for (let i = -4; i <= 4; i++) {
      if (i === 0) continue;
      w.box(i * 22, 0, 11, 7, 3, 1.4, M.concrete);
      w.box(-11, 0, i * 22 + 5, 1.4, 3, 7, M.concrete);
    }
    const rand = mulberry32(1337);
    for (let i = 0; i < 40; i++) {
      const x = (rand() * 2 - 1) * (H - 12);
      const z = (rand() * 2 - 1) * (H - 12);
      if (Math.abs(x) < 12 && Math.abs(z) < 12) continue;
      if (w.solids.some((s) => x + 4 > s.min.x && x - 4 < s.max.x && z + 4 > s.min.z && z - 4 < s.max.z)) continue;
      crates(w, x, z, rand() > 0.6);
    }
    for (let a = 0; a < 16; a++) {
      const ang = (a / 16) * Math.PI * 2;
      const r = 70 + (a % 2) * 20;
      w.addSpawn(Math.cos(ang) * r, Math.sin(ang) * r);
    }
  },
};
