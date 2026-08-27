import type { AIContext, AITool } from '../types';
import type { LayerRegistry } from '../../layers/layer-registry';
import type { EarthEventEngine } from '../../events/engine/event-engine';
import { EventType, type EarthEvent } from '../../events/earth-event.types';
import type { DynamicObjectEngine } from '../../mobility/engine/object-engine';
import { ObjectType, type DynamicObject } from '../../mobility/dynamic-object.types';

export const queryWildfiresTool: AITool = {
  name: 'queryWildfires',
  description: 'Queries active wildfire data. Automatically enables the wildfires layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (input: unknown, context: AIContext) => {
    const layers = context.services?.layers as LayerRegistry | undefined;
    if (layers) {
      const layer = layers.get('wildfires');
      if (layer) layer.enable();
    }
    const events = context.services?.events as EarthEventEngine | undefined;
    if (events) {
      const allEvents: EarthEvent[] = events.store.getAll();
      const fires = allEvents.filter((e: EarthEvent) => e.type === EventType.Wildfire);
      return { success: true, count: fires.length };
    }
    return { success: false, message: 'Event service unavailable' };
  }
};

export const queryStormsTool: AITool = {
  name: 'queryStorms',
  description: 'Queries active storms and weather. Automatically enables the storms layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (input: unknown, context: AIContext) => {
    const layers = context.services?.layers as LayerRegistry | undefined;
    if (layers) {
      const layer = layers.get('storms') || layers.get('weather');
      if (layer) layer.enable();
    }
    const events = context.services?.events as EarthEventEngine | undefined;
    if (events) {
      const allEvents: EarthEvent[] = events.store.getAll();
      const storms = allEvents.filter((e: EarthEvent) => e.type === EventType.Storm);
      return { success: true, count: storms.length };
    }
    return { success: false, message: 'Event service unavailable' };
  }
};

export const queryFlightsTool: AITool = {
  name: 'queryFlights',
  description: 'Queries active flight data. Automatically enables the flights layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (input: unknown, context: AIContext) => {
    const layers = context.services?.layers as LayerRegistry | undefined;
    if (layers) {
      const layer = layers.get('flights');
      if (layer) layer.enable();
    }
    const mobility = context.services?.mobility as DynamicObjectEngine | undefined;
    if (mobility) {
      const allObjects: DynamicObject[] = mobility.store.getAll();
      const flights = allObjects.filter((o: DynamicObject) => o.type === ObjectType.Aircraft);
      return { success: true, count: flights.length };
    }
    return { success: false, message: 'Mobility service unavailable' };
  }
};

export const queryShipsTool: AITool = {
  name: 'queryShips',
  description: 'Queries active maritime ship data. Automatically enables the ships layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (input: unknown, context: AIContext) => {
    const layers = context.services?.layers as LayerRegistry | undefined;
    if (layers) {
      const layer = layers.get('ships');
      if (layer) layer.enable();
    }
    const mobility = context.services?.mobility as DynamicObjectEngine | undefined;
    if (mobility) {
      const allObjects: DynamicObject[] = mobility.store.getAll();
      const ships = allObjects.filter((o: DynamicObject) => o.type === ObjectType.Ship);
      return { success: true, count: ships.length };
    }
    return { success: false, message: 'Mobility service unavailable' };
  }
};

export const querySatellitesTool: AITool = {
  name: 'querySatellites',
  description: 'Queries active satellite data. Automatically enables the satellites layer.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (input: unknown, context: AIContext) => {
    const layers = context.services?.layers as LayerRegistry | undefined;
    if (layers) {
      const layer = layers.get('satellites');
      if (layer) layer.enable();
    }
    const mobility = context.services?.mobility as DynamicObjectEngine | undefined;
    if (mobility) {
      const allObjects: DynamicObject[] = mobility.store.getAll();
      const sats = allObjects.filter((o: DynamicObject) => o.type === ObjectType.Satellite || o.type === ObjectType.ISS);
      return { success: true, count: sats.length };
    }
    return { success: false, message: 'Mobility service unavailable' };
  }
};
