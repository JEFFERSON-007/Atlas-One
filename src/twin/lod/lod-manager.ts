/**
 * LODManager — Dynamic Level-of-Detail (LOD) Manager.
 * Monitors camera altitude and scene view distance to enforce level-of-detail rules
 * across entities, layers, dynamic objects, and 3D tilesets.
 */

import { type Viewer } from 'cesium';
import { LODLevel } from '../entity/geospatial-entity.types';
import { eventBus } from '../../hooks/use-event-bus';
import { createLogger } from '../../utils/logger';

const log = createLogger('LODManager');

export class LODManager {
  private viewer: Viewer | null = null;
  private currentLOD: LODLevel = LODLevel.Space;
  private removeCameraListener: (() => void) | null = null;

  init(viewer: Viewer): void {
    this.viewer = viewer;

    const onCameraMove = () => {
      this.evaluateLOD();
    };

    viewer.camera.changed.addEventListener(onCameraMove);
    this.removeCameraListener = () => {
      viewer.camera.changed.removeEventListener(onCameraMove);
    };

    this.evaluateLOD();
    log.info('LOD Manager initialized');
  }

  /** Evaluates current camera height and updates LODLevel. */
  evaluateLOD(): LODLevel {
    if (!this.viewer) return this.currentLOD;

    // Get height in meters above ellipsoid
    const heightMeters = this.viewer.camera.positionCartographic?.height ?? 10_000_000;
    const heightKm = heightMeters / 1000;

    let newLOD: LODLevel;

    if (heightKm > 5000) {
      newLOD = LODLevel.Space;
    } else if (heightKm > 500) {
      newLOD = LODLevel.Country;
    } else if (heightKm > 50) {
      newLOD = LODLevel.City;
    } else {
      newLOD = LODLevel.Street;
    }

    if (newLOD !== this.currentLOD) {
      const oldLOD = this.currentLOD;
      this.currentLOD = newLOD;
      log.info(`LOD changed: ${oldLOD} → ${newLOD} (height: ${heightKm.toFixed(0)} km)`);

      eventBus.emit('lod:changed', {
        level: newLOD,
        cameraHeightKm: heightKm,
      });
    }

    return this.currentLOD;
  }

  /** Returns current LOD level. */
  getCurrentLOD(): LODLevel {
    return this.currentLOD;
  }

  /** Disposes LOD Manager listeners. */
  dispose(): void {
    this.removeCameraListener?.();
    this.removeCameraListener = null;
    this.viewer = null;
    log.info('LOD Manager disposed');
  }
}
