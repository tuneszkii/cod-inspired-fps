import { Downtown } from './downtown.js';
import { Harbor } from './harbor.js';
import type { MapDef } from './map-types.js';
import { Outpost } from './outpost.js';
import { ShootHouse } from './shoot-house.js';

export type { MapDef, MapAtmosphere } from './map-types.js';

/** All playable maps, smallest first. */
export const Maps: MapDef[] = [ShootHouse, Downtown, Harbor, Outpost];

/**
 * Finds a map by id, falling back to the first map.
 * @param id map id
 * @returns map definition
 */
export function findMap(id: string | undefined): MapDef {
  return Maps.find((m) => m.id === id) ?? Maps[0];
}
