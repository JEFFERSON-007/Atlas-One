/**
 * MobilityFilterPanel — Panel for filtering dynamic objects by type, country, and text search.
 */

import { eventBus } from '../../../hooks/use-event-bus';
import type { MobilityFilterEngine } from '../../../mobility/engine/mobility-filter-engine';
import { ObjectType } from '../../../mobility/dynamic-object.types';
import { createLogger } from '../../../utils/logger';
import { querySelectorSafe, createElement } from '../../../utils/dom';

const log = createLogger('MobilityFilterPanel');

export class MobilityFilterPanel {
  private container: HTMLElement | null = null;
  private visible = false;
  private filterEngine: MobilityFilterEngine | null = null;
  private onFilterChange: (() => void) | null = null;

  init(
    parentId: string,
    filterEngine: MobilityFilterEngine,
    onFilterChange: () => void,
  ): void {
    const parent = querySelectorSafe(`#${parentId}`);
    if (!parent) return;

    this.filterEngine = filterEngine;
    this.onFilterChange = onFilterChange;

    this.container = createElement('div', {
      id: 'mobility-filter-panel',
      class: 'ao-panel ao-panel--left',
    });
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    log.info('Mobility filter panel initialized');
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
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ao-panel-header">
        <div class="ao-panel-title">
          <span>🔍</span>
          <span>Filter Dynamic Objects</span>
        </div>
        <button id="btn-close-mobility-filter" class="ao-panel-close">&times;</button>
      </div>

      <div class="ao-panel-body" style="padding: 1rem;">
        <div style="margin-bottom: 1rem;">
          <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); margin-bottom: 0.4rem;">
            SEARCH OBJECT ID / CALLSIGN
          </label>
          <input type="text" id="mobility-search-input" class="ao-input" placeholder="e.g. AAL100, ISS, STARLINK..." style="width: 100%; padding: 0.5rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; color: #fff;" />
        </div>

        <div style="margin-bottom: 1rem;">
          <label style="display: block; font-size: 0.8rem; font-weight: 600; color: var(--color-text-muted); margin-bottom: 0.4rem;">
            OBJECT TYPES
          </label>
          <div style="display: flex; flex-direction: column; gap: 0.4rem;">
            ${[
              ObjectType.Aircraft,
              ObjectType.Ship,
              ObjectType.Satellite,
              ObjectType.ISS,
              ObjectType.Starlink,
              ObjectType.GPS,
            ]
              .map(
                (type) => `
                  <label style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.85rem; cursor: pointer;">
                    <input type="checkbox" class="mobility-type-checkbox" value="${type}" checked />
                    <span>${type.toUpperCase()}</span>
                  </label>
                `,
              )
              .join('')}
          </div>
        </div>

        <div style="display: flex; gap: 0.5rem; margin-top: 1.5rem;">
          <button id="btn-reset-mobility-filter" class="ao-btn ao-btn--secondary" style="flex: 1;">
            Reset Filters
          </button>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const closeBtn = querySelectorSafe('#btn-close-mobility-filter');
    closeBtn?.addEventListener('click', () => this.hide());

    const searchInput = querySelectorSafe('#mobility-search-input') as HTMLInputElement | null;
    searchInput?.addEventListener('input', () => this.updateFilter());

    const checkboxes = this.container?.querySelectorAll('.mobility-type-checkbox');
    checkboxes?.forEach((cb) => {
      cb.addEventListener('change', () => this.updateFilter());
    });

    const resetBtn = querySelectorSafe('#btn-reset-mobility-filter');
    resetBtn?.addEventListener('click', () => {
      this.filterEngine?.clear();
      this.render();
      this.onFilterChange?.();
    });
  }

  private updateFilter(): void {
    if (!this.filterEngine) return;

    const searchInput = querySelectorSafe('#mobility-search-input') as HTMLInputElement | null;
    const checkboxes = this.container?.querySelectorAll('.mobility-type-checkbox:checked') as NodeListOf<HTMLInputElement>;

    const types: ObjectType[] = [];
    checkboxes?.forEach((cb) => types.push(cb.value as ObjectType));

    this.filterEngine.setFilter({
      searchText: searchInput?.value || undefined,
      types: types.length > 0 ? types : undefined,
    });

    this.onFilterChange?.();
  }

  dispose(): void {
    this.container?.remove();
    this.container = null;
    log.info('Mobility filter panel disposed');
  }
}
