/**
 * NASA GIBS imagery provider.
 * Provides access to NASA's Global Imagery Browse Services via WMTS.
 */

import { WebMapTileServiceImageryProvider } from 'cesium';
import { NASA_GIBS_CONFIG } from '../../../config/cesium.config';
import { createLogger } from '../../../utils/logger';

const log = createLogger('NasaGibsProvider');

/**
 * Creates a NASA GIBS Blue Marble imagery provider.
 * Free to use, no API key required.
 *
 * @param layerName - GIBS layer name (defaults to Blue Marble)
 * @param date - Optional date for time-varying layers (YYYY-MM-DD)
 * @returns Configured WMTS imagery provider
 */
export function createNasaGibsProvider(
  layerName = NASA_GIBS_CONFIG.layers.blueMarble,
  date?: string,
): WebMapTileServiceImageryProvider {
  const timeParam = date ? `&TIME=${date}` : '';

  const provider = new WebMapTileServiceImageryProvider({
    url: `${NASA_GIBS_CONFIG.baseUrl}/wmts.cgi?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layerName}&STYLE=default&TILEMATRIXSET=GoogleMapsCompatible_Level8&TILEMATRIX={TileMatrix}&TILEROW={TileRow}&TILECOL={TileCol}&FORMAT=image/jpeg${timeParam}`,
    layer: layerName,
    style: 'default',
    format: 'image/jpeg',
    tileMatrixSetID: 'GoogleMapsCompatible_Level8',
    maximumLevel: 8,
  });

  log.info(`NASA GIBS provider created: ${layerName}`);
  return provider;
}
