import type { AICommand, AIContext, AIProvider, AIProviderConfig } from '../types';

/**
 * A browser-safe Mock AI Provider for GitHub Pages deployment.
 * Translates natural language to intents using keyword heuristics.
 * Ensures Atlas One works "out of the box" without needing private API keys.
 */
export class MockAIProvider implements AIProvider {
  name = 'MockAIProvider';
  type = 'MOCK' as const;

  init(_config?: AIProviderConfig): Promise<void> {
    return Promise.resolve();
  }

  parseIntent(text: string, _context: AIContext): Promise<AICommand> {
    const lowerText = text.toLowerCase();
    
    const command: AICommand = {
      id: crypto.randomUUID(),
      intent: 'UNKNOWN',
      confidence: 0,
      parameters: {}
    };

    // 1. Identify Intent
    if (lowerText.includes('earthquake')) {
      command.intent = 'QUERY_EARTHQUAKES';
      command.confidence = 0.9;
    } else if (lowerText.includes('fire') || lowerText.includes('wildfire')) {
      command.intent = 'QUERY_WILDFIRES';
      command.confidence = 0.9;
    } else if (lowerText.includes('plane') || lowerText.includes('flight') || lowerText.includes('aircraft')) {
      command.intent = 'QUERY_FLIGHTS';
      command.confidence = 0.9;
    } else if (lowerText.includes('ship') || lowerText.includes('boat')) {
      command.intent = 'QUERY_SHIPS';
      command.confidence = 0.9;
    } else if (lowerText.includes('satellite') || lowerText.includes('iss')) {
      command.intent = 'QUERY_SATELLITES';
      command.confidence = 0.9;
    } else if (lowerText.includes('weather') || lowerText.includes('storm')) {
      command.intent = 'QUERY_WEATHER';
      command.confidence = 0.9;
    } else if (lowerText.includes('compare')) {
      command.intent = 'COMPARE_LOCATIONS';
      command.confidence = 0.9;
    } else if (lowerText.includes('fast forward') || lowerText.includes('set time') || lowerText.includes('jump to')) {
      command.intent = 'SET_TIME';
      command.confidence = 0.9;
    } else if (lowerText.includes('start time') || lowerText.includes('play time') || lowerText.includes('resume')) {
      command.intent = 'START_TIMELINE';
      command.confidence = 0.9;
    } else if (lowerText.includes('pause time') || lowerText.includes('stop time') || lowerText.includes('halt')) {
      command.intent = 'PAUSE_TIMELINE';
      command.confidence = 0.9;
    } else if (lowerText.includes('near') || lowerText.includes('nearby') || lowerText.includes('closest')) {
      command.intent = 'GET_NEARBY_ENTITIES';
      command.confidence = 0.9;
    } else if (lowerText.includes('infrastructure') || lowerText.includes('road')) {
      command.intent = 'QUERY_INFRASTRUCTURE';
      command.confidence = 0.9;
    } else if (lowerText.includes('population') || lowerText.includes('people')) {
      command.intent = 'QUERY_POPULATION';
      command.confidence = 0.9;
    } else if (lowerText.includes('what am i looking at') || lowerText.includes('summarize')) {
      command.intent = 'SUMMARIZE';
      command.confidence = 0.9;
    } else if (lowerText.includes('hide') || lowerText.includes('remove') || lowerText.includes('turn off')) {
      command.intent = 'HIDE_LAYER';
      command.confidence = 0.8;
    } else if (lowerText.includes('show') || lowerText.includes('turn on')) {
      command.intent = 'SHOW_LAYER';
      command.confidence = 0.7;
    } else if (lowerText.includes('take me to') || lowerText.includes('fly to') || lowerText.includes('zoom to') || lowerText.includes('where is')) {
      command.intent = 'FLY_TO_LOCATION';
      command.confidence = 0.9;
    }

    // 2. Extract specific parameters (Simple heuristics)
    if (lowerText.includes('magnitude')) {
      const match = lowerText.match(/magnitude (\d+(\.\d+)?)/);
      if (match && match[1]) {
        command.filters = {
          minMagnitude: parseFloat(match[1])
        };
      }
    }

    // Attempt to extract a location (assuming words starting with capitals or after prepositions)
    // For a mock, this is rudimentary.
    const prepositions = ['in', 'near', 'around', 'over', 'to', 'at'];
    for (const prep of prepositions) {
      const regex = new RegExp(`\\b${prep}\\s+([A-Z][a-zA-Z]+(?:\\s+[A-Z][a-zA-Z]+)*)`);
      const match = text.match(regex);
      if (match && match[1]) {
        command.location = { name: match[1] };
        break;
      }
    }

    // Special case for 'today', 'now'
    if (lowerText.includes('today')) {
      command.timeRange = { relative: 'today' };
    }

    return Promise.resolve(command);
  }

  generateResponse(command: AICommand, toolResults: unknown, _context: AIContext): Promise<string> {
    if (command.intent === 'UNKNOWN') {
      return Promise.resolve("I'm sorry, I didn't understand that request. Try asking about earthquakes, flights, or flying to a location.");
    }

    // Very basic templated responses based on tools
    if (command.intent === 'QUERY_EARTHQUAKES') {
      const res = toolResults as { count?: number };
      if (res && res.count !== undefined) {
        return Promise.resolve(`Found ${res.count} earthquakes matching your criteria. I have updated the globe.`);
      }
      return Promise.resolve('I have updated the earthquake visualization on the globe.');
    }

    if (command.intent === 'FLY_TO_LOCATION') {
      return Promise.resolve(`Flying to ${command.location?.name || 'that location'}.`);
    }

    if (command.intent.startsWith('QUERY_')) {
      const res = toolResults as { count?: number };
      const entityName = command.intent.replace('QUERY_', '').toLowerCase().replace(/_/g, ' ');
      if (res && res.count !== undefined) {
        return Promise.resolve(`Found ${res.count} ${entityName} matching your criteria. I have updated the globe.`);
      }
      return Promise.resolve(`I have updated the ${entityName} visualization on the globe.`);
    }

    if (command.intent === 'SET_TIME') {
      return Promise.resolve('I have updated the simulation time as requested.');
    }

    if (command.intent === 'START_TIMELINE') {
      return Promise.resolve('Simulation playback started.');
    }

    if (command.intent === 'PAUSE_TIMELINE') {
      return Promise.resolve('Simulation playback paused.');
    }

    return Promise.resolve('I have processed your request and updated Atlas One.');
  }
}
