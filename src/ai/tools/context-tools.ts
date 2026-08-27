import type { AIContext, AITool } from '../types';
import { performSearch } from '../../api/search.service';

export const compareLocationsTool: AITool = {
  name: 'compareLocations',
  description: 'Compares two geographic locations and their active events/objects.',
  permissionLevel: 'READ',
  inputSchema: {
    type: 'object',
    properties: {
      locationA: { type: 'string' },
      locationB: { type: 'string' }
    },
    required: ['locationA', 'locationB']
  },
  execute: async (input: unknown, _context: AIContext) => {
    const { locationA, locationB } = input as { locationA: string; locationB: string };
    const resA = await performSearch(locationA);
    const resB = await performSearch(locationB);
    
    return {
      success: true,
      comparison: {
        locA: resA?.[0] || null,
        locB: resB?.[0] || null
      }
    };
  }
};

export const summarizeViewTool: AITool = {
  name: 'summarizeView',
  description: 'Summarizes the current camera view and visible events.',
  permissionLevel: 'READ',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, _context: AIContext) => {
    return {
      success: true,
      message: 'Camera is currently looking at the Earth. Enable specific layers for more detailed analysis.'
    };
  }
};
