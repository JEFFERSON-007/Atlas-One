import type { AICommand, AIContext, AIProvider, AITool } from './types';
import { createLogger } from '../utils/logger';
import { MockAIProvider } from './providers/mock-provider';
import { OpenAIProvider } from './providers/openai-provider';
import { LocalLLMProvider } from './providers/local-llm-provider';
import { flyToLocationTool, showLayerTool, hideLayerTool, queryEarthquakesTool } from './tools/core-tools';

const log = createLogger('AIEngine');

export class AIEngine {
  private provider!: AIProvider;
  private tools: Map<string, AITool> = new Map();
  private context: AIContext;

  constructor(services: AIContext['services']) {
    this.context = {
      activeLayers: [],
      activeFilters: {},
      currentTime: new Date(),
      cameraContext: { heading: 0, pitch: 0, roll: 0 },
      services
    };

    // Register built-in tools
    this.registerTool(flyToLocationTool);
    this.registerTool(showLayerTool);
    this.registerTool(hideLayerTool);
    this.registerTool(queryEarthquakesTool);
    
    // Default to MockProvider for GitHub Pages safe execution
    this.setProvider('MOCK');
  }

  public async setProvider(type: 'MOCK' | 'LOCAL' | 'REMOTE', config?: { apiKey?: string; endpoint?: string }) {
    switch (type) {
      case 'MOCK':
        this.provider = new MockAIProvider();
        break;
      case 'REMOTE':
        this.provider = new OpenAIProvider();
        break;
      case 'LOCAL':
        this.provider = new LocalLLMProvider();
        break;
    }
    await this.provider.init(config);
    log.info(`AI Provider set to ${this.provider.name}`);
  }

  public registerTool(tool: AITool) {
    this.tools.set(tool.name, tool);
  }

  public async processRequest(text: string, onProgress?: (msg: string) => void): Promise<string> {
    log.info(`Processing request: ${text}`);
    if (onProgress) onProgress('Understanding request...');

    // 1. Parse Intent
    let command: AICommand;
    try {
      this.updateContext();
      command = await this.provider.parseIntent(text, this.context);
      log.debug('Parsed Command:', command);
    } catch (e) {
      log.error('Intent parsing failed', e);
      return 'I encountered an error understanding your request. Please ensure your provider is configured correctly.';
    }

    // 2. Validate and Execute Tool
    let toolResult: unknown = null;
    try {
      if (onProgress) onProgress('Executing command...');
      toolResult = await this.executeCommand(command);
    } catch (e) {
      log.error('Tool execution failed', e);
      return 'I understood your request but failed to execute it. See logs for details.';
    }

    // 3. Generate natural response
    if (onProgress) onProgress('Generating response...');
    try {
      return await this.provider.generateResponse(command, toolResult, this.context);
    } catch (e) {
      return 'Command executed successfully, but failed to generate a response summary.';
    }
  }

  private async executeCommand(command: AICommand): Promise<unknown> {
    // Map intents to registered tools
    let toolName: string | null = null;
    let input: unknown = {};

    switch (command.intent) {
      case 'FLY_TO_LOCATION':
        toolName = 'flyToLocation';
        input = { locationName: command.location?.name };
        break;
      case 'SHOW_LAYER':
        toolName = 'showLayer';
        input = { layerId: command.layer || command.entities?.[0] || '' };
        break;
      case 'HIDE_LAYER':
        toolName = 'hideLayer';
        input = { layerId: command.layer || command.entities?.[0] || '' };
        break;
      case 'QUERY_EARTHQUAKES':
        toolName = 'queryEarthquakes';
        input = { minMagnitude: command.filters?.minMagnitude };
        break;
      // ... Add mapping for other intents
      default:
        log.warn(`No specific tool mapped for intent: ${command.intent}`);
        return { success: false, reason: 'unsupported_intent' };
    }

    if (toolName) {
      const tool = this.tools.get(toolName);
      if (tool) {
        return await tool.execute(input, this.context);
      }
    }

    return { success: false, reason: 'tool_not_found' };
  }

  private updateContext() {
    this.context.currentTime = new Date(); // In a real scenario, get this from TimeController
    // Update camera context, active layers, etc. from services
  }
}
