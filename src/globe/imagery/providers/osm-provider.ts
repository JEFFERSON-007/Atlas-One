/**
 * OpenStreetMap imagery provider.
 * Free fallback when no Cesium Ion token is available.
 */

import { OpenStreetMapImageryProvider } from 'cesium';

/**
 * Creates an OpenStreetMap tile imagery provider.
 * No API key required — always available.
 *
 * @returns Configured OSM imagery provider
 */
export function createOsmProvider(): OpenStreetMapImageryProvider {
  return new OpenStreetMapImageryProvider({
    url: 'https://tile.openstreetmap.org/',
    maximumLevel: 19,
  });
}
