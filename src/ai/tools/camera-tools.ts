import type { AIContext, AITool } from '../types';

export const startTimelineTool: AITool = {
  name: 'startTimeline',
  description: 'Starts or resumes the simulation timeline.',
  permissionLevel: 'CONTROL',
  inputSchema: { type: 'object', properties: {} },
  execute: (input: unknown, context: AIContext) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const time = context.services?.time as any;
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
  execute: (input: unknown, context: AIContext) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const time = context.services?.time as any;
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const time = context.services?.time as any;
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
