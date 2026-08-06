/**
 * ObjectDetailPanel — Detail inspection panel for selected dynamic objects (aircraft, ships, satellites, ISS).
 * Opens when an object is clicked. Shows full telemetry, heading, altitude, speed, country, follow object mode.
 */

import { eventBus } from '../../../hooks/use-event-bus';
import type { DynamicObject } from '../../../mobility/dynamic-object.types';
import { OBJECT_TYPE_ICONS } from '../../../mobility/dynamic-object.types';
import { createLogger } from '../../../utils/logger';
import { querySelectorSafe, createElement } from '../../../utils/dom';

const log = createLogger('ObjectDetailPanel');

export class ObjectDetailPanel {
  private container: HTMLElement | null = null;
  private visible = false;
  private currentObject: DynamicObject | null = null;
  private unsubscribers: Array<() => void> = [];
  private getObjectById: ((id: string) => DynamicObject | undefined) | null = null;

  init(parentId: string, objectLookup: (id: string) => DynamicObject | undefined): void {
    const parent = querySelectorSafe(`#${parentId}`);
    if (!parent) return;

    this.getObjectById = objectLookup;

    this.container = createElement('div', {
      id: 'object-detail-panel',
      class: 'ao-panel ao-panel--right ao-event-detail-panel',
    });
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.unsubscribers.push(
      eventBus.on('object:select', (payload) => {
        const obj = this.getObjectById?.(payload.objectId);
        if (obj) {
          this.showObject(obj);
        }
      }),
    );

    this.unsubscribers.push(
      eventBus.on('object:deselect', () => {
        this.hide();
      }),
    );

    log.info('Object detail panel initialized');
  }

  showObject(obj: DynamicObject): void {
    this.currentObject = obj;
    this.visible = true;

    if (this.container) {
      this.container.innerHTML = this.renderHtml(obj);
      this.container.style.display = 'block';
      this.attachEvents();
    }

    // Fly camera to object
    eventBus.emit('camera:flyTo', {
      lat: obj.latitude,
      lng: obj.longitude,
      altitude: Math.max(obj.altitude * 2, 50_000),
    });
  }

  hide(): void {
    this.visible = false;
    this.currentObject = null;
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  private renderHtml(obj: DynamicObject): string {
    const icon = OBJECT_TYPE_ICONS[obj.type] || '📌';
    const altKm = (obj.altitude / 1000).toFixed(1);
    const speedKmh = (obj.speed * 3.6).toFixed(0);
    const speedKnots = (obj.speed / 0.514444).toFixed(0);

    const metadataRows = Object.entries(obj.metadata)
      .filter(([, v]) => v !== null && v !== undefined && typeof v !== 'object')
      .map(
        ([k, v]) => `
          <div class="ao-detail-row">
            <span class="ao-detail-key">${k}</span>
            <span class="ao-detail-value">${String(v)}</span>
          </div>
        `,
      )
      .join('');

    return `
      <div class="ao-panel-header">
        <div class="ao-panel-title">
          <span style="font-size: 1.25rem;">${icon}</span>
          <span>${obj.label || obj.id}</span>
        </div>
        <button id="btn-close-object-detail" class="ao-panel-close" title="Close">&times;</button>
      </div>

      <div class="ao-panel-body" style="padding: 1rem; overflow-y: auto; max-height: calc(100vh - 120px);">
        <div style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
          <span class="ao-badge" style="background: ${obj.color}22; color: ${obj.color}; border: 1px solid ${obj.color}44;">
            ${obj.type.toUpperCase()}
          </span>
          <span class="ao-badge ao-badge--info">${obj.status.toUpperCase()}</span>
          ${obj.country ? `<span class="ao-badge ao-badge--neutral">🚩 ${obj.country}</span>` : ''}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem; background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: 6px;">
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">LATITUDE</div>
            <div style="font-family: monospace; font-weight: 600;">${obj.latitude.toFixed(4)}°</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">LONGITUDE</div>
            <div style="font-family: monospace; font-weight: 600;">${obj.longitude.toFixed(4)}°</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">ALTITUDE</div>
            <div style="font-weight: 600;">${altKm} km</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: var(--color-text-muted);">HEADING / SPEED</div>
            <div style="font-weight: 600;">${obj.heading.toFixed(0)}° / ${speedKmh} km/h (${speedKnots} kts)</div>
          </div>
        </div>

        <div style="margin-bottom: 1rem;">
          <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); margin-bottom: 0.5rem; text-transform: uppercase;">
            Telemetry & Metadata
          </div>
          ${metadataRows || '<div style="color: var(--color-text-muted); font-size: 0.85rem;">No additional metadata</div>'}
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 1rem;">
          <button id="btn-copy-obj-coords" class="ao-btn ao-btn--secondary" style="flex: 1;">
            📋 Copy Position
          </button>
          <button id="btn-focus-obj" class="ao-btn ao-btn--primary" style="flex: 1;">
            🎯 Center Camera
          </button>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    const closeBtn = querySelectorSafe('#btn-close-object-detail');
    closeBtn?.addEventListener('click', () => this.hide());

    const copyBtn = querySelectorSafe('#btn-copy-obj-coords');
    copyBtn?.addEventListener('click', () => {
      if (this.currentObject) {
        const text = `${this.currentObject.latitude.toFixed(6)}, ${this.currentObject.longitude.toFixed(6)}`;
        void navigator.clipboard.writeText(text);
        eventBus.emit('notification:show', {
          message: `Coordinates copied: ${text}`,
          type: 'info',
        });
      }
    });

    const focusBtn = querySelectorSafe('#btn-focus-obj');
    focusBtn?.addEventListener('click', () => {
      if (this.currentObject) {
        eventBus.emit('camera:flyTo', {
          lat: this.currentObject.latitude,
          lng: this.currentObject.longitude,
          altitude: Math.max(this.currentObject.altitude * 2, 50_000),
        });
      }
    });
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.container?.remove();
    this.container = null;
    log.info('Object detail panel disposed');
  }
}
