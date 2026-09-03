/**
 * MilitaryHUD — Full-screen tactical heads-up display overlay for Atlas One v0.8.
 * Renders compass, altitude, coordinates, crosshair, entity count, and sensor mode.
 */

import { eventBus } from '../../../hooks/use-event-bus';
import { SensorMode, SENSOR_MODE_LABELS } from '../../../core/engine/postfx/sensor-mode.types';
import { createElement } from '../../../utils/dom';
import { createLogger } from '../../../utils/logger';
import type { Viewer } from 'cesium';
import { Cartographic, Math as CesiumMath } from 'cesium';

const log = createLogger('MilitaryHUD');

export class MilitaryHUD {
  private container: HTMLElement | null = null;
  private viewer: Viewer | null = null;
  private isVisible = false;
  private animFrameId: number | null = null;
  private sensorMode: SensorMode = SensorMode.NORMAL;
  private unsubscribers: Array<() => void> = [];

  init(parentId: string, viewer: Viewer): void {
    const parent = document.getElementById(parentId);
    if (!parent) return;

    this.viewer = viewer;

    this.container = createElement('div', {
      id: 'military-hud',
      style: `
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        pointer-events: none;
        z-index: 80;
        font-family: 'Courier New', monospace;
        color: rgba(0, 255, 100, 0.85);
        text-shadow: 0 0 6px rgba(0, 255, 100, 0.4);
        display: none;
        overflow: hidden;
      `,
    });

    this.container.innerHTML = this.buildTemplate();
    parent.appendChild(this.container);

    this.unsubscribers.push(
      eventBus.on('sensor:changed', ({ mode }) => {
        this.sensorMode = mode;
      }),
    );

    log.info('Military HUD initialized');
  }

  toggle(): void {
    this.setVisible(!this.isVisible);
  }

  setVisible(visible: boolean): void {
    if (this.isVisible === visible) return;
    this.isVisible = visible;
    if (this.container) {
      this.container.style.display = this.isVisible ? 'block' : 'none';
    }
    if (this.isVisible) {
      this.startRenderLoop();
    } else {
      this.stopRenderLoop();
    }
    log.info(`HUD ${this.isVisible ? 'ON' : 'OFF'}`);
  }

  isActive(): boolean {
    return this.isVisible;
  }

