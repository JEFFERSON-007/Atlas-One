# Atlas One Walkthrough (v0.8)

Atlas One integrates specialized systems for monitoring global events, mobility intelligence, and dynamic environment visualization.

## v0.8 Visual Overhaul
The v0.8 update introduces major visual, tactical, and shareability enhancements to Atlas One, pushing it closer to a military-grade "God's Eye View" platform.

### Sensor Modes (GLSL Post-Processing)
Atlas One now includes 6 distinct visual sensor modes built via custom GLSL fragment shaders injected into the CesiumJS post-processing pipeline. Toggle them via the toolbar icon or the `SensorModePanel`.
- **NORMAL**: Standard optical satellite view.
- **NVG (Night Vision Goggles)**: Amplifies scene luminance, shifts spectrum to a monochrome green scale, and applies a subtle noise/scanline effect.
- **FLIR (Forward Looking Infrared)**: Inverts luminance and applies a stark black/white thermal signature map.
- **CRT (Cathode Ray Tube)**: Simulates a retro tactical monitor with barrel distortion, vignette, color aberration, and pronounced scanlines.
- **NOIR (Monochrome)**: Strips color for high-contrast B&W imagery, useful for terrain analysis.
- **SNOW (Static)**: Simulates signal interference and static noise.
- **TACTICAL**: Applies an edge-detection convolution matrix (Sobel filter) to highlight structural contours and topography in neon colors.

### Tactical Overlays
- **Military HUD (Press `H`)**: A screen-space overlay that provides real-time telemetry (Coordinates, Altitude, Heading, Pitch, Time, FPS) mimicking a fighter jet or drone feed.
- **Detection Overlay (Press `D`)**: Dynamically draws animated targeting brackets (bounding boxes) around tracked mobility objects directly in 2D screen space. 

### Shareable Links
- **State Serialization**: The current map center, altitude, camera heading/pitch, active sensor mode, and enabled data layers are all serialized into the URL.
- **Deep Linking**: Click the "Share" button in the toolbar to instantly copy a deep link to your clipboard. When another user opens that link, Atlas One restores the precise tactical view you were observing.

## v0.6 AI Integration

I have completed the AI integration for Atlas One! The system now supports a full AI Engine that can communicate with the globe and process natural language intents.

## What's Included

- **AIEngine**: The main orchestrator connecting providers, tools, and the globe services.
- **Tools Architecture**: Highly modular tools (search, layer toggling, earthquake querying) built with strict typing and no `any` fallbacks.
- **Mock Provider**: A heuristic-based fallback provider safe for GitHub pages without exposing an API key.
- **OpenAI & Local Providers**: Integration scaffolding for external API LLMs.
- **AIAssistant Panel UI**: A custom left-side panel for chat interactions, seamlessly woven into the existing UI Manager exclusivity system (`isVisible()`).
- **Code Health**: All files have been refactored to pass strict `@typescript-eslint` rules, resolving over 80 lints related to unsafe types and floating promises.

## How to Test

Since the environment command runner is having path issues with powershell, you will need to test the frontend build manually.

1. **Verify Lints**:
   ```bash
   npm run lint
   npm run type-check
   ```
2. **Build the Application**:
   ```bash
   npm run build
   ```
3. **Run Locally**:
   ```bash
   npm run dev
   ```

You can open the AI panel via the UI and try typing: `"Show me earthquakes above magnitude 5"` (the MockProvider is enabled by default to process this heuristic out of the box).
