import type { AICommand, AIContext, AIProvider, AIProviderConfig } from '../types';
import { createLogger } from '../../utils/logger';

const log = createLogger('OpenAIProvider');

/**
 * OpenAI Provider for AI Assistant.
 * IMPORTANT: Because this is a frontend-only GitHub Pages app, this provider
 * REQUIRES the user to manually provide their own temporary API key.
 * 
 * Keys are never persisted to disk or sent to our servers.
 */
export class OpenAIProvider implements AIProvider {
  name = 'OpenAIProvider';
  type = 'REMOTE' as const;
  
  private apiKey: string | null = null;
  private model = 'gpt-4o-mini';

  async init(config?: AIProviderConfig): Promise<void> {
    if (config?.apiKey) {
      this.apiKey = config.apiKey;
    }
    if (config?.model) {
      this.model = config.model;
    }
  }

  /**
   * Set or update the API key at runtime.
   */
  setApiKey(key: string): void {
    this.apiKey = key;
  }

  async parseIntent(text: string, context: AIContext): Promise<AICommand> {
    if (!this.apiKey) {
      throw new Error('OpenAI API Key is missing. Please configure it in settings.');
    }

    const systemPrompt = `You are the AI engine for Atlas One, an Earth Intelligence platform.
Your job is to parse the user's natural language request and output a JSON object matching the AICommand schema.
Do not output anything other than JSON.

Schema:
{
  "id": "uuid",
  "intent": "SEARCH_LOCATION | FLY_TO_LOCATION | SHOW_LAYER | HIDE_LAYER | FILTER_LAYER | QUERY_EARTHQUAKES | QUERY_WILDFIRES | QUERY_FLIGHTS | QUERY_SHIPS | QUERY_SATELLITES | QUERY_WEATHER | SUMMARIZE | UNKNOWN",
  "entities": ["string"],
  "location": { "name": "string" },
  "filters": { "key": "value" },
  "confidence": 0.0 to 1.0
}

Current Context:
Time: ${context.currentTime.toISOString()}
Active Layers: ${context.activeLayers.join(', ')}

Examples:
User: "Show me earthquakes above magnitude 5"
Output: {"id":"123","intent":"QUERY_EARTHQUAKES","filters":{"minMagnitude":5},"confidence":0.99}

User: "Fly to Tokyo"
Output: {"id":"124","intent":"FLY_TO_LOCATION","location":{"name":"Tokyo"},"confidence":0.99}
`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: text }
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      const parsed = JSON.parse(content) as AICommand;
      
      return {
        ...parsed,
        id: crypto.randomUUID()
      };
    } catch (e) {
      log.error('Failed to parse intent via OpenAI', e);
      throw e;
    }
  }

  async generateResponse(command: AICommand, toolResults: unknown, _context: AIContext): Promise<string> {
    if (!this.apiKey) return "API key missing.";

    const systemPrompt = `You are Atlas One, an AI Earth Intelligence Assistant.
You have just executed a command on behalf of the user.
Summarize the results in 1-2 concise, professional sentences. 

Executed Command: ${command.intent}
Result Data: ${JSON.stringify(toolResults)}

Respond naturally as an assistant. Do NOT fabricate data. If data is missing, state it is unavailable.`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt }
          ],
          temperature: 0.3
        })
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (e) {
      log.error('Failed to generate response via OpenAI', e);
      return "Command executed successfully, but failed to generate a summary.";
    }
  }
}
