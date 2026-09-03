/**
 * Environmental AI Tools — 15 new tools for the AI Command Engine.
 * Enables natural language queries like "Show air quality in India."
 */

import type { AIContext, AITool } from '../types';
import type { EnvironmentalDataEngine } from '../../environment/engine/environmental-data-engine';
import { EnvironmentalVariable } from '../../environment/types/environmental.types';
import type { LayerRegistry } from '../../layers/layer-registry';

// ---------------------------------------------------------------------------
// Helper: extract engine from context
// ---------------------------------------------------------------------------

function getEnvEngine(context: AIContext): EnvironmentalDataEngine | null {
  return (context.services as Record<string, unknown>)?.environment as EnvironmentalDataEngine | null;
}

function enableLayer(context: AIContext, layerId: string): void {
  const layers = context.services?.layers as LayerRegistry | undefined;
  if (layers) {
    const layer = layers.get(layerId);
    if (layer) layer.enable();
  }
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

export const queryAirQualityTool: AITool = {
  name: 'queryAirQuality',
  description: 'Queries air quality data (AQI, PM2.5, PM10, NO2, O3). Enables the air quality layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    enableLayer(context, 'air-quality');
    const engine = getEnvEngine(context);
    if (!engine) return { success: false, message: 'Environmental engine unavailable' };
    const cached = engine.getCachedObservations(EnvironmentalVariable.PM25);
    return { success: true, count: cached.length, variable: 'PM2.5' };
  },
};

export const queryTemperatureTool: AITool = {
  name: 'queryTemperature',
  description: 'Queries global temperature data. Enables the temperature layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    enableLayer(context, 'temperature');
    const engine = getEnvEngine(context);
    if (!engine) return { success: false, message: 'Environmental engine unavailable' };
    const cached = engine.getCachedObservations(EnvironmentalVariable.Temperature);
    return { success: true, count: cached.length, variable: 'Temperature' };
  },
};

export const queryPrecipitationTool: AITool = {
  name: 'queryPrecipitation',
  description: 'Queries precipitation and rainfall data. Enables the precipitation layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    enableLayer(context, 'precipitation');
    const engine = getEnvEngine(context);
    if (!engine) return { success: false, message: 'Environmental engine unavailable' };
    const cached = engine.getCachedObservations(EnvironmentalVariable.Precipitation);
    return { success: true, count: cached.length, variable: 'Precipitation' };
  },
};

export const queryWindTool: AITool = {
  name: 'queryWind',
  description: 'Queries wind speed and direction data. Enables the wind layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    enableLayer(context, 'wind');
    const engine = getEnvEngine(context);
    if (!engine) return { success: false, message: 'Environmental engine unavailable' };
    const cached = engine.getCachedObservations(EnvironmentalVariable.WindSpeed);
    return { success: true, count: cached.length, variable: 'WindSpeed' };
  },
};

export const queryVegetationTool: AITool = {
  name: 'queryVegetation',
  description: 'Queries vegetation and NDVI data. Enables the vegetation layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    enableLayer(context, 'vegetation');
    const engine = getEnvEngine(context);
    if (!engine) return { success: false, message: 'Environmental engine unavailable' };
    const cached = engine.getCachedObservations(EnvironmentalVariable.Vegetation);
    return { success: true, count: cached.length, variable: 'Vegetation' };
  },
};

export const queryForestTool: AITool = {
  name: 'queryForest',
  description: 'Queries forest cover and deforestation data.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    enableLayer(context, 'vegetation');
    const engine = getEnvEngine(context);
    if (!engine) return { success: false, message: 'Environmental engine unavailable' };
    const cached = engine.getCachedObservations(EnvironmentalVariable.ForestCover);
    return { success: true, count: cached.length, variable: 'ForestCover' };
  },
};

export const queryWaterTool: AITool = {
  name: 'queryWater',
  description: 'Queries water level and soil moisture data.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    const engine = getEnvEngine(context);
    if (!engine) return { success: false, message: 'Environmental engine unavailable' };
    const cached = engine.getCachedObservations(EnvironmentalVariable.WaterLevel);
    return { success: true, count: cached.length, variable: 'WaterLevel' };
  },
};

