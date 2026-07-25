/**
 * UIManager — Initializes and coordinates all UI components.
 */

import type { Viewer } from 'cesium';
import { Toolbar } from './components/toolbar/toolbar';
import { SearchPanel } from './components/panels/search-panel';
import { LayersPanel } from './components/panels/layers-panel';
import { SettingsPanel } from './components/panels/settings-panel';
import { CoordinatesDisplay } from './components/panels/coordinates-display';
import { FPSCounter } from './components/panels/fps-counter';
import { initNotificationToast } from './components/notification-toast';
import type { LayerRegistry } from '../layers/layer-registry';
import type { CameraController } from '../core/engine/camera/camera-controller';
import type { SceneManager } from '../core/engine/scene-manager';
import type { GlobeManager } from '../globe/globe-manager';
import { createLogger } from '../utils/logger';
import { getAppConfig, updateGraphicsQuality, type GraphicsQuality } from '../config/app.config';

const log = createLogger('UIManager');

/**
 * Manages all UI components and their interactions.
 */
export class UIManager {
  private toolbar: Toolbar;
  private searchPanel: SearchPanel;
  private layersPanel: LayersPanel;
  private settingsPanel: SettingsPanel;
  private coordinatesDisplay: CoordinatesDisplay;
  private fpsCounter: FPSCounter;

  constructor() {
    this.toolbar = new Toolbar();
    this.searchPanel = new SearchPanel();
    this.layersPanel = new LayersPanel();
    this.settingsPanel = new SettingsPanel();
    this.coordinatesDisplay = new CoordinatesDisplay();
    this.fpsCounter = new FPSCounter();
  }

  /**
   * Initializes all UI components.
   */
  init(
    viewer: Viewer,
    layerRegistry: LayerRegistry,
    cameraController: CameraController,
    sceneManager: SceneManager,
    globeManager: GlobeManager,
  ): void {
    const overlayId = 'ui-overlay';

    // Initialize toast system
    initNotificationToast();

    // Initialize toolbar
    this.toolbar.init(overlayId, (buttonId: string) => {
      this.handleToolbarClick(buttonId);
    });

    // Initialize panels
    this.searchPanel.init(overlayId, viewer);
    this.layersPanel.init(overlayId, layerRegistry);

    const config = getAppConfig();
    this.settingsPanel.init(
      overlayId,
      {
        graphicsQuality: config.graphicsQuality,
        terrain: true,
        clouds: false,
        autoRotate: false,
        showFps: false,
        animationSpeed: 1.0,
      },
      (key: string, value: unknown) => {
        this.handleSettingChange(key, value, cameraController, sceneManager, globeManager);
      },
    );

    this.coordinatesDisplay.init(overlayId);
    this.fpsCounter.init(overlayId);

    log.info('UI Manager initialized');
  }

  /**
   * Handles toolbar button clicks.
   */
  private handleToolbarClick(buttonId: string): void {
    // Close all panels first, then open the requested one
    const panels = [this.searchPanel, this.layersPanel, this.settingsPanel];

    switch (buttonId) {
      case 'search':
        panels.filter((p) => p !== this.searchPanel).forEach((p) => {
          if (p.isVisible()) p.toggle();
        });
        this.searchPanel.toggle();
        this.toolbar.setActive('btn-search', this.searchPanel.isVisible());
        break;

      case 'layers':
        panels.filter((p) => p !== this.layersPanel).forEach((p) => {
          if (p.isVisible()) p.toggle();
        });
        this.layersPanel.toggle();
        this.toolbar.setActive('btn-layers', this.layersPanel.isVisible());
        break;

      case 'settings':
        panels.filter((p) => p !== this.settingsPanel).forEach((p) => {
          if (p.isVisible()) p.toggle();
        });
        this.settingsPanel.toggle();
        this.toolbar.setActive('btn-settings', this.settingsPanel.isVisible());
        break;

      case 'coordinates':
        this.coordinatesDisplay.toggle();
        break;

      case 'home':
        // Camera reset handled by event bus in toolbar
        break;

      case 'fullscreen':
        // Fullscreen handled directly in toolbar
        break;
    }
  }

  /**
   * Handles settings changes.
   */
  private handleSettingChange(
    key: string,
    value: unknown,
    cameraController: CameraController,
    sceneManager: SceneManager,
    globeManager: GlobeManager,
  ): void {
    switch (key) {
      case 'showFps':
        this.fpsCounter.setVisible(value as boolean);
        break;
      case 'autoRotate':
        cameraController.setAutoRotate(value as boolean);
        break;
      case 'terrain':
        globeManager.setTerrainEnabled(value as boolean);
        break;
      case 'clouds':
        globeManager.setCloudsEnabled(value as boolean);
        break;
      case 'graphicsQuality':
        updateGraphicsQuality(value as GraphicsQuality);
        sceneManager.applyQuality(value as GraphicsQuality);
        break;
      case 'animationSpeed':
        // Could control clock speed or animation durations
        break;
    }
  }

  /**
   * Cleans up all UI components.
   */
  dispose(): void {
    this.toolbar.dispose();
    this.searchPanel.dispose();
    this.layersPanel.dispose();
    this.settingsPanel.dispose();
    this.coordinatesDisplay.dispose();
    this.fpsCounter.dispose();
    log.info('UI Manager disposed');
  }
}
