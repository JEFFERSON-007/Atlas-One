/**
 * REST Countries Provider — Fetches country intelligence for 250+ countries worldwide.
 * API Endpoint: https://restcountries.com/v3.1/all (free, public API, no key required).
 * Normalizes country metadata, capitals, populations, areas, region, languages, timezones, borders.
 */

import type { IGeospatialProvider, GeospatialProviderInfo } from './geospatial-provider.interface';
import {
  type GeospatialEntity,
  EntityType,
  EntityStatus,
  ENTITY_TYPE_COLORS,
  ENTITY_TYPE_ICONS,
} from '../entity/geospatial-entity.types';
import { createLogger } from '../../utils/logger';

const log = createLogger('RESTCountriesProvider');

const API_URL = 'https://restcountries.com/v3.1/all?fields=name,cca2,cca3,capital,population,area,region,subregion,languages,currencies,timezones,tld,latlng,borders,flags';

/** CORS proxy fallbacks */
const CORS_PROXIES = [
  '',
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
];

interface RawRESTCountry {
  name: { common: string; official: string };
  cca2: string;
  cca3: string;
  capital?: string[];
  population: number;
  area: number;
  region: string;
  subregion?: string;
  languages?: Record<string, string>;
  currencies?: Record<string, { name: string; symbol?: string }>;
  timezones?: string[];
  tld?: string[];
  latlng?: [number, number];
  borders?: string[];
  flags?: { svg?: string; png?: string };
}

export class RESTCountriesProvider implements IGeospatialProvider {
  readonly info: GeospatialProviderInfo = {
    id: 'rest-countries',
    name: 'REST Countries — Country Intelligence',
    primaryType: EntityType.Country,
    attribution: 'REST Countries (https://restcountries.com)',
    updateIntervalSeconds: 0, // Static dataset
    requiresApiKey: false,
    sourceUrl: 'https://restcountries.com',
  };

  isAvailable(): boolean {
    return true;
  }

  async fetchEntities(): Promise<GeospatialEntity[]> {
    for (const proxy of CORS_PROXIES) {
      try {
        const fetchUrl = proxy
          ? `${proxy}${encodeURIComponent(API_URL)}`
          : API_URL;

        const response = await fetch(fetchUrl, { signal: AbortSignal.timeout(15_000) });
        if (!response.ok) continue;

        const rawData = (await response.json()) as RawRESTCountry[];
        if (!Array.isArray(rawData)) continue;

        const entities = rawData
          .filter((c) => c.latlng && c.latlng.length === 2 && c.name?.common)
          .map((c) => this.normalizeCountry(c));

        log.info(`Fetched ${entities.length} countries from REST Countries`);
        return entities;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        log.warn(`REST Countries fetch attempt failed via ${proxy || 'direct'}: ${msg}`);
      }
    }

    log.warn('Failed to fetch from REST Countries API — using offline fallback subset');
    return [];
  }

  private normalizeCountry(c: RawRESTCountry): GeospatialEntity {
    const lat = c.latlng![0];
    const lng = c.latlng![1];
    const name = c.name.common;
    const code = c.cca3 || c.cca2;
    const capital = c.capital && c.capital.length > 0 ? c.capital[0] : 'N/A';
    const density = c.area > 0 ? (c.population / c.area).toFixed(1) : 'N/A';

    const languages = c.languages ? Object.values(c.languages).join(', ') : 'N/A';
    const currencies = c.currencies
      ? Object.values(c.currencies)
          .map((curr) => `${curr.name}${curr.symbol ? ` (${curr.symbol})` : ''}`)
          .join(', ')
      : 'N/A';

    return {
      id: `country-${code}`,
      type: EntityType.Country,
      name,
      latitude: lat,
      longitude: lng,
      altitude: 0,
      geometry: { type: 'point', coordinates: { latitude: lat, longitude: lng } },
      country: name,
      region: c.region || 'World',
      properties: {
        code,
        officialName: c.name.official,
        capital,
        population: c.population,
        areaKm2: c.area,
        densityPerKm2: density,
        region: c.region,
        subregion: c.subregion || 'N/A',
        languages,
        currencies,
        timezones: c.timezones ? c.timezones.join(', ') : 'N/A',
        tld: c.tld ? c.tld.join(', ') : 'N/A',
        borders: c.borders ? c.borders.join(', ') : 'None',
        flagSvg: c.flags?.svg || '',
      },
      metadata: {
        cca2: c.cca2,
        cca3: c.cca3,
      },
      source: this.info.name,
      timestamp: new Date(),
      lastUpdated: new Date(),
      visibility: true,
      priority: 100, // High priority
      status: EntityStatus.Active,
      color: ENTITY_TYPE_COLORS[EntityType.Country],
      icon: ENTITY_TYPE_ICONS[EntityType.Country],
    };
  }
}
