/**
 * SceneManager — Central orchestrator for the CesiumJS viewer lifecycle.
 * Responsible for creating, configuring, and managing the Cesium.Viewer instance.
 */

import {
  Viewer,
  Ion,
  Cartesian3,
  Cartesian2,
  Math as CesiumMath,
  ScreenSpaceEventType,
  ScreenSpaceEventHandler,
  Cartographic,
  defined,
  Ellipsoid,
  type Scene,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';

import { getAppConfig } from '../../config/app.config';
import {
  QUALITY_PRESETS,
  DEFAULT_CAMERA,
  CAMERA_LIMITS,
} from '../../config/cesium.config';
import { createLogger } from '../../utils/logger';
import { DisposalRegistry } from '../../utils/dispose';
import { eventBus } from '../../hooks/use-event-bus';

const log = createLogger('SceneManager');

/**
 * Manages the CesiumJS Viewer instance and scene lifecycle.
 * Acts as the single source of truth for the 3D scene.
 */
export class SceneManager {
  private viewer: Viewer | null = null;
  private readonly disposal = new DisposalRegistry();

  /**
   * Initializes the CesiumJS Viewer in the specified container.
   *
   * @param containerId - DOM element ID for the viewer
   * @returns The initialized Viewer instance
   */
  init(containerId: string): Promise<Viewer> {
    const config = getAppConfig();

    // Configure Cesium Ion token if available
    if (config.hasCesiumIon) {
      Ion.defaultAccessToken = config.cesiumIonToken;
      log.info('Cesium Ion token configured');
    }

    const qualityPreset = QUALITY_PRESETS[config.graphicsQuality];

    // Create viewer with production-ready settings
    this.viewer = new Viewer(containerId, {
      // Disable default UI widgets — we build our own
      animation: false,
      baseLayerPicker: false,
      fullscreenButton: false,
      geocoder: false,
      homeButton: false,
      infoBox: false,
      navigationHelpButton: false,
      sceneModePicker: false,
      selectionIndicator: false,
      timeline: false,
      creditContainer: document.createElement('div'), // Hide credits in custom location

      // Rendering
      msaaSamples: qualityPreset.msaa,
      useBrowserRecommendedResolution: true,
      requestRenderMode: qualityPreset.requestRenderMode,
      maximumRenderTimeChange: Infinity,

      // Shadows
      shadows: qualityPreset.shadows,

      // Terrain — will be configured separately by GlobeManager
      terrainProvider: undefined,
    });

    // Apply scene settings
    const scene = this.viewer.scene;
    scene.globe.enableLighting = true;
    scene.globe.depthTestAgainstTerrain = true;
    scene.fog.enabled = qualityPreset.fog;

    // FXAA
    scene.postProcessStages.fxaa.enabled = qualityPreset.fxaa;

    // Sky atmosphere
    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = qualityPreset.skyAtmosphere;
    }

    // Ground atmosphere
    scene.globe.showGroundAtmosphere = qualityPreset.groundAtmosphere;

    // Performance: screen space error
    scene.globe.maximumScreenSpaceError = qualityPreset.maximumScreenSpaceError;

    // Camera constraints
    scene.screenSpaceCameraController.minimumZoomDistance =
      CAMERA_LIMITS.minimumZoomDistance;
    scene.screenSpaceCameraController.maximumZoomDistance =
      CAMERA_LIMITS.maximumZoomDistance;

    // Enable camera inertia for smooth feel
    scene.screenSpaceCameraController.inertiaSpin = 0.9;
    scene.screenSpaceCameraController.inertiaTranslate = 0.9;
    scene.screenSpaceCameraController.inertiaZoom = 0.8;

    // Set initial camera position
    this.viewer.camera.setView({
      destination: Cartesian3.fromDegrees(
        DEFAULT_CAMERA.longitude,
        DEFAULT_CAMERA.latitude,
        DEFAULT_CAMERA.height,
      ),
    });

    // Set up coordinate tracking
    this.setupCoordinateTracking(scene);

    // Set up left-click location handler (v0.2)
    this.setupClickHandler(scene);

    // Handle window resize
    const resizeHandler = () => {
      if (this.viewer && !this.viewer.isDestroyed()) {
        this.viewer.resize();
      }
    };
    window.addEventListener('resize', resizeHandler);
    this.disposal.registerFn(() =>
      window.removeEventListener('resize', resizeHandler),
    );

    // Catch CesiumJS rendering errors to prevent them from propagating
    // to window.onerror and showing user-facing error toasts
    scene.renderError.addEventListener((_scene: Scene, error: unknown) => {
      log.warn('CesiumJS render error caught:', error);
    });

    log.info('Scene initialized successfully');
    return Promise.resolve(this.viewer);
  }

  /**
   * Sets up mouse-move coordinate tracking for the coordinates display.
   */
  private setupCoordinateTracking(scene: Scene): void {
    const handler = new ScreenSpaceEventHandler(scene.canvas);

    handler.setInputAction(
      (movement: { endPosition: Cartesian2 }) => {
        const cartesian = scene.pickPosition(movement.endPosition);
        if (defined(cartesian)) {
          const cartographic = Cartographic.fromCartesian(
            cartesian,
            Ellipsoid.WGS84,
          );
          const lat = CesiumMath.toDegrees(cartographic.latitude);
          const lng = CesiumMath.toDegrees(cartographic.longitude);
          const alt = cartographic.height;
          eventBus.emit('search:result', {
            lat,
            lng,
            label: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
          });
          // Store for coordinates display
          (window as unknown as Record<string, unknown>).__tn_cursor = { lat, lng, alt };
        }
      },
      ScreenSpaceEventType.MOUSE_MOVE,
    );

    this.disposal.registerFn(() => {
      if (!handler.isDestroyed()) handler.destroy();
    });
  }

  /**
   * Sets up left-click to emit location:click for the info panel.
   * Distinct from double-click fly-to in CameraController.
   */
  private setupClickHandler(scene: Scene): void {
    const handler = new ScreenSpaceEventHandler(scene.canvas);

    handler.setInputAction(
      (click: { position: Cartesian2 }) => {
        const cartesian = scene.pickPosition(click.position);
        if (defined(cartesian)) {
          const cartographic = Cartographic.fromCartesian(
            cartesian,
            Ellipsoid.WGS84,
          );
          const lat = CesiumMath.toDegrees(cartographic.latitude);
          const lng = CesiumMath.toDegrees(cartographic.longitude);
          const alt = cartographic.height;
          eventBus.emit('location:click', { lat, lng, alt });
        }
      },
      ScreenSpaceEventType.LEFT_CLICK,
    );

    this.disposal.registerFn(() => {
      if (!handler.isDestroyed()) handler.destroy();
    });
  }

  /**
   * Returns the active Viewer instance.
   * Throws if not initialized.
   */
  getViewer(): Viewer {
    if (!this.viewer || this.viewer.isDestroyed()) {
      throw new Error('SceneManager: Viewer not initialized or destroyed');
    }
    return this.viewer;
  }

  /**
   * Returns the scene from the active Viewer.
   */
  getScene(): Scene {
    return this.getViewer().scene;
  }

  /**
   * Applies a new graphics quality preset at runtime.
   */
  applyQuality(quality: import('../../config/app.config').GraphicsQuality): void {
    const preset = QUALITY_PRESETS[quality];
    const scene = this.getScene();

    scene.fog.enabled = preset.fog;
    scene.postProcessStages.fxaa.enabled = preset.fxaa;
    scene.globe.showGroundAtmosphere = preset.groundAtmosphere;
    scene.globe.maximumScreenSpaceError = preset.maximumScreenSpaceError;
    scene.highDynamicRange = preset.hdr;

    if (scene.skyAtmosphere) {
      scene.skyAtmosphere.show = preset.skyAtmosphere;
    }

    scene.requestRenderMode = preset.requestRenderMode;
    log.info(`Graphics quality changed to: ${quality}`);
  }

  /**
   * Cleans up the viewer and all registered resources.
   */
  dispose(): void {
    this.disposal.disposeAll();
    if (this.viewer && !this.viewer.isDestroyed()) {
      this.viewer.destroy();
    }
    this.viewer = null;
    log.info('Scene disposed');
  }
}
