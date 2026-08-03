/**
 * UIManager — Initializes and coordinates all UI components.
 */

import type { Viewer } from 'cesium';
import { Toolbar } from './components/toolbar/toolbar';
import { SearchPanel } from './components/panels/search-panel';
import { LayersPanel } from './components/panels/layers-panel';
import { SettingsPanel } from './components/panels/settings-panel';
import { InfoPanel } from './components/panels/info-panel';
import { CoordinatesDisplay } from './components/panels/coordinates-display';
import { FPSCounter } from './components/panels/fps-counter';
import { EventDetailPanel } from './components/panels/event-detail-panel';
import { EventListPanel } from './components/panels/event-list-panel';
import { AnalyticsPanel } from './components/panels/analytics-panel';
import { FilterPanel } from './components/panels/filter-panel';
import { EventTimeline } from './components/panels/event-timeline';
import { initNotificationToast } from './components/notification-toast';
import type { LayerRegistry } from '../layers/layer-registry';
import type { CameraController } from '../core/engine/camera/camera-controller';
import type { SceneManager } from '../core/engine/scene-manager';
import type { GlobeManager } from '../globe/globe-manager';
import type { EarthEventEngine } from '../events/engine/event-engine';
import type { FilterEngine } from '../events/engine/filter-engine';
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
  private infoPanel: InfoPanel;
  private eventDetailPanel: EventDetailPanel;
  private eventListPanel: EventListPanel;
  private analyticsPanel: AnalyticsPanel;
  private filterPanel: FilterPanel;
  private eventTimeline: EventTimeline;
  private coordinatesDisplay: CoordinatesDisplay;
  private fpsCounter: FPSCounter;

  constructor() {
    this.toolbar = new Toolbar();
    this.searchPanel = new SearchPanel();
    this.layersPanel = new LayersPanel();
    this.settingsPanel = new SettingsPanel();
    this.infoPanel = new InfoPanel();
    this.eventDetailPanel = new EventDetailPanel();
    this.eventListPanel = new EventListPanel();
    this.analyticsPanel = new AnalyticsPanel();
    this.filterPanel = new FilterPanel();
    this.eventTimeline = new EventTimeline();
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
    eventEngine?: EarthEventEngine,
    filterEngine?: FilterEngine,
  ): void {
    const overlayId = 'ui-overlay';

    // Initialize toast system
    initNotificationToast();

    // Initialize toolbar
    this.toolbar.init(overlayId, (buttonId: string) => {
      this.handleToolbarClick(buttonId);
    });

    // Initialize core panels
    this.searchPanel.init(overlayId, viewer);
    this.layersPanel.init(overlayId, layerRegistry);
    this.infoPanel.init(overlayId);

    // Initialize v0.3 Earth Event panels
    if (eventEngine) {
      this.eventDetailPanel.init(overlayId, (id) => eventEngine.store.get(id));
      this.eventListPanel.init(overlayId, () => eventEngine.store.getAll());
      this.analyticsPanel.init(overlayId, () => eventEngine.store.getAll());
    }

    if (filterEngine) {
      this.filterPanel.init(overlayId, filterEngine, () => {
        this.eventListPanel.refresh();
      });
    }

    this.eventTimeline.init(overlayId);

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

    log.info('UI Manager initialized with v0.3 Earth Intelligence panels');
  }

  /**
   * Handles toolbar button clicks.
   */
  private handleToolbarClick(buttonId: string): void {
    // Left-side panels (mutually exclusive)
    const leftPanels = [
      this.searchPanel,
      this.layersPanel,
      this.settingsPanel,
      this.eventListPanel,
      this.analyticsPanel,
      this.filterPanel,
    ];

    switch (buttonId) {
      case 'search':
        this.toggleExclusivePanel(this.searchPanel, leftPanels, 'btn-search');
        break;
      case 'layers':
        this.toggleExclusivePanel(this.layersPanel, leftPanels, 'btn-layers');
        break;
      case 'info':
        this.infoPanel.toggle();
        this.toolbar.setActive('btn-info', this.infoPanel.isVisible());
        break;
      case 'analytics':
        this.toggleExclusivePanel(this.analyticsPanel, leftPanels, 'btn-analytics');
        break;
      case 'events-list':
        this.toggleExclusivePanel(this.eventListPanel, leftPanels, 'btn-events-list');
        break;
      case 'filter':
        this.toggleExclusivePanel(this.filterPanel, leftPanels, 'btn-filter');
        break;
      case 'settings':
        this.toggleExclusivePanel(this.settingsPanel, leftPanels, 'btn-settings');
        break;
      case 'coordinates':
        this.coordinatesDisplay.toggle();
        break;
      case 'home':
        break;
      case 'fullscreen':
        break;
    }
  }

  private toggleExclusivePanel(
    target: { isVisible: () => boolean; toggle: () => void },
    allPanels: Array<{ isVisible: () => boolean; toggle: () => void }>,
    buttonId: string,
  ): void {
    allPanels.filter((p) => p !== target).forEach((p) => {
      if (p.isVisible()) p.toggle();
    });
    target.toggle();
    this.toolbar.setActive(buttonId, target.isVisible());
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
    this.infoPanel.dispose();
    this.eventDetailPanel.dispose();
    this.eventListPanel.dispose();
    this.analyticsPanel.dispose();
    this.filterPanel.dispose();
    this.eventTimeline.dispose();
    this.coordinatesDisplay.dispose();
    this.fpsCounter.dispose();
    log.info('UI Manager disposed');
  }
}
