import type { AICommand, AIContext, AIProvider, AIProviderConfig } from '../types';
import { createLogger } from '../../utils/logger';

const log = createLogger('LocalLLMProvider');

interface OllamaResponse {
  response: string;
}

/**
 * Local LLM Provider for AI Assistant.
 * Uses a local API endpoint (e.g. Ollama running on localhost:11434).
 */
export class LocalLLMProvider implements AIProvider {
  name = 'LocalLLMProvider';
  type = 'LOCAL' as const;
  
  private endpoint = 'http://localhost:11434/api/generate';
  private model = 'llama3';

  init(config?: AIProviderConfig): Promise<void> {
    if (config?.endpoint) {
      this.endpoint = config.endpoint;
    }
    if (config?.model) {
      this.model = config.model;
    }
    return Promise.resolve();
  }

  async parseIntent(text: string, _context: AIContext): Promise<AICommand> {
    const systemPrompt = `You are an AI parsing engine. Parse the user request into JSON matching this schema:
{"id":"uuid","intent":"SEARCH_LOCATION | FLY_TO_LOCATION | SHOW_LAYER | HIDE_LAYER | FILTER_LAYER | QUERY_EARTHQUAKES | QUERY_WILDFIRES | QUERY_FLIGHTS | QUERY_SHIPS | SUMMARIZE | UNKNOWN","location":{"name":"string"},"filters":{"key":"value"},"confidence":0.9}
Only output the JSON object. Do not output markdown code blocks or text.

User: ${text}`;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          prompt: systemPrompt,
          stream: false,
          format: 'json'
        })
      });

      if (!response.ok) {
        throw new Error(`Local LLM error: ${response.statusText}`);
      }

      const data = (await response.json()) as OllamaResponse;
      const parsed = JSON.parse(data.response) as AICommand;
      
      return {
        ...parsed,
        id: crypto.randomUUID()
      };
    } catch (e) {
      log.error('Failed to parse intent via Local LLM', e);
      throw e;
    }
  }

  async generateResponse(command: AICommand, toolResults: unknown, _context: AIContext): Promise<string> {
    const systemPrompt = `Summarize the result of command ${command.intent}. Result: ${JSON.stringify(toolResults)}. Keep it to 1 sentence.`;

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: this.model,
          prompt: systemPrompt,
          stream: false
        })
      });

      const data = (await response.json()) as OllamaResponse;
      return data.response.trim();
    } catch (e) {
      log.error('Failed to generate response via Local LLM', e);
      return "Executed command.";
    }
  }
}