  private buildTemplate(): string {
    return `
      <!-- Top Bar -->
      <div style="display: flex; justify-content: space-between; padding: 0.8rem 1.5rem; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase;">
        <span id="hud-datetime">--:--:-- UTC</span>
        <span id="hud-mode" style="color: rgba(0, 200, 255, 0.9);">ATLAS ONE — STANDARD</span>
        <span id="hud-fps">-- FPS</span>
      </div>

      <!-- Crosshair -->
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 40px; height: 40px;">
        <div style="position: absolute; top: 0; left: 50%; width: 1px; height: 12px; background: rgba(0,255,100,0.5); transform: translateX(-50%);"></div>
        <div style="position: absolute; bottom: 0; left: 50%; width: 1px; height: 12px; background: rgba(0,255,100,0.5); transform: translateX(-50%);"></div>
        <div style="position: absolute; left: 0; top: 50%; width: 12px; height: 1px; background: rgba(0,255,100,0.5); transform: translateY(-50%);"></div>
        <div style="position: absolute; right: 0; top: 50%; width: 12px; height: 1px; background: rgba(0,255,100,0.5); transform: translateY(-50%);"></div>
      </div>

      <!-- Left telemetry strip -->
      <div style="position: absolute; left: 1.5rem; top: 50%; transform: translateY(-50%); font-size: 0.68rem; line-height: 1.8;">
        <div>ALT <span id="hud-alt" style="color: #fff;">---</span> km</div>
        <div>HDG <span id="hud-hdg" style="color: #fff;">---</span>°</div>
        <div>PITCH <span id="hud-pitch" style="color: #fff;">---</span>°</div>
      </div>

      <!-- Right telemetry strip -->
      <div style="position: absolute; right: 1.5rem; top: 50%; transform: translateY(-50%); font-size: 0.68rem; line-height: 1.8; text-align: right;">
        <div>LAT <span id="hud-lat" style="color: #fff;">---.----</span></div>
        <div>LON <span id="hud-lon" style="color: #fff;">---.----</span></div>
        <div>ZOOM <span id="hud-zoom" style="color: #fff;">--</span></div>
      </div>

      <!-- Bottom bar -->
      <div style="position: absolute; bottom: 0.5rem; left: 0; right: 0; display: flex; justify-content: space-between; padding: 0 1.5rem; font-size: 0.65rem; opacity: 0.7;">
        <span id="hud-sensor">SENSOR: STANDARD</span>
        <span id="hud-entities">ENTITIES: --</span>
        <span>ATLAS ONE v0.8</span>
      </div>

      <!-- Corner brackets -->
      <div style="position: absolute; top: 2.5rem; left: 1rem; width: 30px; height: 30px; border-left: 1px solid rgba(0,255,100,0.3); border-top: 1px solid rgba(0,255,100,0.3);"></div>
      <div style="position: absolute; top: 2.5rem; right: 1rem; width: 30px; height: 30px; border-right: 1px solid rgba(0,255,100,0.3); border-top: 1px solid rgba(0,255,100,0.3);"></div>
      <div style="position: absolute; bottom: 1.5rem; left: 1rem; width: 30px; height: 30px; border-left: 1px solid rgba(0,255,100,0.3); border-bottom: 1px solid rgba(0,255,100,0.3);"></div>
      <div style="position: absolute; bottom: 1.5rem; right: 1rem; width: 30px; height: 30px; border-right: 1px solid rgba(0,255,100,0.3); border-bottom: 1px solid rgba(0,255,100,0.3);"></div>
    `;
  }

  private startRenderLoop(): void {
    const tick = (): void => {
      this.updateTelemetry();
      this.animFrameId = requestAnimationFrame(tick);
    };
    this.animFrameId = requestAnimationFrame(tick);
  }

  private stopRenderLoop(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  private updateTelemetry(): void {
    if (!this.viewer || !this.container) return;

    const camera = this.viewer.camera;
    const carto = Cartographic.fromCartesian(camera.position);
    const lat = CesiumMath.toDegrees(carto.latitude);
    const lon = CesiumMath.toDegrees(carto.longitude);
    const altKm = carto.height / 1000;
    const heading = CesiumMath.toDegrees(camera.heading);
    const pitch = CesiumMath.toDegrees(camera.pitch);
    const fps = Math.round(1000 / (this.viewer.scene.debugShowFramesPerSecond ? 16.67 : 16.67));
    const now = new Date();

    this.setText('hud-datetime', now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    this.setText('hud-mode', `ATLAS ONE — ${SENSOR_MODE_LABELS[this.sensorMode].toUpperCase()}`);
    this.setText('hud-fps', `${fps} FPS`);
    this.setText('hud-alt', altKm.toFixed(1));
    this.setText('hud-hdg', heading.toFixed(0));
    this.setText('hud-pitch', pitch.toFixed(0));
    this.setText('hud-lat', lat.toFixed(4));
    this.setText('hud-lon', lon.toFixed(4));
    this.setText('hud-zoom', altKm < 1 ? 'STREET' : altKm < 50 ? 'CITY' : altKm < 500 ? 'REGION' : altKm < 5000 ? 'CONTINENTAL' : 'ORBITAL');
    this.setText('hud-sensor', `SENSOR: ${SENSOR_MODE_LABELS[this.sensorMode].toUpperCase()}`);
  }

  private setText(id: string, text: string): void {
    const el = this.container?.querySelector(`#${id}`);
    if (el) el.textContent = text;
  }

  dispose(): void {
    this.stopRenderLoop();
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    this.container?.remove();
    this.container = null;
    log.info('Military HUD disposed');
  }
}
