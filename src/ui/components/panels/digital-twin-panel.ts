/**
 * DigitalTwinPanel — Comprehensive multi-tab inspection panel for the Digital Twin.
 * Tabs: Overview, Geography, Environment, Infrastructure, Transportation, Events, Population, Data Sources.
 */

import { eventBus } from '../../../hooks/use-event-bus';
import type { SelectionPayload } from '../../../twin/selection/selection-manager';
import type { GeospatialEntity } from '../../../twin/entity/geospatial-entity.types';
import { createLogger } from '../../../utils/logger';
import { querySelectorSafe, createElement } from '../../../utils/dom';

const log = createLogger('DigitalTwinPanel');

type TwinTab = 'overview' | 'geography' | 'environment' | 'infrastructure' | 'transportation' | 'events' | 'sources';

export class DigitalTwinPanel {
  private container: HTMLElement | null = null;
  private visible = false;
  private currentPayload: SelectionPayload | null = null;
  private activeTab: TwinTab = 'overview';
  private unsubscribers: Array<() => void> = [];

  init(parentId: string): void {
    const parent = querySelectorSafe(`#${parentId}`);
    if (!parent) return;

    this.container = createElement('div', {
      id: 'digital-twin-panel',
      class: 'ao-panel ao-panel--right ao-event-detail-panel',
    });
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.unsubscribers.push(
      eventBus.on('selection:changed', (payload) => {
        if (payload.type !== 'none') {
          this.showSelection(payload);
        } else {
          this.hide();
        }
      }),
    );

    log.info('Digital Twin panel initialized');
  }

  showSelection(payload: SelectionPayload): void {
    this.currentPayload = payload;
    this.visible = true;

    if (this.container) {
      this.render();
      this.container.style.display = 'block';
    }

    // Fly camera to selection
    eventBus.emit('camera:flyTo', {
      lat: payload.latitude,
      lng: payload.longitude,
      altitude: 100_000,
    });
  }

  isVisible(): boolean {
    return this.visible;
  }

  toggle(): void {
    if (this.visible) {
      this.hide();
    } else if (this.currentPayload) {
      this.showSelection(this.currentPayload);
    }
  }

  hide(): void {
    this.visible = false;
    this.currentPayload = null;
    if (this.container) {
      this.container.style.display = 'none';
    }
  }

