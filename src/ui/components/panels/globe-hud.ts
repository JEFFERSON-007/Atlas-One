/**
 * GlobeHUD — Bottom-right HUD overlay displaying real-time Globe telemetry:
 * Latitude, Longitude, Elevation (m), Camera altitude (km), LOD Level, Active Layers,
 * Data Status, and Terrain Exaggeration controls (0.5x, 1x, 2x, 5x, 10x).
 */

import { eventBus } from '../../../hooks/use-event-bus';
import type { TerrainIntelligence, ExaggerationLevel } from '../../../twin/terrain/terrain-intelligence';
import { createLogger } from '../../../utils/logger';
import { querySelectorSafe, createElement } from '../../../utils/dom';

const log = createLogger('GlobeHUD');

export class GlobeHUD {
  private container: HTMLElement | null = null;
  private terrainIntel: TerrainIntelligence | null = null;
  private unsubscribers: Array<() => void> = [];

  private currentLat = 0;
  private currentLng = 0;
  private currentElev = 0;
  private currentLOD = 'Space';
  private cameraHeightKm = 10000;
  private exaggeration: ExaggerationLevel = 1.0;

  init(parentId: string, terrainIntel?: TerrainIntelligence): void {
    const parent = querySelectorSafe(`#${parentId}`);
    if (!parent) return;

    this.terrainIntel = terrainIntel ?? null;

    this.container = createElement('div', {
      id: 'globe-hud',
      style: `
        position: absolute;
        bottom: 1rem;
        right: 1rem;
        background: rgba(10, 14, 23, 0.85);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 0.6rem 0.85rem;
        color: #e2e8f0;
        font-family: Inter, monospace, sans-serif;
        font-size: 0.78rem;
        z-index: 100;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        display: flex;
        flex-direction: column;
        gap: 0.3rem;
        pointer-events: auto;
      `,
    });

    parent.appendChild(this.container);

    // Subscribe to terrain hover
    this.unsubscribers.push(
      eventBus.on('terrain:hover', (data) => {
        this.currentLat = data.latitude;
        this.currentLng = data.longitude;
        this.currentElev = data.elevationMeters;
        this.render();
      }),
    );

    // Subscribe to LOD change
    this.unsubscribers.push(
      eventBus.on('lod:changed', (data) => {
        this.currentLOD = data.level.toUpperCase();
        this.cameraHeightKm = data.cameraHeightKm;
        this.render();
      }),
    );

    this.render();
    log.info('Globe HUD initialized');
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.08); padding-bottom: 0.3rem; margin-bottom: 0.2rem;">
        <span style="font-weight: 600; color: #38bdf8; letter-spacing: 0.05em;">ATLAS ONE HUD</span>
        <span style="font-size: 0.7rem; color: #34d399; background: rgba(52,211,153,0.1); padding: 1px 6px; border-radius: 4px;">● ONLINE</span>
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem; font-family: monospace;">
        <div>LAT: <b>${this.currentLat >= 0 ? '+' : ''}${this.currentLat.toFixed(4)}°</b></div>
        <div>LON: <b>${this.currentLng >= 0 ? '+' : ''}${this.currentLng.toFixed(4)}°</b></div>
        <div>ELEV: <b>${this.currentElev.toFixed(0)} m</b></div>
        <div>ALT: <b>${this.cameraHeightKm.toFixed(0)} km</b></div>
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.2rem; font-size: 0.72rem;">
        <span style="color: var(--color-text-muted);">VIEW: <b style="color: #fbbf24;">${this.currentLOD}</b></span>
        <span style="color: var(--color-text-muted);">TERRAIN:</span>
        <div style="display: flex; gap: 2px;">
          ${([0.5, 1.0, 2.0, 5.0, 10.0] as ExaggerationLevel[])
            .map(
              (ex) => `
                <button class="hud-exaggeration-btn" data-ex="${ex}" style="
                  padding: 1px 4px;
                  font-size: 0.65rem;
                  border-radius: 3px;
                  border: 1px solid ${this.exaggeration === ex ? '#38bdf8' : 'rgba(255,255,255,0.1)'};
                  background: ${this.exaggeration === ex ? '#38bdf822' : 'transparent'};
                  color: ${this.exaggeration === ex ? '#38bdf8' : '#94a3b8'};
                  cursor: pointer;
                ">${ex}x</button>
              `,
            )
            .join('')}
        </div>
      </div>
    `;

    const btns = this.container.querySelectorAll('.hud-exaggeration-btn');
    btns.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const val = parseFloat((e.currentTarget as HTMLElement).getAttribute('data-ex') || '1.0') as ExaggerationLevel;
        this.exaggeration = val;
        this.terrainIntel?.setExaggeration(val);
        this.render();
      });
    });
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    this.container?.remove();
    this.container = null;
    log.info('Globe HUD disposed');
  }
}
