/**
 * EarthquakeAdapter — USGS Earthquake API stub.
 * Future-ready module with types defined but no implementation.
 * Designed for the USGS Earthquake Hazards API.
 */

/** Earthquake event data from USGS. */
export interface EarthquakeEvent {
  id: string;
  magnitude: number;
  depth: number;
  latitude: number;
  longitude: number;
  place: string;
  time: Date;
  url: string;
  tsunami: boolean;
  type: string;
}

/** Query parameters for earthquake search. */
export interface EarthquakeQuery {
  startTime: Date;
  endTime: Date;
  minMagnitude?: number;
  maxMagnitude?: number;
  limit?: number;
}

/**
 * Fetches earthquake data from the USGS API.
 *
 * @stub This is a placeholder for future implementation.
 * @see https://earthquake.usgs.gov/fdsnws/event/1/
 */
export async function fetchEarthquakes(
  _query: EarthquakeQuery,
): Promise<EarthquakeEvent[]> {
  // Future implementation will call:
  // https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&...
  return [];
}
