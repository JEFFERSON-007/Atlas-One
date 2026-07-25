/**
 * Atlas One — Main Application Entry Point
 * Bootstraps the Earth Intelligence Platform.
 */

import './cesium-init';
import './styles/index.css';
import './styles/cesium-overrides.css';

import { SceneManager } from './core/engine/scene-manager';
import { CameraController } from './core/engine/camera/camera-controller';
import { LightingManager } from './core/engine/lighting/lighting-manager';
import { SpaceEnvironment } from './core/engine/scene/space-environment';
import { AnimationController } from './core/engine/animation/animation-controller';
import { GlobeManager } from './globe/globe-manager';
import { LayerRegistry } from './layers/layer-registry';
import { UIManager } from './ui/ui-manager';
import { loadAppConfig } from './config/app.config';
import { createLogger } from './utils/logger';
import { eventBus } from './hooks/use-event-bus';

// Layer implementations
import { SatelliteImageryLayer } from './layers/implementations/satellite-imagery.layer';
import { BordersLayer } from './layers/implementations/borders.layer';
import { CitiesLayer } from './layers/implementations/cities.layer';
import { TerrainToggleLayer } from './layers/implementations/terrain.layer';
import { CloudsToggleLayer } from './layers/implementations/clouds.layer';
import { GridLayer } from './layers/implementations/grid.layer';

const log = createLogger('Main');

/**
 * Application bootstrap function.
 * Initializes all systems in the correct order.
 */
async function bootstrap(): Promise<void> {
  log.info('Atlas One v0.1 — Starting...');

  // 1. Load configuration
  const config = loadAppConfig();
  log.info(`Config loaded: Ion=${config.hasCesiumIon}, Quality=${config.graphicsQuality}`);

  // 2. Initialize core engine
  const sceneManager = new SceneManager();
  const viewer = await sceneManager.init('cesium-container');

  // 3. Initialize lighting and space environment
  const lightingManager = new LightingManager();
  lightingManager.init(viewer);

  const spaceEnvironment = new SpaceEnvironment();
  spaceEnvironment.init(viewer);

  // 4. Initialize camera controller
  const cameraController = new CameraController();
  cameraController.init(viewer);

  // 5. Initialize globe system (terrain, imagery, clouds, atmosphere)
  const globeManager = new GlobeManager();
  await globeManager.init(viewer);

  // 6. Initialize layer system
  const layerRegistry = new LayerRegistry();
  layerRegistry.setViewer(viewer);

  // Register all layers
  await Promise.all([
    layerRegistry.register(new SatelliteImageryLayer()),
    layerRegistry.register(new TerrainToggleLayer()),
    layerRegistry.register(new CloudsToggleLayer()),
    layerRegistry.register(new BordersLayer()),
    layerRegistry.register(new CitiesLayer()),
    layerRegistry.register(new GridLayer()),
  ]);

  log.info(`${layerRegistry.getAll().length} layers registered`);

  // 7. Initialize UI
  const uiManager = new UIManager();
  uiManager.init(viewer, layerRegistry, cameraController, sceneManager, globeManager);

  // 8. Play landing animation
  const animationController = new AnimationController();
  animationController.init(viewer);
  await animationController.playLandingSequence();

  // 9. Show missing token notification if applicable
  if (!config.hasCesiumIon) {
    eventBus.emit('notification:show', {
      message: 'Running without Cesium Ion token. Add VITE_CESIUM_ION_TOKEN to .env for terrain and premium imagery.',
      type: 'info',
    });
  }

  log.info('Atlas One initialized successfully');

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    animationController.dispose();
    uiManager.dispose();
    layerRegistry.dispose();
    globeManager.dispose();
    cameraController.dispose();
    lightingManager.dispose();
    spaceEnvironment.dispose();
    sceneManager.dispose();
    eventBus.off();
    log.info('Atlas One shutdown complete');
  });
}

// Global error handler
window.addEventListener('error', (event) => {
  log.error(`Uncaught error: ${event.message}`);
  eventBus.emit('notification:show', {
    message: 'An unexpected error occurred. Some features may be unavailable.',
    type: 'error',
  });
});

window.addEventListener('unhandledrejection', (event) => {
  log.error(`Unhandled promise rejection: ${String(event.reason)}`);
  eventBus.emit('notification:show', {
    message: 'A background operation failed. Please try again.',
    type: 'error',
  });
});

// Launch the application
bootstrap().catch((error) => {
  log.error('Failed to initialize Atlas One', error);

  // Remove splash screen so user sees something
  const splash = document.getElementById('splash-screen');
  if (splash) splash.style.display = 'none';

  // Show error in UI
  const app = document.getElementById('app');
  if (app) {
    const errorDiv = document.createElement('div');
    errorDiv.style.cssText =
      'position:fixed;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:1rem;background:#0a0e17;color:#e2e8f0;font-family:Inter,sans-serif;padding:2rem;text-align:center;';
    errorDiv.innerHTML = `
      <h1 style="font-size:1.5rem;font-weight:300;letter-spacing:0.2em;text-transform:uppercase;color:#94a3b8;">Atlas One</h1>
      <p style="color:#f87171;">Failed to initialize the application.</p>
      <p style="color:#64748b;font-size:0.85rem;">Please check the browser console for details.</p>
      <button onclick="location.reload()" style="padding:8px 20px;border:1px solid #334155;border-radius:8px;background:transparent;color:#e2e8f0;cursor:pointer;font-family:inherit;">Reload</button>
    `;
    app.appendChild(errorDiv);
  }
});
