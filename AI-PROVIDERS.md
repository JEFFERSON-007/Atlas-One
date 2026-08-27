# AI Providers in Atlas One

Atlas One abstracts the LLM backend through the `AIProvider` interface. This ensures that the application can run in various environments safely without exposing sensitive API keys.

## Supported Providers

### 1. Mock Provider (`MockAIProvider`)
- **Purpose**: Safe, zero-configuration provider intended for GitHub Pages or environments without API keys.
- **How it works**: Uses regex and basic string matching to determine `AICommand.intent` and extract parameters. It then maps the executed tool result back to a static, templated string response.
- **Status**: Complete. Fully supports v0.6 AI specification.

### 2. Remote Provider (`OpenAIProvider`)
- **Purpose**: Full LLM integration using OpenAI's API.
- **How it works**: Sends a system prompt and the user's natural language request to `gpt-4o`. The prompt instructs the LLM to output a JSON object adhering to the `AICommand` schema. Tool execution results are then fed back to the LLM to generate a natural, conversational response.
- **Status**: Implemented. Requires the user to provide an API key via the Settings panel.

### 3. Local Provider (`LocalLLMProvider`)
- **Purpose**: Private, offline AI using locally hosted models (e.g., via Ollama).
- **How it works**: Similar to OpenAI, but configured to hit a local endpoint (`http://localhost:11434/v1/chat/completions`).
- **Status**: Scaffolding complete.

## Security Rule
Never hardcode API keys in the source code. The application relies on the user providing keys through the `SettingsPanel` or uses the `MockAIProvider` as a fallback.
