/**
 * CountryIntelligencePanel — Specialized panel for exploring country data.
 * Displays country flag, capital, population, area, density, region, languages,
 * currency, timezones, top-level domain, and bordering countries.
 */

import { eventBus } from '../../../hooks/use-event-bus';
import type { GeospatialEntity } from '../../../twin/entity/geospatial-entity.types';
import { EntityType } from '../../../twin/entity/geospatial-entity.types';
import { createLogger } from '../../../utils/logger';
import { querySelectorSafe, createElement } from '../../../utils/dom';

const log = createLogger('CountryIntelligencePanel');

export class CountryIntelligencePanel {
  private container: HTMLElement | null = null;
  private visible = false;
  private unsubscribers: Array<() => void> = [];
  private getCountries: (() => GeospatialEntity[]) | null = null;

  init(parentId: string, getCountries: () => GeospatialEntity[]): void {
    const parent = querySelectorSafe(`#${parentId}`);
    if (!parent) return;

    this.getCountries = getCountries;

    this.container = createElement('div', {
      id: 'country-intelligence-panel',
      class: 'ao-panel ao-panel--left',
    });
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.unsubscribers.push(
      eventBus.on('selection:changed', (payload) => {
        if (payload.type === 'entity' && payload.rawTarget) {
          const item = payload.rawTarget as GeospatialEntity;
          if (item.type === EntityType.Country) {
            this.showCountry(item);
          }
        }
      }),
    );

    log.info('Country Intelligence panel initialized');
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

  showCountry(countryItem: GeospatialEntity): void {
    this.visible = true;
    if (this.container) {
      this.container.innerHTML = this.renderCountryHtml(countryItem);
      this.container.style.display = 'block';
      this.attachEvents();
    }
  }

  private render(): void {
    if (!this.container || !this.getCountries) return;

    const countries = this.getCountries().filter((e) => e.type === EntityType.Country);

    this.container.innerHTML = `
      <div class="ao-panel-header">
        <div class="ao-panel-title">
          <span>🌐</span>
          <span>Country Intelligence (${countries.length})</span>
        </div>
        <button id="btn-close-country-panel" class="ao-panel-close">&times;</button>
      </div>

      <div class="ao-panel-body" style="padding: 0.75rem; overflow-y: auto; max-height: calc(100vh - 120px);">
        ${
          countries.length === 0
            ? '<div style="color: var(--color-text-muted); text-align: center; padding: 2rem;">Loading country dataset...</div>'
            : countries.slice(0, 50).map((c) => this.renderCountryRow(c)).join('')
        }
      </div>
    `;

    this.attachEvents();
  }

  private renderCountryRow(c: GeospatialEntity): string {
    const pop = (c.properties['population'] as number | undefined)?.toLocaleString() || 'N/A';
    const capital = (c.properties['capital'] as string | undefined) || 'N/A';

    return `
      <div class="ao-event-card" data-country-id="${c.id}" style="cursor: pointer; padding: 0.6rem 0.75rem; margin-bottom: 0.5rem; border-radius: 6px; background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05); display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 600; font-size: 0.88rem;">🌐 ${c.name}</div>
          <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-top: 0.2rem;">
            Capital: ${capital} • Pop: ${pop}
          </div>
        </div>
        <span class="ao-badge ao-badge--info">${c.region}</span>
      </div>
    `;
  }

  private renderCountryHtml(c: GeospatialEntity): string {
    interface CountryProps {
      capital?: string;
      population?: number;
      areaKm2?: number;
      densityPerKm2?: number;
      region?: string;
      subregion?: string;
      languages?: string;
      currencies?: string;
      timezones?: string;
    }
    const p = c.properties as CountryProps;

    return `
      <div class="ao-panel-header">
        <div class="ao-panel-title">
          <span>🌐</span>
          <span>${c.name}</span>
        </div>
        <button id="btn-close-country-panel" class="ao-panel-close">&times;</button>
      </div>

      <div class="ao-panel-body" style="padding: 1rem; overflow-y: auto; max-height: calc(100vh - 120px);">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 1rem; background: rgba(56,189,248,0.1); border: 1px solid rgba(56,189,248,0.3); padding: 0.75rem; border-radius: 8px;">
          <div>
            <div style="font-size: 0.75rem; color: #38bdf8; font-weight: 600;">CAPITAL</div>
            <div style="font-weight: 700; color: #fff;">${p['capital'] || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #38bdf8; font-weight: 600;">POPULATION</div>
            <div style="font-weight: 700; color: #fff;">${(p['population'] as number)?.toLocaleString() || 'N/A'}</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #38bdf8; font-weight: 600;">AREA</div>
            <div style="font-weight: 700; color: #fff;">${(p['areaKm2'] as number)?.toLocaleString() || 'N/A'} km²</div>
          </div>
          <div>
            <div style="font-size: 0.75rem; color: #38bdf8; font-weight: 600;">DENSITY</div>
            <div style="font-weight: 700; color: #fff;">${p['densityPerKm2']} /km²</div>
          </div>
        </div>

        <div style="font-size: 0.85rem;">
          <div class="ao-detail-row"><span class="ao-detail-key">Region:</span> <span class="ao-detail-value">${p['region']} (${p['subregion']})</span></div>
          <div class="ao-detail-row"><span class="ao-detail-key">Languages:</span> <span class="ao-detail-value">${p['languages']}</span></div>
          <div class="ao-detail-row"><span class="ao-detail-key">Currencies:</span> <span class="ao-detail-value">${p['currencies']}</span></div>
          <div class="ao-detail-row"><span class="ao-detail-key">Timezones:</span> <span class="ao-detail-value">${p['timezones']}</span></div>
          <div class="ao-detail-row"><span class="ao-detail-key">Domain:</span> <span class="ao-detail-value">${p['tld']}</span></div>
          <div class="ao-detail-row"><span class="ao-detail-key">Borders:</span> <span class="ao-detail-value">${p['borders']}</span></div>
        </div>
      </div>
    `;
  }

  private attachEvents(): void {
    const closeBtn = querySelectorSafe('#btn-close-country-panel');
    closeBtn?.addEventListener('click', () => this.hide());

    const rows = this.container?.querySelectorAll('[data-country-id]');
    rows?.forEach((row) => {
      row.addEventListener('click', (e) => {
        const id = (e.currentTarget as HTMLElement).getAttribute('data-country-id');
        const c = this.getCountries?.().find((item) => item.id === id);
        if (c) this.showCountry(c);
      });
    });
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    this.container?.remove();
    this.container = null;
    log.info('Country Intelligence panel disposed');
  }
}
