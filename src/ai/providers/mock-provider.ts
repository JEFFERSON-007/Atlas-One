import type { AICommand, AIContext, AIIntent, AIProvider, AIProviderConfig } from '../types';

/**
 * A browser-safe Mock AI Provider for GitHub Pages deployment.
 * Translates natural language to intents using keyword heuristics.
 * Ensures Atlas One works "out of the box" without needing private API keys.
 */
export class MockAIProvider implements AIProvider {
  name = 'MockAIProvider';
  type = 'MOCK' as const;

  async init(_config?: AIProviderConfig): Promise<void> {
    // No initialization required
  }

  async parseIntent(text: string, context: AIContext): Promise<AICommand> {
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

    return command;
  }

  async generateResponse(command: AICommand, toolResults: unknown, context: AIContext): Promise<string> {
    if (command.intent === 'UNKNOWN') {
      return "I'm sorry, I didn't understand that request. Try asking about earthquakes, flights, or flying to a location.";
    }

    // Very basic templated responses based on tools
    if (command.intent === 'QUERY_EARTHQUAKES') {
      const res = toolResults as { count?: number };
      if (res && res.count !== undefined) {
        return `Found ${res.count} earthquakes matching your criteria. I have updated the globe.`;
      }
      return 'I have updated the earthquake visualization on the globe.';
    }

    if (command.intent === 'FLY_TO_LOCATION') {
      return `Flying to ${command.location?.name || 'that location'}.`;
    }

    return 'I have processed your request and updated Atlas One.';
  }
}
