import type { AIContext, AITool } from '../types';
import type { TemporalEngine } from '../../twin/time/temporal-engine';
import { TemporalMode } from '../../twin/time/temporal-state.types';

export const startTimelineTool: AITool = {
  name: 'startTimeline',
  description: 'Starts or resumes the simulation timeline.',
  permissionLevel: 'CONTROL',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    const time = context.services?.time as TemporalEngine | undefined;
    if (time && time.setPaused) {
      time.setPaused(false);
      return { success: true, message: 'Timeline started.' };
    }
    return { success: false, message: 'Time service unavailable' };
  }
};

export const pauseTimelineTool: AITool = {
  name: 'pauseTimeline',
  description: 'Pauses the simulation timeline.',
  permissionLevel: 'CONTROL',
  inputSchema: { type: 'object', properties: {} },
  execute: (_input: unknown, context: AIContext) => {
    const time = context.services?.time as TemporalEngine | undefined;
    if (time && time.setPaused) {
      time.setPaused(true);
      return { success: true, message: 'Timeline paused.' };
    }
    return { success: false, message: 'Time service unavailable' };
  }
};

export const setTimeTool: AITool = {
  name: 'setTime',
  description: 'Sets the simulation time to a specific date or time.',
  permissionLevel: 'CONTROL',
  inputSchema: {
    type: 'object',
    properties: {
      targetDate: { type: 'string', description: 'ISO string of the date to jump to' }
    }
  },
  execute: (input: unknown, context: AIContext) => {
    const { targetDate } = (input || {}) as { targetDate?: string };
    const time = context.services?.time as TemporalEngine | undefined;
    if (time && time.setTime && targetDate) {
      const date = new Date(targetDate);
      if (!isNaN(date.getTime())) {
        time.setTime(date);
        return { success: true, message: `Time set to ${date.toISOString()}.` };
      }
    }
    return { success: false, message: 'Time service unavailable or invalid date.' };
  }
};

export const setTemporalModeTool: AITool = {
  name: 'setTemporalMode',
  description: 'Sets the timeline mode to REAL_TIME, HISTORICAL, or SIMULATION.',
  permissionLevel: 'CONTROL',
  inputSchema: {
    type: 'object',
    properties: {
      mode: { type: 'string', enum: ['REAL_TIME', 'HISTORICAL', 'SIMULATION'] }
    },
    required: ['mode']
  },
  execute: (input: unknown, context: AIContext) => {
    const { mode } = input as { mode: TemporalMode };
    const time = context.services?.time as TemporalEngine | undefined;
    if (time && time.setMode) {
      time.setMode(mode);
      return { success: true, message: `Temporal mode set to ${mode}.` };
    }
    return { success: false, message: 'Time service unavailable' };
  }
};
