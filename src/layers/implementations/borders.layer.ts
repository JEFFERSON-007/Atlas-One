/**
 * Country Borders Layer — Displays national boundaries using GeoJSON.
 */

import { type Viewer, GeoJsonDataSource, Color } from 'cesium';
import { type ILayer, type LayerMetadata, LayerCategory } from '../layer.interface';
import { createLogger } from '../../utils/logger';

const log = createLogger('BordersLayer');

export class BordersLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'country-borders',
    name: 'Country Borders',
    category: LayerCategory.Reference,
    icon: '🗺️',
    description: 'National boundary lines',
    defaultEnabled: false,
  };

  private viewer: Viewer | null = null;
  private dataSource: GeoJsonDataSource | null = null;
  private enabled = false;

  isEnabled(): boolean {
    return this.enabled;
  }

  async init(viewer: Viewer): Promise<void> {
    this.viewer = viewer;

    try {
      // Use Natural Earth GeoJSON hosted on GitHub
      this.dataSource = await GeoJsonDataSource.load(
        'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_boundary_lines_land.geojson',
        {
          stroke: Color.fromCssColorString('#64748b'),
          strokeWidth: 1,
          fill: Color.TRANSPARENT,
          markerSize: 0,
        },
      );
      this.dataSource.show = this.enabled;
      void viewer.dataSources.add(this.dataSource);
      log.info('Country borders loaded');
    } catch {
      log.warn('Failed to load country borders GeoJSON');
    }
  }

  enable(): void {
    this.enabled = true;
    if (this.dataSource) this.dataSource.show = true;
  }

  disable(): void {
    this.enabled = false;
    if (this.dataSource) this.dataSource.show = false;
  }

  toggle(): boolean {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.enabled;
  }

  dispose(): void {
    if (this.viewer && this.dataSource) {
      this.viewer.dataSources.remove(this.dataSource, true);
    }
    this.viewer = null;
    this.dataSource = null;
  }
}