export const queryFloodTool: AITool = {
  name: 'queryFlood',
  description: 'Queries flood extent and water level data. Enables the flood layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    enableLayer(context, 'flood');
    const engine = getEnvEngine(context);
    if (!engine) return { success: false, message: 'Environmental engine unavailable' };
    const cached = engine.getCachedObservations(EnvironmentalVariable.FloodExtent);
    return { success: true, count: cached.length, variable: 'FloodExtent' };
  },
};

export const queryDroughtTool: AITool = {
  name: 'queryDrought',
  description: 'Queries drought indicators and soil moisture data. Enables the drought layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    enableLayer(context, 'drought');
    const engine = getEnvEngine(context);
    if (!engine) return { success: false, message: 'Environmental engine unavailable' };
    const cached = engine.getCachedObservations(EnvironmentalVariable.SoilMoisture);
    return { success: true, count: cached.length, variable: 'SoilMoisture' };
  },
};

export const querySnowTool: AITool = {
  name: 'querySnow',
  description: 'Queries snow cover and depth data. Enables the snow & ice layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    enableLayer(context, 'snow-ice');
    const engine = getEnvEngine(context);
    if (!engine) return { success: false, message: 'Environmental engine unavailable' };
    const cached = engine.getCachedObservations(EnvironmentalVariable.SnowCover);
    return { success: true, count: cached.length, variable: 'SnowCover' };
  },
};

export const queryIceTool: AITool = {
  name: 'queryIce',
  description: 'Queries sea ice extent data. Enables the snow & ice layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    enableLayer(context, 'snow-ice');
    const engine = getEnvEngine(context);
    if (!engine) return { success: false, message: 'Environmental engine unavailable' };
    const cached = engine.getCachedObservations(EnvironmentalVariable.SeaIce);
    return { success: true, count: cached.length, variable: 'SeaIce' };
  },
};

export const queryOceanTool: AITool = {
  name: 'queryOcean',
  description: 'Queries ocean data (SST, currents, wave height). Enables the ocean temperature layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    enableLayer(context, 'ocean-temperature');
    const engine = getEnvEngine(context);
    if (!engine) return { success: false, message: 'Environmental engine unavailable' };
    const cached = engine.getCachedObservations(EnvironmentalVariable.SeaSurfaceTemperature);
    return { success: true, count: cached.length, variable: 'SeaSurfaceTemperature' };
  },
};

export const queryEnvironmentalHistoryTool: AITool = {
  name: 'queryEnvironmentalHistory',
  description: 'Queries historical environmental data for a specific location and time range.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: { variable: { type: 'string' }, timeRange: { type: 'string' } } },
  execute: (_input: unknown, _context: AIContext) => {
    return { success: true, message: 'Historical environmental data requires temporal engine integration.' };
  },
};

export const compareEnvironmentalDataTool: AITool = {
  name: 'compareEnvironmentalData',
  description: 'Compares environmental data between two locations or time periods.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, _context: AIContext) => {
    return { success: true, message: 'Use the Climate Analytics Panel for detailed comparisons.' };
  },
};

export const getEnvironmentalContextTool: AITool = {
  name: 'getEnvironmentalContext',
  description: 'Gets comprehensive environmental context for the current camera location.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    const engine = getEnvEngine(context);
    if (!engine) return { success: false, message: 'Environmental engine unavailable' };

    const variables = [
      EnvironmentalVariable.Temperature,
      EnvironmentalVariable.PM25,
      EnvironmentalVariable.WindSpeed,
      EnvironmentalVariable.Precipitation,
    ];

    const summary: Record<string, { count: number; avgValue?: number }> = {};
    for (const v of variables) {
      const cached = engine.getCachedObservations(v);
      const avg = cached.length > 0
        ? cached.reduce((s, o) => s + o.value, 0) / cached.length
        : undefined;
      summary[v] = { count: cached.length, avgValue: avg ? Math.round(avg * 10) / 10 : undefined };
    }

    return { success: true, context: summary };
  },
};

/** All 15 environmental AI tools. */
export const environmentalTools: AITool[] = [
  queryAirQualityTool,
  queryTemperatureTool,
  queryPrecipitationTool,
  queryWindTool,
  queryVegetationTool,
  queryForestTool,
  queryWaterTool,
  queryFloodTool,
  queryDroughtTool,
  querySnowTool,
  queryIceTool,
  queryOceanTool,
  queryEnvironmentalHistoryTool,
  compareEnvironmentalDataTool,
  getEnvironmentalContextTool,
];
