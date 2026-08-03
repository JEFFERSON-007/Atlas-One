/**
 * FilterPanel — UI panel for controlling active event filters.
 */

import { EventType, EventSeverity } from '../../../events/earth-event.types';
import type { FilterEngine } from '../../../events/engine/filter-engine';
import { safeQuerySelector, createDOMElement } from '../../../utils/dom';
import { createLogger } from '../../../utils/logger';

const log = createLogger('FilterPanel');

export class FilterPanel {
  private container: HTMLElement | null = null;
  private visible = false;
  private filterEngine: FilterEngine | null = null;
  private onFilterChange: (() => void) | null = null;

  init(parentId: string, filterEngine: FilterEngine, onFilterChange: () => void): void {
    const parent = safeQuerySelector(`#${parentId}`);
    if (!parent) return;

    this.filterEngine = filterEngine;
    this.onFilterChange = onFilterChange;

    this.container = createDOMElement('div', {
      id: 'filter-panel',
      className: 'ao-panel ao-panel--left ao-filter-panel',
    });
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.render();
    log.info('Filter panel initialized');
  }

  show(): void {
    if (this.container) {
      this.container.style.display = 'flex';
      this.visible = true;
    }
  }

  hide(): void {
    if (this.container) {
      this.container.style.display = 'none';
      this.visible = false;
    }
  }

  toggle(): void {
    if (this.visible) this.hide();
    else this.show();
  }

  isVisible(): boolean {
    return this.visible;
  }

  dispose(): void {
    this.container?.remove();
    this.container = null;
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ao-panel__header">
        <div class="ao-panel__title">🔍 Event Filters</div>
        <button class="ao-panel__close" id="filter-close" aria-label="Close">✕</button>
      </div>
      <div class="ao-panel__body">
        <div class="ao-form-group">
          <label class="ao-form-label">Search Keywords</label>
          <input type="text" id="filter-search-input" class="ao-input" placeholder="Search events..." />
        </div>

        <div class="ao-form-group">
          <label class="ao-form-label">Event Types</label>
          <div class="ao-checkbox-group">
            ${Object.values(EventType).slice(0, 6).map((t) => `
              <label class="ao-checkbox">
                <input type="checkbox" class="filter-type-cb" value="${t}" checked />
                <span>${t}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="ao-form-group">
          <label class="ao-form-label">Min Severity</label>
          <div class="ao-checkbox-group">
            ${Object.values(EventSeverity).map((s) => `
              <label class="ao-checkbox">
                <input type="checkbox" class="filter-sev-cb" value="${s}" checked />
                <span>${s}</span>
              </label>
            `).join('')}
          </div>
        </div>

        <div class="ao-panel__actions">
          <button class="ao-btn ao-btn--secondary" id="filter-reset-btn">Reset Filters</button>
        </div>
      </div>
    `;

    this.container.querySelector('#filter-close')?.addEventListener('click', () => this.hide());
    this.container.querySelector('#filter-reset-btn')?.addEventListener('click', () => {
      this.filterEngine?.clearFilter();
      this.render();
      this.onFilterChange?.();
    });

    const updateFilter = () => {
      const searchText = (this.container?.querySelector('#filter-search-input') as HTMLInputElement)?.value || '';
      const selectedTypes = Array.from(this.container?.querySelectorAll('.filter-type-cb:checked') || []).map(
        (cb) => (cb as HTMLInputElement).value as EventType,
      );
      const selectedSevs = Array.from(this.container?.querySelectorAll('.filter-sev-cb:checked') || []).map(
        (cb) => (cb as HTMLInputElement).value as EventSeverity,
      );

      this.filterEngine?.setFilter({
        searchText: searchText.trim() ? searchText : undefined,
        types: selectedTypes.length > 0 ? selectedTypes : undefined,
        severities: selectedSevs.length > 0 ? selectedSevs : undefined,
      });
      this.onFilterChange?.();
    };

    this.container.querySelector('#filter-search-input')?.addEventListener('input', updateFilter);
    this.container.querySelectorAll('.filter-type-cb, .filter-sev-cb').forEach((cb) => {
      cb.addEventListener('change', updateFilter);
    });
  }
}