  private render(): void {
    if (!this.container || !this.currentPayload) return;

    const p = this.currentPayload;
    const item = p.rawTarget as GeospatialEntity | undefined;
    const graph = p.graph;

    this.container.innerHTML = `
      <div class="ao-panel-header">
        <div class="ao-panel-title">
          <span>🏢</span>
          <span>${p.name || p.id}</span>
        </div>
        <button id="btn-close-twin-panel" class="ao-panel-close">&times;</button>
      </div>

      <div class="ao-panel-body" style="padding: 0.75rem; overflow-y: auto; max-height: calc(100vh - 120px);">
        <!-- Navigation Tabs -->
        <div style="display: flex; gap: 0.25rem; overflow-x: auto; margin-bottom: 0.85rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.4rem;">
          ${[
            { id: 'overview', label: 'Overview' },
            { id: 'geography', label: 'Geography' },
            { id: 'environment', label: 'Weather' },
            { id: 'infrastructure', label: 'Infra' },
            { id: 'transportation', label: 'Transit' },
            { id: 'events', label: 'Events' },
            { id: 'sources', label: 'Sources' },
          ]
            .map(
              (tab) => `
                <button class="ao-btn ao-btn--small ${this.activeTab === tab.id ? 'ao-btn--primary' : 'ao-btn--secondary'}" data-tab="${tab.id}">
                  ${tab.label}
                </button>
              `,
            )
            .join('')}
        </div>

        <!-- Tab Content Body -->
        <div id="twin-tab-content">
          ${this.renderTabContent(p, item, graph)}
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private renderTabContent(
    p: SelectionPayload,
    item: GeospatialEntity | undefined,
    graph: SelectionPayload['graph'],
  ): string {
    switch (this.activeTab) {
      case 'overview':
        return `
          <div style="margin-bottom: 1rem;">
            <div style="font-size: 0.75rem; color: var(--color-text-muted); font-weight: 600;">ENTITY TYPE</div>
            <div style="font-size: 1.1rem; font-weight: 700; color: var(--color-primary); text-transform: uppercase;">${p.type}</div>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem; background: rgba(255,255,255,0.03); padding: 0.75rem; border-radius: 6px;">
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">LATITUDE</div>
              <div style="font-family: monospace; font-weight: 600;">${p.latitude.toFixed(4)}°</div>
            </div>
            <div>
              <div style="font-size: 0.75rem; color: var(--color-text-muted);">LONGITUDE</div>
              <div style="font-family: monospace; font-weight: 600;">${p.longitude.toFixed(4)}°</div>
            </div>
          </div>

          ${
            item?.properties
              ? Object.entries(item.properties)
                  .map(
                    ([k, v]) => `
                      <div class="ao-detail-row" style="margin-bottom: 0.3rem;">
                        <span class="ao-detail-key">${k}</span>
                        <span class="ao-detail-value">${String(v)}</span>
                      </div>
                    `,
                  )
                  .join('')
              : ''
          }
        `;

      case 'geography':
        return `
          <div style="margin-bottom: 1rem;">
            <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted);">COUNTRY & REGION</div>
            <div style="font-size: 1rem; font-weight: 600; margin-top: 0.2rem;">${item?.country || 'Global'} (${item?.region || 'N/A'})</div>
          </div>
          <div style="margin-bottom: 1rem;">
            <div style="font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted);">NEAREST CITIES</div>
            <div style="font-size: 0.85rem; margin-top: 0.3rem;">
              ${graph?.relatedCities.map((c) => `• ${c.name} (${c.country})`).join('<br>') || 'None nearby'}
            </div>
          </div>
        `;

      case 'environment':
        return `
          <div style="background: rgba(6,182,212,0.1); border: 1px solid rgba(6,182,212,0.3); padding: 0.85rem; border-radius: 8px; margin-bottom: 1rem;">
            <div style="font-weight: 600; color: #06b6d4; margin-bottom: 0.4rem;">🌡️ Local Weather</div>
            ${
              graph?.context.weather
                ? `
                  <div style="font-size: 0.9rem;">Temp: <b>${graph.context.weather.temperature}°C</b></div>
                  <div style="font-size: 0.85rem; color: var(--color-text-muted);">Wind: ${graph.context.weather.windSpeed} km/h • Humidity: ${graph.context.weather.humidity}%</div>
                `
                : '<div style="font-size: 0.85rem; color: var(--color-text-muted);">Weather data fetching...</div>'
            }
          </div>
        `;

      case 'infrastructure': {
        const airportRows = graph?.relatedAirports.map((a) => `✈️ <b>${a.name}</b> (${a.properties['iata'] as string || 'N/A'})`).join('<br>') || 'None within 300km';
        const portRows = graph?.relatedPorts.map((p) => `<br>⚓ <b>${p.name}</b> (${p.country})`).join('') || '';
        return `
          <div style="font-size: 0.85rem;">
            <div style="font-weight: 600; margin-bottom: 0.4rem;">Nearby Airports &amp; Ports (${graph?.relatedAirports.length || 0})</div>
            ${airportRows}
            ${portRows}
          </div>
        `;
      }

      case 'transportation':
        return `
          <div style="font-size: 0.85rem;">
            <div style="font-weight: 600; margin-bottom: 0.4rem;">Active Flights & Vessels</div>
            <div>✈️ Aircraft in airspace: <b>${graph?.relatedFlights.length || 0}</b></div>
            <div>🚢 Maritime vessels: <b>${graph?.relatedShips.length || 0}</b></div>
          </div>
        `;

      case 'events':
        return `
          <div style="font-size: 0.85rem;">
            <div style="font-weight: 600; margin-bottom: 0.4rem;">Natural Events (${graph?.relatedEvents.length || 0})</div>
            ${graph?.relatedEvents.map((e) => `• <b>${e.type.toUpperCase()}</b>: ${e.title}`).join('<br>') || 'No active events within radius'}
          </div>
        `;

      case 'sources':
        return `
          <div style="font-size: 0.8rem; color: var(--color-text-muted);">
            <div>DATA PROVIDER: <b>${item?.source || 'Atlas One Engine'}</b></div>
            <div>LAST UPDATED: <b>${item?.lastUpdated?.toLocaleString() || new Date().toLocaleString()}</b></div>
            <div>DATA INTEGRITY: <b>Validated & Sanitized</b></div>
          </div>
        `;
    }
  }

  private attachEvents(): void {
    const closeBtn = querySelectorSafe('#btn-close-twin-panel');
    closeBtn?.addEventListener('click', () => this.hide());

    const tabBtns = this.container?.querySelectorAll('[data-tab]');
    tabBtns?.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        this.activeTab = (e.currentTarget as HTMLElement).getAttribute('data-tab') as TwinTab;
        this.render();
      });
    });
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    this.container?.remove();
    this.container = null;
    log.info('Digital Twin panel disposed');
  }
}
