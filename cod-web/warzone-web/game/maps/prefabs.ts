import type * as THREE from 'three';
import type { WallOpening, World } from '../world.js';

/** Options for {@link building}. */
export interface BuildingOpts {
  /** Number of floors (1+). */
  floors: number;
  /** Height of each floor. */
  floorH?: number;
  wallMat: THREE.Material;
  /** Material for floor slabs and roof. */
  slabMat?: THREE.Material;
  /** Window glass material (lit windows for night maps). */
  windowMat?: THREE.Material;
  /** Add a parapet and a stair tower so the roof is reachable. */
  roofAccess?: boolean;
  /** Which sides get a ground floor door. Defaults to all four. */
  doors?: ('n' | 's' | 'e' | 'w')[];
  /** Interior cover crates per floor. */
  cover?: boolean;
  /** Height the building stands on (e.g. a ship deck). */
  base?: number;
}

const DOOR_W = 6;
const DOOR_H = 8;
const WALL_T = 1;

/**
 * Multi-story building with doors, real window openings, floor slabs, an internal staircase per
 * floor and optional rooftop access. Spawns are added on each upper floor.
 * @param w world
 * @param x center x
 * @param z center z
 * @param width size along x (≥ 22 recommended)
 * @param depth size along z (≥ 20 recommended)
 * @param o options
 */
export function building(w: World, x: number, z: number, width: number, depth: number, o: BuildingOpts) {
  const fh = o.floorH ?? 10;
  const base = o.base ?? 0;
  const slab = o.slabMat ?? w.mats.concrete;
  // the stairwell hugs the west wall, so by default there is no west door
  const doors = o.doors ?? ['n', 's', 'e'];
  const x0 = x - width / 2;
  const x1 = x + width / 2;
  const z0 = z - depth / 2;
  const z1 = z + depth / 2;
  // switchback stairwell along the west wall: lane A climbs toward +z on even floors,
  // lane B (next to it) climbs back toward -z on odd floors, so flights never stack.
  const steps = Math.ceil(fh / 1.25);
  const rise = fh / steps;
  const run = 1.6;
  const stairW = 4;
  const laneA = x0 + WALL_T / 2 + stairW / 2 + 0.2;
  const laneB = laneA + stairW;
  const stairZ0 = z0 + 4;
  const stairLen = steps * run;
  const holeX1 = laneB + stairW / 2 + 0.3;
  const holeZ0 = stairZ0 - 0.5;
  const holeZ1 = stairZ0 + stairLen + 0.5;

  for (let f = 0; f < o.floors; f++) {
    const y0 = base + f * fh;
    const winOpenings = (len: number, door: boolean): WallOpening[] => {
      const out: WallOpening[] = [];
      const n = Math.max(1, Math.floor(len / 9));
      for (let i = 0; i < n; i++) {
        const at = ((i + 0.5) / n) * len;
        if (door && f === 0 && Math.abs(at - len / 2) < DOOR_W) continue;
        out.push({ at, width: 3.2, bottom: 3.6, top: 6.6 });
      }
      if (door && f === 0) out.push({ at: len / 2, width: DOOR_W, bottom: 0, top: DOOR_H });
      return out;
    };
    w.wall(x0, z0, x1, z0, fh, WALL_T, o.wallMat, winOpenings(width, doors.includes('n')), y0);
    w.wall(x0, z1, x1, z1, fh, WALL_T, o.wallMat, winOpenings(width, doors.includes('s')), y0);
    w.wall(x0, z0, x0, z1, fh, WALL_T, o.wallMat, winOpenings(depth, doors.includes('w')), y0);
    w.wall(x1, z0, x1, z1, fh, WALL_T, o.wallMat, winOpenings(depth, doors.includes('e')), y0);

    // stairs from this floor to the next (or to the roof)
    const toRoof = f === o.floors - 1;
    const hasHole = !toRoof || !!o.roofAccess;
    if (hasHole) {
      if (f % 2 === 0) w.stairs(laneA, stairZ0, stairW, 'z+', y0, steps, rise, run, w.mats.darkConcrete);
      else w.stairs(laneB, stairZ0 + stairLen, stairW, 'z-', y0, steps, rise, run, w.mats.darkConcrete);
    }

    // ceiling slab with a hole above the stairwell
    const cy = y0 + fh;
    const sT = 0.6;
    if (hasHole) {
      // east of the shaft
      w.box((holeX1 + x1) / 2, cy - sT, z, x1 - holeX1, sT, depth, slab);
      // the shaft column: north and south of the hole
      w.box((x0 + holeX1) / 2, cy - sT, (holeZ1 + z1) / 2, holeX1 - x0, sT, z1 - holeZ1, slab);
      w.box((x0 + holeX1) / 2, cy - sT, (z0 + holeZ0) / 2, holeX1 - x0, sT, holeZ0 - z0, slab);
    } else {
      w.box(x, cy - sT, z, width, sT, depth, slab);
    }

    if (o.cover !== false) {
      w.box(x + width * 0.22, y0, z + depth * 0.1, 4, 3.4, 2, w.mats.wood);
      if (width > 26) w.box(x + width * 0.05, y0, z - depth * 0.22, 2, 3.4, 5, w.mats.metal);
    }
    if (f > 0 || base > 0) w.addSpawn(x + width * 0.25, z - depth * 0.25, y0);
  }

  const top = base + o.floors * fh;
  // parapet
  if (o.roofAccess) {
    const ph = 2.6;
    w.wall(x0, z0, x1, z0, ph, 0.8, o.wallMat, [], top);
    w.wall(x0, z1, x1, z1, ph, 0.8, o.wallMat, [], top);
    w.wall(x0, z0, x0, z1, ph, 0.8, o.wallMat, [], top);
    w.wall(x1, z0, x1, z1, ph, 0.8, o.wallMat, [], top);
    // AC units for rooftop cover
    w.box(x + width * 0.2, top, z + depth * 0.2, 4, 2.6, 3, w.mats.metal);
    w.box(x - width * 0.05, top, z + depth * 0.28, 3, 2.2, 3, w.mats.metal);
    w.addSpawn(x + width * 0.25, z - depth * 0.2, top);
  } else {
    w.box(x, top, z, width + 1, 0.4, depth + 1, w.mats.roof, false);
  }
  // glass panes in the window frames (visual only)
  if (o.windowMat) {
    for (let f = 0; f < o.floors; f++) {
      const y = base + f * fh + 3.6;
      for (const [sx, sz, len, alongX] of [
        [x, z0 - 0.55, width, true],
        [x, z1 + 0.55, width, true],
        [x0 - 0.55, z, depth, false],
        [x1 + 0.55, z, depth, false],
      ] as const) {
        const n = Math.max(1, Math.floor(len / 9));
        for (let i = 0; i < n; i++) {
          const at = ((i + 0.5) / n) * len - len / 2;
          if (f === 0 && Math.abs(at) < DOOR_W) continue;
          if (alongX) w.box(sx + at, y, sz, 3.2, 3, 0.1, o.windowMat, false);
          else w.box(sx, y, sz + at, 0.1, 3, 3.2, o.windowMat, false);
        }
      }
    }
  }
}

