import type { AIContext, AITool } from '../types';
import { performSearch, flyToResult } from '../../api/search.service';

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
