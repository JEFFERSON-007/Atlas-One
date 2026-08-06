/**
 * MobilityAnalyticsPanel — Dashboard panel for global mobility statistics.
 * Shows aircraft online, ships online, satellites online, ISS status, Starlink count, and average speeds.
 */

import { eventBus } from '../../../hooks/use-event-bus';
import type { DynamicObject } from '../../../mobility/dynamic-object.types';
import { ObjectType } from '../../../mobility/dynamic-object.types';
import { createLogger } from '../../../utils/logger';
import { querySelectorSafe, createElement } from '../../../utils/dom';

const log = createLogger('MobilityAnalyticsPanel');

export class MobilityAnalyticsPanel {
  private container: HTMLElement | null = null;
  private visible = false;
  private unsubscribers: Array<() => void> = [];
  private getObjects: (() => DynamicObject[]) | null = null;

  init(parentId: string, getObjects: () => DynamicObject[]): void {
    const parent = querySelectorSafe(`#${parentId}`);
    if (!parent) return;

    this.getObjects = getObjects;

    this.container = createElement('div', {
      id: 'mobility-analytics-panel',
      class: 'ao-panel ao-panel--left',
    });
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.unsubscribers.push(
      eventBus.on('objects:updated', () => {
        if (this.visible) this.render();
      }),
    );

    log.info('Mobility analytics panel initialized');
  }

  toggle(): void {
    if (this.visible) this.hide();
    else this.show();
  }

  show(): void {
    this.visible = true;
    if (this.container) {
      this.render();
      this.container.style.display = 'block';
    }
  }

  hide(): void {
    this.visible = false;
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  private render(): void {
    if (!this.container || !this.getObjects) return;

    const objects = this.getObjects();

    let aircraftCount = 0;
    let shipCount = 0;
    let satCount = 0;
    let issObj: DynamicObject | null = null;
    let starlinkCount = 0;
    let gpsCount = 0;
    let totalAircraftSpeed = 0;
    let totalShipSpeed = 0;

    for (const obj of objects) {
      switch (obj.type) {
        case ObjectType.Aircraft:
          aircraftCount++;
          totalAircraftSpeed += obj.speed;
          break;
        case ObjectType.Ship:
          shipCount++;
          totalShipSpeed += obj.speed;
          break;
        case ObjectType.Satellite:
          satCount++;
          break;
        case ObjectType.ISS:
          issObj = obj;
          break;
        case ObjectType.Starlink:
          starlinkCount++;
          break;
        case ObjectType.GPS:
        case ObjectType.GLONASS:
        case ObjectType.Galileo:
        case ObjectType.BeiDou:
          gpsCount++;
          break;
      }
    }

    const avgAircraftSpeedKmh = aircraftCount > 0 ? ((totalAircraftSpeed / aircraftCount) * 3.6).toFixed(0) : '0';
    const avgShipSpeedKnots = shipCount > 0 ? ((totalShipSpeed / shipCount) / 0.514444).toFixed(1) : '0';

    this.container.innerHTML = `
      <div class="ao-panel-header">
        <div class="ao-panel-title">
          <span>📊</span>
          <span>Mobility & Space Intelligence</span>
        </div>
        <button id="btn-close-mobility-analytics" class="ao-panel-close">&times;</button>
      </div>

      <div class="ao-panel-body" style="padding: 1rem; overflow-y: auto; max-height: calc(100vh - 120px);">
        <!-- Metric Cards Grid -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; margin-bottom: 1rem;">
          <div style="background: rgba(96,165,250,0.1); border: 1px solid rgba(96,165,250,0.2); padding: 0.85rem; border-radius: 8px;">
            <div style="font-size: 0.75rem; color: #60a5fa; font-weight: 600; text-transform: uppercase;">✈️ Aircraft Online</div>
            <div style="font-size: 1.6rem; font-weight: 700; color: #fff; margin-top: 0.25rem;">${aircraftCount.toLocaleString()}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.2rem;">Avg Speed: ${avgAircraftSpeedKmh} km/h</div>
          </div>

          <div style="background: rgba(52,211,153,0.1); border: 1px solid rgba(52,211,153,0.2); padding: 0.85rem; border-radius: 8px;">
            <div style="font-size: 0.75rem; color: #34d399; font-weight: 600; text-transform: uppercase;">🚢 Ships Online</div>
            <div style="font-size: 1.6rem; font-weight: 700; color: #fff; margin-top: 0.25rem;">${shipCount.toLocaleString()}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.2rem;">Avg Speed: ${avgShipSpeedKnots} kts</div>
          </div>

          <div style="background: rgba(167,139,250,0.1); border: 1px solid rgba(167,139,250,0.2); padding: 0.85rem; border-radius: 8px;">
            <div style="font-size: 0.75rem; color: #a78bfa; font-weight: 600; text-transform: uppercase;">🛰️ Satellites Tracked</div>
            <div style="font-size: 1.6rem; font-weight: 700; color: #fff; margin-top: 0.25rem;">${satCount.toLocaleString()}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.2rem;">LEO, MEO, GEO</div>
          </div>

          <div style="background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.2); padding: 0.85rem; border-radius: 8px;">
            <div style="font-size: 0.75rem; color: #fbbf24; font-weight: 600; text-transform: uppercase;">⭐ Starlink Satellites</div>
            <div style="font-size: 1.6rem; font-weight: 700; color: #fff; margin-top: 0.25rem;">${starlinkCount.toLocaleString()}</div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.2rem;">Constellation</div>
          </div>
        </div>

        <!-- ISS Live Status Banner -->
        <div style="background: rgba(251,191,36,0.08); border: 1px solid rgba(251,191,36,0.3); padding: 0.85rem; border-radius: 8px; margin-bottom: 1rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-weight: 600; color: #fbbf24;">🏠 International Space Station</span>
            <span class="ao-badge ao-badge--info">${issObj ? 'LIVE' : 'OFFLINE'}</span>
          </div>
          ${
            issObj
              ? `
                <div style="font-size: 0.82rem; color: var(--color-text-muted); display: grid; grid-template-columns: 1fr 1fr; gap: 0.4rem;">
                  <div>Position: <b style="color: #fff;">${issObj.latitude.toFixed(2)}°, ${issObj.longitude.toFixed(2)}°</b></div>
                  <div>Altitude: <b style="color: #fff;">${(issObj.altitude / 1000).toFixed(0)} km</b></div>
                  <div>Speed: <b style="color: #fff;">${(issObj.speed * 3.6).toFixed(0)} km/h</b></div>
                  <div>GNSS Satellites: <b style="color: #fff;">${gpsCount}</b></div>
                </div>
              `
              : '<div style="font-size: 0.8rem; color: var(--color-text-muted);">Connecting to ISS telemetry...</div>'
          }
        </div>

        <div style="font-size: 0.75rem; color: var(--color-text-muted); text-align: center; margin-top: 1rem;">
          Data sources: OpenSky Network • CelesTrak SGP4 • WhereTheISS • AIS Shipping Lanes
        </div>
      </div>
    `;

    const closeBtn = querySelectorSafe('#btn-close-mobility-analytics');
    closeBtn?.addEventListener('click', () => this.hide());
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.container?.remove();
    this.container = null;
    log.info('Mobility analytics panel disposed');
  }
}
