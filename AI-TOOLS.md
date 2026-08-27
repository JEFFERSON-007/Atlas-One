# AI Tools Registry

This document lists all active `AITool` implementations registered with the `AIEngine`. The AI can only interact with the globe through these tools, ensuring safety and preventing hallucinations.

## Core Tools (`core-tools.ts`)
- **`flyToLocation`**: Searches for a geographic location by name and flies the globe camera to it.
- **`showLayer`**: Enables a specific map layer (e.g. earthquakes, wildfires, ships, flights).
- **`hideLayer`**: Disables a specific map layer.
- **`queryEarthquakes`**: Queries recent earthquake data based on magnitude. Automatically enables the earthquake layer.

## Query Tools (`query-tools.ts`)
- **`queryWildfires`**: Queries active wildfire data. Automatically enables the wildfires layer.
- **`queryStorms`**: Queries active storms and weather. Automatically enables the storms layer.
- **`queryFlights`**: Queries active flight data. Automatically enables the flights layer.
- **`queryShips`**: Queries active maritime ship data. Automatically enables the ships layer.
- **`querySatellites`**: Queries active satellite data. Automatically enables the satellites layer.

## Camera & Timeline Tools (`camera-tools.ts`)
- **`startTimeline`**: Starts or resumes the simulation timeline.
- **`pauseTimeline`**: Pauses the simulation timeline.
- **`setTime`**: Sets the simulation time to a specific date or time.

## Context Tools (`context-tools.ts`)
- **`compareLocations`**: Compares two geographic locations and their active events/objects.
- **`summarizeView`**: Summarizes the current camera view and visible events.

## Creating a New Tool
1. Define the tool adhering to the `AITool` interface (requires `name`, `description`, `permissionLevel`, `inputSchema`, and `execute` function).
2. Place the tool in the appropriate category file under `src/ai/tools/`.
3. Register the tool in `src/ai/engine.ts` inside the `AIEngine` constructor.
4. If using `MockAIProvider`, ensure a corresponding intent is parsed in `src/ai/providers/mock-provider.ts`.
