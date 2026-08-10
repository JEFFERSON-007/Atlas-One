/**
 * SpatialIndex — High-performance grid-based spatial hash index for 2D/3D spatial queries.
 * Divides the Earth's surface into latitude/longitude grid cells for O(1) cell lookups
 * and extremely fast radius / bounding-box proximity queries.
 */

import type { GeospatialEntity, BoundingBox } from '../entity/geospatial-entity.types';

/** Cell size in degrees (~111 km per degree at the equator). */
const CELL_SIZE_DEG = 2.0;

/** Converts (lat, lng) to a grid key string "latIndex,lngIndex". */
function getCellKey(lat: number, lng: number): string {
  const latIdx = Math.floor((lat + 90) / CELL_SIZE_DEG);
  const lngIdx = Math.floor((lng + 180) / CELL_SIZE_DEG);
  return `${latIdx},${lngIdx}`;
}

export class SpatialIndex {
  /** Grid hash map: CellKey → Map<EntityID, GeospatialEntity> */
  private readonly grid = new Map<string, Map<string, GeospatialEntity>>();

  /** Entity location index: EntityID → CellKey */
  private readonly entityCellMap = new Map<string, string>();

  /** Inserts an entity into the spatial index. */
  insert(entity: GeospatialEntity): void {
    const key = getCellKey(entity.latitude, entity.longitude);

    let cell = this.grid.get(key);
    if (!cell) {
      cell = new Map();
      this.grid.set(key, cell);
    }

    cell.set(entity.id, entity);
    this.entityCellMap.set(entity.id, key);
  }

  /** Updates an entity's position in the spatial index. */
  update(entity: GeospatialEntity): void {
    const oldKey = this.entityCellMap.get(entity.id);
    const newKey = getCellKey(entity.latitude, entity.longitude);

    if (oldKey && oldKey !== newKey) {
      const oldCell = this.grid.get(oldKey);
      if (oldCell) {
        oldCell.delete(entity.id);
        if (oldCell.size === 0) this.grid.delete(oldKey);
      }
    }

    let newCell = this.grid.get(newKey);
    if (!newCell) {
      newCell = new Map();
      this.grid.set(newKey, newCell);
    }

    newCell.set(entity.id, entity);
    this.entityCellMap.set(entity.id, newKey);
  }

  /** Removes an entity from the spatial index. */
  remove(entity: GeospatialEntity): void {
    const key = this.entityCellMap.get(entity.id) ?? getCellKey(entity.latitude, entity.longitude);
    const cell = this.grid.get(key);

    if (cell) {
      cell.delete(entity.id);
      if (cell.size === 0) this.grid.delete(key);
    }

    this.entityCellMap.delete(entity.id);
  }

  /**
   * Performs a spatial radius query returning all entities within radiusKm of (lat, lng).
   *
   * @param lat - Latitude (-90 to 90)
   * @param lng - Longitude (-180 to 180)
   * @param radiusKm - Search radius in kilometers
   */
  queryRadius(lat: number, lng: number, radiusKm: number): GeospatialEntity[] {
    const degreesLat = radiusKm / 111.0;
    const degreesLng = radiusKm / (111.0 * Math.max(0.1, Math.cos((lat * Math.PI) / 180)));

    const minLat = Math.max(-90, lat - degreesLat);
    const maxLat = Math.min(90, lat + degreesLat);
    const minLng = lng - degreesLng;
    const maxLng = lng + degreesLng;

    const candidates = this.queryBoundingBox({
      north: maxLat,
      south: minLat,
      east: maxLng,
      west: minLng,
    });

    // Haversine exact distance filtering
    return candidates.filter((item) => {
      const dist = calculateHaversineKm(lat, lng, item.latitude, item.longitude);
      return dist <= radiusKm;
    });
  }

  /**
   * Performs a bounding box spatial query returning all candidate entities within the bounds.
   */
  queryBoundingBox(bounds: BoundingBox): GeospatialEntity[] {
    const minLatIdx = Math.floor((bounds.south + 90) / CELL_SIZE_DEG);
    const maxLatIdx = Math.floor((bounds.north + 90) / CELL_SIZE_DEG);
    const minLngIdx = Math.floor((bounds.west + 180) / CELL_SIZE_DEG);
    const maxLngIdx = Math.floor((bounds.east + 180) / CELL_SIZE_DEG);

    const result: GeospatialEntity[] = [];

    for (let r = minLatIdx; r <= maxLatIdx; r++) {
      for (let c = minLngIdx; c <= maxLngIdx; c++) {
        const key = `${r},${c}`;
        const cell = this.grid.get(key);
        if (cell) {
          for (const item of cell.values()) {
            if (
              item.latitude >= bounds.south &&
              item.latitude <= bounds.north &&
              item.longitude >= bounds.west &&
              item.longitude <= bounds.east
            ) {
              result.push(item);
            }
          }
        }
      }
    }

    return result;
  }

  /** Clears the spatial index. */
  clear(): void {
    this.grid.clear();
    this.entityCellMap.clear();
  }
}

/** Calculates great-circle Haversine distance in kilometers. */
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