/**
 * Shipping container (optionally stacked). Rotated containers run along x.
 * @param w world
 * @param x center x
 * @param z center z
 * @param alongX long side along x
 * @param color palette index
 * @param stack number of containers in the stack
 * @param base height the stack stands on
 */
export function container(w: World, x: number, z: number, alongX: boolean, color: number, stack = 1, base = 0) {
  const [cw, cd] = alongX ? [20, 8] : [8, 20];
  for (let i = 0; i < stack; i++) {
    const m = w.mats.container[(color + i) % w.mats.container.length];
    const y = base + i * 8.5;
    w.box(x, y, z, cw, 8.5, cd, m);
    // corrugation ribs (visual)
    for (let k = -4; k <= 4; k++) {
      if (alongX) w.box(x + k * 2.1, y + 0.4, z, 0.25, 7.7, cd + 0.15, m, false);
      else w.box(x, y + 0.4, z + k * 2.1, cw + 0.15, 7.7, 0.25, m, false);
    }
  }
}

/**
 * Whether an xz-square is free of solids (used while building maps to avoid overlapping props).
 * @param w world
 * @param x center x
 * @param z center z
 * @param r half-size of the square
 * @returns true when nothing is there
 */
export function isFree(w: World, x: number, z: number, r: number) {
  return !w.solids.some((s) => x + r > s.min.x && x - r < s.max.x && z + r > s.min.z && z - r < s.max.z);
}

/**
 * Open container with doors removed so players can run through it.
 * @param w world
 * @param x center x
 * @param z center z
 * @param alongX long side along x
 * @param color palette index
 */
export function openContainer(w: World, x: number, z: number, alongX: boolean, color: number) {
  const m = w.mats.container[color % w.mats.container.length];
  if (alongX) {
    w.box(x, 0, z - 3.75, 20, 8.5, 0.5, m);
    w.box(x, 0, z + 3.75, 20, 8.5, 0.5, m);
  } else {
    w.box(x - 3.75, 0, z, 0.5, 8.5, 20, m);
    w.box(x + 3.75, 0, z, 0.5, 8.5, 20, m);
  }
  w.box(x, 8, z, alongX ? 20 : 8, 0.5, alongX ? 8 : 20, m);
}

/**
 * Climbable watchtower: four legs, a ladder of steps and a fenced platform.
 * @param w world
 * @param x center x
 * @param z center z
 * @param h platform height
 */
