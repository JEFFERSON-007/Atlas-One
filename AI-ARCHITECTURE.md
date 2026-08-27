# Atlas One AI Architecture

The AI Intelligence Engine in Atlas One is designed to process natural language requests, determine user intent, and execute corresponding actions within the 3D globe environment without hallucinating data or executing unverified logic.

## Core Flow

1. **Input Reception**: The `AiAssistantPanel` receives a natural language query from the user.
2. **Intent Parsing**: The query is sent to the `AIEngine`, which routes it to the currently configured `AIProvider` (e.g., Mock, OpenAI).
3. **Command Generation**: The provider processes the text and the current `AIContext` to return a structured `AICommand` (Intent, Entities, Location, TimeRange, Filters).
4. **Tool Execution**: The `AIEngine` matches the `AICommand.intent` to a registered `AITool`. It passes the context (services like LayerRegistry, EarthEventEngine, TimeController) to the tool.
5. **Environment Update**: The tool executes side effects (enabling layers, moving camera, changing time) and returns a result object.
6. **Response Generation**: The `AIProvider` generates a natural language summary based on the tool's result, which is then displayed to the user.

## Component Responsibilities

- **`AIEngine`**: Central orchestrator. Manages tool registration and routes commands.
- **`AIProvider`**: Interface for LLMs or Mock services. Handles text parsing and response generation.
- **`AITool`**: Isolated function that performs a specific action (e.g., `queryEarthquakesTool`).
- **`AIContext`**: A snapshot of the application state and references to singleton engines (`LayerRegistry`, `TimeController`, etc.), allowing tools to manipulate the globe safely.

## Safety & Security

- **Strict Tool Boundaries**: AI does not write code or inject arbitrary state. It only invokes pre-defined `AITool` implementations.
- **Provider Abstraction**: Allows switching between local (safe, private), mock (GitHub Pages safe), and remote (OpenAI) backends without changing engine logic.
