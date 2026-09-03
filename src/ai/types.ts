/**
 * AI Command System Types
 */

export type AIIntent =
  | 'SEARCH_LOCATION'
  | 'FLY_TO_LOCATION'
  | 'SHOW_LAYER'
  | 'HIDE_LAYER'
  | 'FILTER_LAYER'
  | 'SELECT_ENTITY'
  | 'FOCUS_ENTITY'
  | 'COMPARE_LOCATIONS'
  | 'QUERY_WEATHER'
  | 'QUERY_EARTHQUAKES'
  | 'QUERY_WILDFIRES'
  | 'QUERY_STORMS'
  | 'QUERY_FLIGHTS'
  | 'QUERY_SHIPS'
  | 'QUERY_SATELLITES'
  | 'QUERY_INFRASTRUCTURE'
  | 'QUERY_POPULATION'
  | 'QUERY_ENVIRONMENT'
  | 'QUERY_AIR_QUALITY'
  | 'QUERY_TEMPERATURE'
  | 'QUERY_PRECIPITATION'
  | 'QUERY_WIND'
  | 'QUERY_VEGETATION'
  | 'QUERY_FOREST'
  | 'QUERY_WATER'
  | 'QUERY_FLOOD'
  | 'QUERY_DROUGHT'
  | 'QUERY_SNOW'
  | 'QUERY_ICE'
  | 'QUERY_OCEAN'
  | 'QUERY_ENVIRONMENTAL_HISTORY'
  | 'COMPARE_ENVIRONMENTAL_DATA'
  | 'GET_ENVIRONMENTAL_CONTEXT'
  | 'GET_NEARBY_ENTITIES'
  | 'GET_RELATED_ENTITIES'
  | 'START_TIMELINE'
  | 'PAUSE_TIMELINE'
  | 'SET_TIME'
  | 'SET_TEMPORAL_MODE'
  | 'CHANGE_GRAPHICS'
  | 'CHANGE_GLOBE_VIEW'
  | 'SUMMARIZE'
  | 'UNKNOWN';

export interface AICommand {
  id: string;
  intent: AIIntent;
  entities?: string[];
  location?: {
    name?: string;
    coordinates?: [number, number]; // [longitude, latitude]
    radius?: number; // in kilometers
  };
  timeRange?: {
    start?: string; // ISO string
    end?: string; // ISO string
    relative?: string; // e.g., 'today', 'last 24 hours'
  };
  filters?: Record<string, string | number | boolean>;
  layer?: string;
  action?: string;
  parameters?: Record<string, unknown>;
  confidence: number;
}

export interface AIToolInputSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
}

export interface AITool {
  name: string;
  description: string;
  inputSchema: AIToolInputSchema;
  permissionLevel: 'READ' | 'WRITE' | 'CONTROL';
  execute: (input: unknown, context: AIContext) => unknown;
}

export interface AIContext {
  currentLocation?: { longitude: number; latitude: number; height?: number };
  selectedEntityId?: string;
  activeLayers: string[];
  activeFilters: Record<string, unknown>;
  currentTime: Date;
  previousQuery?: string;
  cameraContext: {
    heading: number;
    pitch: number;
    roll: number;
  };
  
  // Internal engine references for tools to interact with the globe
  services?: {
    camera?: unknown;
    events?: unknown;
    mobility?: unknown;
    layers?: unknown;
    search?: unknown;
    time?: unknown;
    environment?: unknown;
  };
}

export interface AIProviderConfig {
  apiKey?: string;
  endpoint?: string;
  model?: string;
}

export interface AIProvider {
  name: string;
  type: 'MOCK' | 'LOCAL' | 'REMOTE';
  init(config?: AIProviderConfig): Promise<void>;
  parseIntent(text: string, context: AIContext): Promise<AICommand>;
  generateResponse(command: AICommand, toolResults: unknown, context: AIContext): Promise<string>;
}
