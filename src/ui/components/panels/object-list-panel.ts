/**
 * ObjectListPanel — Filterable list panel showing all active dynamic objects.
 */

import { eventBus } from '../../../hooks/use-event-bus';
import type { DynamicObject } from '../../../mobility/dynamic-object.types';
import { OBJECT_TYPE_ICONS } from '../../../mobility/dynamic-object.types';
import { createLogger } from '../../../utils/logger';
import { querySelectorSafe, createElement } from '../../../utils/dom';

const log = createLogger('ObjectListPanel');

export class ObjectListPanel {
  private container: HTMLElement | null = null;
  private visible = false;
  private unsubscribers: Array<() => void> = [];
  private getObjects: (() => DynamicObject[]) | null = null;
  private filterType = 'all';

  init(parentId: string, getObjects: () => DynamicObject[]): void {
    const parent = querySelectorSafe(`#${parentId}`);
    if (!parent) return;

    this.getObjects = getObjects;

    this.container = createElement('div', {
      id: 'object-list-panel',
      class: 'ao-panel ao-panel--left',
    });
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.unsubscribers.push(
      eventBus.on('objects:updated', () => {
        if (this.visible) this.render();
      }),
    );

    log.info('Object list panel initialized');
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

    const allObjects = this.getObjects();
    const filtered = this.filterType === 'all'
      ? allObjects
      : allObjects.filter((o) => (o.type as string) === this.filterType);

    const sorted = [...filtered].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    this.container.innerHTML = `
      <div class="ao-panel-header">
        <div class="ao-panel-title">
          <span>🛰️</span>
          <span>Dynamic Objects (${sorted.length})</span>
        </div>
        <button id="btn-close-object-list" class="ao-panel-close">&times;</button>
      </div>

      <div class="ao-panel-body" style="padding: 0.75rem;">
        <div style="margin-bottom: 0.75rem; display: flex; gap: 0.25rem; flex-wrap: wrap;">
          ${['all', 'aircraft', 'ship', 'satellite', 'iss', 'starlink', 'gps']
            .map(
              (t) => `
                <button class="ao-btn ao-btn--small ${this.filterType === t ? 'ao-btn--primary' : 'ao-btn--secondary'}" data-type="${t}">
                  ${t.toUpperCase()}
                </button>
              `,
            )
            .join('')}
        </div>

        <div style="overflow-y: auto; max-height: calc(100vh - 180px);">
          ${
            sorted.length === 0
              ? '<div style="color: var(--color-text-muted); text-align: center; padding: 2rem;">No dynamic objects found</div>'
              : sorted.slice(0, 100).map((obj) => this.renderObjectRow(obj)).join('')
          }
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private renderObjectRow(obj: DynamicObject): string {
    const icon = OBJECT_TYPE_ICONS[obj.type] || '📌';
    const altKm = (obj.altitude / 1000).toFixed(0);
    const speedKmh = (obj.speed * 3.6).toFixed(0);

    return `
      <div class="ao-event-card" data-obj-id="${obj.id}" style="cursor: pointer; padding: 0.6rem 0.75rem; margin-bottom: 0.5rem; border-radius: 6px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600; font-size: 0.88rem; display: flex; align-items: center; gap: 0.4rem;">
            <span>${icon}</span>
            <span>${obj.label || obj.id}</span>
          </div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.2rem;">
            ${obj.country ? `${obj.country} • ` : ''}${altKm} km • ${speedKmh} km/h
          </div>
        </div>
        <span class="ao-badge" style="background: ${obj.color}22; color: ${obj.color};">
          ${obj.type}
        </span>
      </div>
    `;
  }

  private attachEvents(): void {
    const closeBtn = querySelectorSafe('#btn-close-object-list');
    closeBtn?.addEventListener('click', () => this.hide());

    const typeBtns = this.container?.querySelectorAll('[data-type]');
    typeBtns?.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.filterType = (e.currentTarget as HTMLElement).getAttribute('data-type') || 'all';
        this.render();
      });
    });

    const rows = this.container?.querySelectorAll('[data-obj-id]');
    rows?.forEach((row) => {
      row.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-obj-id');
        if (id) {
          eventBus.emit('object:select', { objectId: id });
        }
      });
    });
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.container?.remove();
    this.container = null;
    log.info('Object list panel disposed');
  }
}
