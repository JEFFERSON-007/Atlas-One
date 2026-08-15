import type { AIContext, AITool } from '../types';
import { performSearch, flyToResult } from '../../api/search.service';
import type { LayerRegistry } from '../../layers/layer-registry';
import type { EarthEventEngine } from '../../events/engine/event-engine';
import type { EarthEvent } from '../../events/earth-event.types';

/**
 * Searches for a location and flies the camera to it.
 */
export const flyToLocationTool: AITool = {
  name: 'flyToLocation',
  description: 'Searches for a geographic location by name and flies the globe camera to it.',
  permissionLevel: 'CONTROL',
  inputSchema: {
    type: 'object',
    properties: {
      locationName: { type: 'string' }
    },
    required: ['locationName']
  },
  execute: async (input: unknown, _context: AIContext) => {
    const { locationName } = input as { locationName: string };
    
    const results = await performSearch(locationName);
    
    if (!results || results.length === 0) {
      return { success: false, message: `Could not find location: ${locationName}` };
    }

    const bestResult = results[0];
    
    if (bestResult) {
      flyToResult(bestResult);
      return { success: true, target: bestResult.displayName };
    }
    
    return { success: false, message: 'Camera service unavailable' };
  }
};

/**
 * Shows or enables a specific layer.
 */
export const showLayerTool: AITool = {
  name: 'showLayer',
  description: 'Enables a specific map layer (e.g. earthquakes, wildfires, ships, flights).',
  permissionLevel: 'CONTROL',
  inputSchema: {
    type: 'object',
    properties: {
      layerId: { type: 'string' }
    },
    required: ['layerId']
  },
  execute: (input: unknown, context: AIContext) => {
    const { layerId } = input as { layerId: string };
    
    const normalizedId = layerId.toLowerCase();
    let actualId = normalizedId;
    
    if (normalizedId.includes('earthquake')) actualId = 'earthquakes';
    if (normalizedId.includes('fire')) actualId = 'wildfires';
    if (normalizedId.includes('flight') || normalizedId.includes('plane')) actualId = 'flights';
    if (normalizedId.includes('ship')) actualId = 'ships';
    
    const layers = context.services?.layers as LayerRegistry | undefined;
    if (layers) {
      const layer = layers.getLayer(actualId);
      if (layer) {
        layer.setEnabled(true);
        return { success: true, layer: actualId };
      }
      return { success: false, message: `Layer ${actualId} not found.` };
    }
    
    return { success: false, message: 'Layer service unavailable' };
  }
};

/**
 * Hides a specific layer.
 */
export const hideLayerTool: AITool = {
  name: 'hideLayer',
  description: 'Disables a specific map layer.',
  permissionLevel: 'CONTROL',
  inputSchema: {
    type: 'object',
    properties: {
      layerId: { type: 'string' }
    },
    required: ['layerId']
  },
  execute: (input: unknown, context: AIContext) => {
    const { layerId } = input as { layerId: string };
    const normalizedId = layerId.toLowerCase();
    let actualId = normalizedId;
    
    if (normalizedId.includes('earthquake')) actualId = 'earthquakes';
    if (normalizedId.includes('fire')) actualId = 'wildfires';
    if (normalizedId.includes('flight') || normalizedId.includes('plane')) actualId = 'flights';
    if (normalizedId.includes('ship')) actualId = 'ships';

    const layers = context.services?.layers as LayerRegistry | undefined;
    if (layers) {
      const layer = layers.getLayer(actualId);
      if (layer) {
        layer.setEnabled(false);
        return { success: true, layer: actualId };
      }
    }
    return { success: false, message: 'Layer service unavailable' };
  }
};

/**
 * Query Earthquakes
 */
export const queryEarthquakesTool: AITool = {
  name: 'queryEarthquakes',
  description: 'Queries recent earthquake data. Automatically enables the earthquake layer.',
  permissionLevel: 'READ',
  inputSchema: {
    type: 'object',
    properties: {
      minMagnitude: { type: 'number' }
    }
  },
  execute: (input: unknown, context: AIContext) => {
    const { minMagnitude } = (input || {}) as { minMagnitude?: number };
    
    // Enable the layer first
    const layers = context.services?.layers as LayerRegistry | undefined;
    if (layers) {
      const layer = layers.getLayer('earthquakes');
      if (layer) layer.setEnabled(true);
    }

    const events = context.services?.events as EarthEventEngine | undefined;
    if (events) {
      const allEvents: EarthEvent[] = events.store.getAll();
      const quakes = allEvents.filter((e: EarthEvent) => e.type === 'EARTHQUAKE');
      
      let filtered = quakes;
      if (minMagnitude !== undefined) {
        filtered = quakes.filter((e: EarthEvent) => {
          const mag = (e.metadata as Record<string, unknown>)?.magnitude;
          return typeof mag === 'number' && mag >= minMagnitude;
        });
      }
      
      return { 
        success: true, 
        count: filtered.length, 
        topEvents: filtered.slice(0, 3).map((e: EarthEvent) => {
          const meta = e.metadata as Record<string, unknown> | undefined;
          return { mag: meta?.magnitude, place: meta?.place };
        }) 
      };
    }
    return { success: false, message: 'Event service unavailable' };
  }
};
