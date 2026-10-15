import { mulberry32 } from '../world.js';
import type { World } from '../world.js';
import type { MapDef } from './map-types.js';
import { building, crates, perimeter, sandbags, truck, watchtower } from './prefabs.js';

/** Terraced mesa: stacked rock plateaus with stepped ramps up to a sniper perch. */
function mesa(w: World, x: number, z: number, size: number, tiers: number) {
  const M = w.mats;
  const th = 6;
  for (let i = 0; i < tiers; i++) {
    const s = size - i * (size / (tiers + 1));
    w.box(x, i * th, z, s, th, s * 0.85, M.rock);
    // stepped path up the south face of each tier
    const steps = Math.ceil(th / 1.25);
    w.stairs(x - s * 0.25, z + (s * 0.85) / 2 + steps * 1.4, 5, 'z-', i * th, steps, th / steps, 1.4, M.rock);
  }
  w.addSpawn(x, z, tiers * th);
}

/** Walled compound with a gate on each side and two buildings inside. */
function compound(w: World, x: number, z: number, size: number) {
  const M = w.mats;
  const h = 7;
  const g = { at: size / 2, width: 10, bottom: 0, top: h };
  w.wall(x - size / 2, z - size / 2, x + size / 2, z - size / 2, h, 1.6, M.adobe, [g]);
  w.wall(x - size / 2, z + size / 2, x + size / 2, z + size / 2, h, 1.6, M.adobe, [g]);
  w.wall(x - size / 2, z - size / 2, x - size / 2, z + size / 2, h, 1.6, M.adobe, [g]);
  w.wall(x + size / 2, z - size / 2, x + size / 2, z + size / 2, h, 1.6, M.adobe, [g]);
  building(w, x - size * 0.2, z - size * 0.18, 26, 22, { floors: 2, floorH: 9, wallMat: M.adobe, slabMat: M.adobe, roofAccess: true });
  building(w, x + size * 0.22, z + size * 0.2, 22, 22, { floors: 1, floorH: 9, wallMat: M.adobe, slabMat: M.adobe, roofAccess: true });
  watchtower(w, x + size / 2 - 8, z - size / 2 + 8, 12);
  sandbags(w, x - 10, z + size * 0.05, x + 6, z + size * 0.05);
}

/**
 * Outpost: an enormous desert battlefield. Walled compounds, terraced mesas, bunkers, watchtowers
 * and long open roads — built for snipers and flanking.
 */
export const Outpost: MapDef = {
  id: 'outpost',
  name: 'OUTPOST',
  size: 'HUGE',
  desc: 'Open desert with compounds, mesas and watchtowers. Bring a long gun.',
  half: 300,
  recommendedBots: 12,
  atmosphere: {
    sky: 0xd9c9a8, fogNear: 0.4, hemiSky: 0xf2e6cc, hemiGround: 0x8a6e48, hemiIntensity: 1.2,
    sunColor: 0xfff2d8, sunIntensity: 3.0, sunDir: [40, 160, 30],
  },
  build: (w) => {
    const M = w.mats;
    const H = w.half;
    const rand = mulberry32(4242);
    w.flat(0, 0, H * 2 + 900, H * 2 + 900, M.sand, 0);
    perimeter(w, 12, M.adobe);

    // dirt roads crossing the map
    w.flat(0, 0, H * 2, 14, M.ground, 0.02);
    w.flat(0, 0, 14, H * 2, M.ground, 0.025);
    w.flat(-140, -100, 14, 220, M.ground, 0.03);
    w.flat(140, 100, 14, 220, M.ground, 0.03);

    compound(w, -170, -170, 110);
    compound(w, 170, 170, 110);
    compound(w, 160, -150, 90);

    mesa(w, -180, 150, 90, 3);
    mesa(w, 40, -210, 70, 3);
    mesa(w, 230, 0, 60, 2);
    mesa(w, -240, -10, 60, 2);

    // central bunker cluster
    for (const [bx, bz] of [[-30, -30], [30, 30], [-30, 30], [30, -30]]) {
      w.box(bx, 0, bz, 18, 5, 14, M.darkConcrete);
      w.wall(bx - 9, bz + 7, bx + 9, bz + 7, 2, 1, M.darkConcrete, [{ at: 9, width: 6, bottom: 0, top: 2 }], 5);
    }
    w.box(0, 0, 0, 10, 2, 10, M.darkConcrete);
    watchtower(w, 0, -60, 16);
    watchtower(w, 0, 60, 16);
    watchtower(w, -80, 0, 14);
    watchtower(w, 80, 0, 14);

    // trenches of sandbags and scattered cover
    for (let i = 0; i < 16; i++) {
      const x = (rand() * 2 - 1) * (H - 30);
      const z = (rand() * 2 - 1) * (H - 30);
      const len = 10 + rand() * 14;
      if (rand() > 0.5) sandbags(w, x - len / 2, z, x + len / 2, z);
      else sandbags(w, x, z - len / 2, x, z + len / 2);
    }
    for (let i = 0; i < 8; i++) truck(w, (rand() * 2 - 1) * 200, (i % 2 ? 1 : -1) * 10, true);
    for (let i = 0; i < 6; i++) truck(w, (i % 2 ? 1 : -1) * 10, (rand() * 2 - 1) * 200, false);
    for (let i = 0; i < 80; i++) {
      const x = (rand() * 2 - 1) * (H - 16);
      const z = (rand() * 2 - 1) * (H - 16);
      if (w.solids.some((s) => x + 5 > s.min.x && x - 5 < s.max.x && z + 5 > s.min.z && z - 5 < s.max.z)) continue;
      if (rand() > 0.5) w.box(x, 0, z, 4 + rand() * 6, 2 + rand() * 4, 4 + rand() * 6, M.rock);
      else crates(w, x, z, rand() > 0.5);
    }
    w.autoSpawns(rand, 30, 40, 20);
  },
};
