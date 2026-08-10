/**
 * Building3DRenderer — Renders and styles 3D buildings, handles feature highlights,
 * height inspection, and building metadata styling.
 */

import {
  Cesium3DTileStyle,
  type Viewer,
} from 'cesium';
import type { CesiumOSMBuildingsProvider } from '../providers/cesium-osm-buildings.provider';
import { createLogger } from '../../utils/logger';

const log = createLogger('Building3DRenderer');

export class Building3DRenderer {
  private provider: CesiumOSMBuildingsProvider | null = null;

  init(viewer: Viewer, provider: CesiumOSMBuildingsProvider): void {
    this.provider = provider;
    log.info('Building 3D Renderer initialized');
  }

  /** Applies height-based gradient coloring to 3D buildings. */
  applyHeightColoring(): void {
    if (!this.provider) return;

    try {
      const style = new Cesium3DTileStyle({
        color: {
          conditions: [
            ['${height} > 200', "color('#38bdf8', 0.9)"],
            ['${height} > 100', "color('#60a5fa', 0.85)"],
            ['${height} > 50', "color('#818cf8', 0.8)"],
            ['true', "color('#cbd5e1', 0.75)"],
          ],
        },
      });
      this.provider.setStyle(style);
      // Style applied
      log.info('Applied height-based coloring to 3D buildings');
    } catch {
      log.warn('Could not apply height coloring to tileset');
    }
  }

  /** Shows or hides 3D buildings layer. */
  setVisible(visible: boolean): void {
    this.provider?.setTilesetVisible(visible);
  }

  dispose(): void {
    this.provider = null;
    log.info('Building 3D Renderer disposed');
  }
}
