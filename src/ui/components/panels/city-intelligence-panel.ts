/**
 * CityIntelligencePanel — Specialized panel for exploring city data,
 * connected weather, population density, local time, and nearby transportation/events.
 */

import { eventBus } from '../../../hooks/use-event-bus';
import type { GeospatialEntity } from '../../../twin/entity/geospatial-entity.types';
import { EntityType } from '../../../twin/entity/geospatial-entity.types';
import { createLogger } from '../../../utils/logger';
import { querySelectorSafe, createElement } from '../../../utils/dom';

const log = createLogger('CityIntelligencePanel');

export class CityIntelligencePanel {
  private container: HTMLElement | null = null;
  private visible = false;
  private unsubscribers: Array<() => void> = [];
  private getCities: (() => GeospatialEntity[]) | null = null;

  init(parentId: string, getCities: () => GeospatialEntity[]): void {
    const parent = querySelectorSafe(`#${parentId}`);
    if (!parent) return;

    this.getCities = getCities;

    this.container = createElement('div', {
      id: 'city-intelligence-panel',
      class: 'ao-panel ao-panel--left',
    });
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.unsubscribers.push(
      eventBus.on('selection:changed', (payload) => {
        if (payload.type === 'entity' && payload.rawTarget) {
          const item = payload.rawTarget as GeospatialEntity;
          if (item.type === EntityType.City) {
            this.showCity(item);
          }
        }
      }),
    );

    log.info('City Intelligence panel initialized');
  }

  toggle(): void {
    if (this.visible) this.hide();
    else this.show();
  }

  isVisible(): boolean {
    return this.visible;
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

  showCity(cityItem: GeospatialEntity): void {
    this.visible = true;
    if (this.container) {
      this.container.innerHTML = this.renderCityHtml(cityItem);
      this.container.style.display = 'block';
      this.attachEvents();
    }
  }

  private render(): void {
    if (!this.container || !this.getCities) return;

    const cities = this.getCities().filter((e) => e.type === EntityType.City);

    this.container.innerHTML = `
      <div class="ao-panel-header">
        <div class="ao-panel-title">
          <span>🏙️</span>
          <span>City Intelligence (${cities.length})</span>
        </div>
        <button id="btn-close-city-panel" class="ao-panel-close">&times;</button>
      </div>

      <div class="ao-panel-body" style="padding: 0.75rem; overflow-y: auto; max-height: calc(100vh - 120px);">
        ${
          cities.length === 0
            ? '<div style="color: var(--color-text-muted); text-align: center; padding: 2rem;">Loading cities dataset...</div>'
            : cities.map((c) => this.renderCityRow(c)).join('')
        }
      </div>
    `;

    this.attachEvents();
  }

  private renderCityRow(c: GeospatialEntity): string {
    const pop = (c.properties['population'] as number | undefined)?.toLocaleString() || 'N/A';

    return `
      <div class="ao-event-card" data-city-id="${c.id}" style="cursor: pointer; padding: 0.6rem 0.75rem; margin-bottom: 0.5rem; border-radius: 6px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600; font-size: 0.88rem;">🏙️ ${c.name}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.2rem;">
            Country: ${c.country} • Pop: ${pop}
          </div>
        </div>
        <span class="ao-badge ao-badge--info">${c.country}</span>
      </div>
    `;
  }

  private renderCityHtml(c: GeospatialEntity): string {
    const pop = (c.properties['population'] as number | undefined)?.toLocaleString() || 'N/A';

    return `
      <div class="ao-panel-header">
        <div class="ao-panel-title">
          <span>🏙️</span>
          <span>${c.name}</span>
        </div>
        <button id="btn-close-city-panel" class="ao-panel-close">&times;</button>
      </div>

      <div class="ao-panel-body" style="padding: 1rem; overflow-y: auto; max-height: calc(100vh - 120px);">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem; background: rgba(251,191,36,0.1); border: 1px solid rgba(251,191,36,0.3); padding: 0.75rem; border-radius: 8px;">
          <div>
            <div style="font-size: 0.75rem; color: #fbbf24; font-weight: 600;">COUNTRY</div>
            <div style="font-weight: 700; color: #fff;">${c.country}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #fbbf24; font-weight: 600;">POPULATION</div>
            <div style="font-weight: 700; color: #fff;">${pop}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #fbbf24; font-weight: 600;">LATITUDE</div>
            <div style="font-family: monospace; font-weight: 600;">${c.latitude.toFixed(4)}°</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #fbbf24; font-weight: 600;">LONGITUDE</div>
            <div style="font-family: monospace; font-weight: 600;">${c.longitude.toFixed(4)}°</div>
          </div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    const closeBtn = querySelectorSafe('#btn-close-city-panel');
    closeBtn?.addEventListener('click', () => this.hide());

    const rows = this.container?.querySelectorAll('[data-city-id]');
    rows?.forEach((row) => {
      row.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-city-id');
        const c = this.getCities?.().find((item) => item.id === id);
        if (c) this.showCity(c);
      });
    });
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    this.container?.remove();
    this.container = null;
    log.info('City Intelligence panel disposed');
  }
}