export function watchtower(w: World, x: number, z: number, h = 14) {
  const s = 8;
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) w.box(x + (dx * s) / 2, 0, z + (dz * s) / 2, 0.8, h, 0.8, w.mats.wood);
  w.box(x, h, z, s + 1, 0.6, s + 1, w.mats.wood);
  w.wall(x - s / 2 - 0.5, z - s / 2 - 0.5, x + s / 2 + 0.5, z - s / 2 - 0.5, 3, 0.4, w.mats.wood, [], h + 0.6);
  w.wall(x - s / 2 - 0.5, z - s / 2 - 0.5, x - s / 2 - 0.5, z + s / 2 + 0.5, 3, 0.4, w.mats.wood, [], h + 0.6);
  w.wall(x + s / 2 + 0.5, z - s / 2 - 0.5, x + s / 2 + 0.5, z + s / 2 + 0.5, 3, 0.4, w.mats.wood, [], h + 0.6);
  w.box(x, h + 6.5, z, s + 2, 0.5, s + 2, w.mats.roof, false);
  // stairs up the south side, ending at the platform edge
  const steps = Math.ceil(h / 1.25);
  const rise = h / steps;
  const run = 1.4;
  w.stairs(x, z + s / 2 + 0.5 + steps * run, 3, 'z-', 0, steps, rise, run, w.mats.wood);
  w.addSpawn(x, z, h + 0.6);
}

/**
 * Low car-sized cover block with a cabin.
 * @param w world
 * @param x center x
 * @param z center z
 * @param alongX long side along x
 * @param color body color
 */
export function car(w: World, x: number, z: number, alongX: boolean, color: number) {
  const m = w.mat(color, 0.5, 0.4);
  const [cw, cd] = alongX ? [9, 4.2] : [4.2, 9];
  w.box(x, 0.4, z, cw, 2.4, cd, m);
  w.box(x, 2.8, z, alongX ? 5 : 3.8, 1.8, alongX ? 3.8 : 5, w.mats.glass);
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    w.cylinder(x + dx * (cw / 2 - 1.4) * (alongX ? 1 : 0.9), 0, z + dz * (cd / 2 - 1.4) * (alongX ? 0.9 : 1), 0.8, 0.9, w.mats.darkMetal, false);
  }
}

/**
 * Military truck: cab + covered cargo bed.
 * @param w world
 * @param x center x
 * @param z center z
 * @param alongX long side along x
 */
export function truck(w: World, x: number, z: number, alongX: boolean) {
  const olive = w.mat(0x4b5233, 0.85);
  const s = alongX ? 1 : 0;
  const L = (dx: number) => (alongX ? [x + dx, z] : [x, z + dx]);
  const [cx, cz] = L(-6);
  w.box(cx, 0.8, cz, s ? 5 : 5.4, 4.6, s ? 5.4 : 5, olive);
  const [bx, bz] = L(2.5);
  w.box(bx, 0.8, bz, s ? 11 : 5.6, 2, s ? 5.6 : 11, olive);
  w.box(bx, 2.8, bz, s ? 11 : 5.6, 4, s ? 5.6 : 11, w.mat(0x5d5a3f, 1));
}

/**
 * Line of sandbags.
 * @param w world
 * @param x1 start x
 * @param z1 start z
 * @param x2 end x (axis-aligned)
 * @param z2 end z
 * @param h height
 */
export function sandbags(w: World, x1: number, z1: number, x2: number, z2: number, h = 3.2) {
  w.wall(x1, z1, x2, z2, h, 2, w.mats.sandbag);
}

/**
 * Street lamp post with an emissive head.
 * @param w world
 * @param x x
 * @param z z
 */
export function streetLamp(w: World, x: number, z: number) {
  w.box(x, 0, z, 0.5, 12, 0.5, w.mats.darkMetal);
  w.box(x, 11.6, z, 1.6, 0.5, 1.6, w.mats.lamp, false);
}

/**
 * Simple tree: trunk + stacked leaf boxes. Only the trunk collides.
 * @param w world
 * @param x x
 * @param z z
 * @param s scale
 */
export function tree(w: World, x: number, z: number, s = 1) {
  w.box(x, 0, z, 1 * s, 7 * s, 1 * s, w.mats.wood);
  w.box(x, 5 * s, z, 6 * s, 4 * s, 6 * s, w.mats.leaves, false);
  w.box(x, 8.5 * s, z, 4 * s, 3 * s, 4 * s, w.mats.leaves, false);
}

/**
 * Pile of crates for scattered cover.
 * @param w world
 * @param x x
 * @param z z
 * @param big larger stack
 */
export function crates(w: World, x: number, z: number, big = false) {
  const s = big ? 5 : 3.2;
  w.box(x, 0, z, s, s, s, w.mats.wood);
  if (big) w.box(x + 0.3, s, z - 0.2, 3.2, 3.2, 3.2, w.mats.wood);
}

/**
 * Perimeter walls around the whole map.
 * @param w world
 * @param h wall height
 * @param mat material
 */
export function perimeter(w: World, h: number, mat: THREE.Material) {
  const H = w.half;
  w.box(0, 0, -H, H * 2, h, 2, mat);
  w.box(0, 0, H, H * 2, h, 2, mat);
  w.box(-H, 0, 0, 2, h, H * 2, mat);
  w.box(H, 0, 0, 2, h, H * 2, mat);
}
