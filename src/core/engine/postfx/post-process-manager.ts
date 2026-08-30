/**
 * PostProcessManager — Manages CesiumJS post-processing pipeline for sensor modes.
 * Applies GLSL fragment shaders to transform the rendered scene.
 */

import {
  PostProcessStage,
  type Viewer,
} from 'cesium';
import { SensorMode } from './sensor-mode.types';
import {
  NVG_FRAGMENT,
  FLIR_FRAGMENT,
  CRT_FRAGMENT,
  NOIR_FRAGMENT,
  SNOW_FRAGMENT,
  TACTICAL_FRAGMENT,
} from './shaders/sensor-shaders';
import { eventBus } from '../../../hooks/use-event-bus';
import { createLogger } from '../../../utils/logger';

const log = createLogger('PostProcessManager');

const SHADER_MAP: Record<string, string> = {
  [SensorMode.NVG]: NVG_FRAGMENT,
  [SensorMode.FLIR]: FLIR_FRAGMENT,
  [SensorMode.CRT]: CRT_FRAGMENT,
  [SensorMode.NOIR]: NOIR_FRAGMENT,
  [SensorMode.SNOW]: SNOW_FRAGMENT,
  [SensorMode.TACTICAL]: TACTICAL_FRAGMENT,
};

export class PostProcessManager {
  private viewer: Viewer | null = null;
  private activeStage: PostProcessStage | null = null;
  private currentMode: SensorMode = SensorMode.NORMAL;
  private animationFrameId: number | null = null;
  private startTime = Date.now();

  init(viewer: Viewer): void {
    this.viewer = viewer;
    this.startTime = Date.now();
    this.startTimeUniform();
    log.info('Post-process pipeline initialized');
  }

  /** Returns the current active sensor mode. */
  getMode(): SensorMode {
    return this.currentMode;
  }

  /** Switches the active post-processing shader. */
  setMode(mode: SensorMode): void {
    if (!this.viewer) return;
    if (mode === this.currentMode) return;

    // Remove existing stage
    this.removeActiveStage();

    this.currentMode = mode;

    if (mode === SensorMode.NORMAL) {
      log.info('Sensor mode: NORMAL (no post-processing)');
      eventBus.emit('sensor:changed', { mode });
      return;
    }

    const fragmentShader = SHADER_MAP[mode];
    if (!fragmentShader) {
      log.warn(`Unknown sensor mode: ${mode}`);
      return;
    }

    const uniforms: Record<string, unknown> = {};

    // Time-dependent shaders need a `time` uniform
    if ([SensorMode.NVG, SensorMode.CRT, SensorMode.SNOW].includes(mode)) {
      uniforms['time'] = () => (Date.now() - this.startTime) / 1000.0;
    }

    this.activeStage = new PostProcessStage({
      fragmentShader,
      uniforms,
    });

    this.viewer.scene.postProcessStages.add(this.activeStage);
    log.info(`Sensor mode: ${mode}`);
    eventBus.emit('sensor:changed', { mode });
  }

  /** Cycles to the next sensor mode. */
  cycleMode(): SensorMode {
    const modes = Object.values(SensorMode);
    const currentIndex = modes.indexOf(this.currentMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    const next = modes[nextIndex];
    this.setMode(next);
    return next;
  }

  private removeActiveStage(): void {
    if (this.activeStage && this.viewer) {
      this.viewer.scene.postProcessStages.remove(this.activeStage);
      this.activeStage = null;
    }
  }

  /**
   * Keeps time uniform ticking for animated shaders.
   * Uses requestAnimationFrame for smooth updates.
   */
  private startTimeUniform(): void {
    const tick = (): void => {
      this.animationFrameId = requestAnimationFrame(tick);
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }

  dispose(): void {
    this.removeActiveStage();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.viewer = null;
    log.info('Post-process pipeline disposed');
  }
}
