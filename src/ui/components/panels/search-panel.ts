/**
 * SearchPanel — Location search with debounced input, results dropdown,
 * fly-to on selection, and marker placement.
 */

import { createElement } from '../../../utils/dom';
import { debounce } from '../../../utils/debounce';
import { sanitizeInput } from '../../../utils/validators';
import { performSearch, flyToResult } from '../../../api/search.service';
import type { SearchResult } from '../../../api/adapters/nominatim.adapter';
import { createLogger } from '../../../utils/logger';
import {
  Cartesian3,
  Color,
  VerticalOrigin,
  type Viewer,
} from 'cesium';

const log = createLogger('SearchPanel');

/**
 * Search panel with input, results list, and fly-to functionality.
 */
export class SearchPanel {
  private panel: HTMLElement | null = null;
  private input: HTMLInputElement | null = null;
  private resultsList: HTMLElement | null = null;
  private visible = false;
  private viewer: Viewer | null = null;
  private searchMarkerEntityId: string | null = null;

  /**
   * Initializes the search panel.
   *
   * @param parentId - Parent container ID
   * @param viewer - CesiumJS Viewer for marker placement
   */
  init(parentId: string, viewer: Viewer): void {
    this.viewer = viewer;
    const parent = document.getElementById(parentId);
    if (!parent) return;

    this.panel = createElement('div', {
      id: 'search-panel',
      class: 'tn-panel tn-search-panel',
      role: 'search',
      'aria-label': 'Location search',
    });

    // Header
    const header = createElement(
      'div',
      { class: 'tn-panel__header' },
      createElement('h2', { class: 'tn-panel__title' }, 'Search'),
    );

    const closeBtn = createElement('button', {
      class: 'tn-panel__close',
      'aria-label': 'Close search panel',
      type: 'button',
    }, '×');
    closeBtn.addEventListener('click', () => this.toggle());
    header.appendChild(closeBtn);

    // Search input
    this.input = createElement('input', {
      type: 'text',
      id: 'search-input',
      class: 'tn-search-panel__input',
      placeholder: 'Search for a location...',
      autocomplete: 'off',
      'aria-label': 'Search for a location',
    });

    // Results list
    this.resultsList = createElement('ul', {
      id: 'search-results',
      class: 'tn-search-panel__results',
      role: 'listbox',
      'aria-label': 'Search results',
    });

    // Debounced search handler
    const debouncedSearch = debounce(async (...args: unknown[]) => {
      const query = args[0] as string;
      await this.handleSearch(query);
    }, 300);

    this.input.addEventListener('input', (e) => {
      const query = (e.target as HTMLInputElement).value;
      void debouncedSearch(query);
    });

    // Keyboard navigation in results
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.toggle();
      }
    });

    this.panel.appendChild(header);
    this.panel.appendChild(this.input);
    this.panel.appendChild(this.resultsList);
    parent.appendChild(this.panel);

    log.info('Search panel initialized');
  }

  /**
   * Toggles panel visibility.
   */
  toggle(): void {
    this.visible = !this.visible;
    if (this.panel) {
      this.panel.classList.toggle('tn-panel--visible', this.visible);
    }
    if (this.visible && this.input) {
      setTimeout(() => this.input?.focus(), 100);
    }
  }

  /**
   * Returns whether the panel is visible.
   */
  isVisible(): boolean {
    return this.visible;
  }

  /**
   * Handles search input.
   */
  private async handleSearch(query: string): Promise<void> {
    const sanitized = sanitizeInput(query);
    if (sanitized.length < 2) {
      this.clearResults();
      return;
    }

    const results = await performSearch(sanitized);
    this.renderResults(results);
  }

  /**
   * Renders search results in the dropdown.
   */
  private renderResults(results: SearchResult[]): void {
    this.clearResults();
    if (!this.resultsList) return;

    for (const result of results) {
      const item = createElement('li', {
        class: 'tn-search-panel__result-item',
        role: 'option',
        tabindex: '0',
      });

      const name = createElement(
        'div',
        { class: 'tn-search-panel__result-name' },
        result.city || result.displayName.split(',')[0] || 'Unknown',
      );

      const details = createElement(
        'div',
        { class: 'tn-search-panel__result-details' },
        `${result.latitude.toFixed(4)}°, ${result.longitude.toFixed(4)}° · ${result.country}`,
      );

      item.appendChild(name);
      item.appendChild(details);

      item.addEventListener('click', () => this.selectResult(result));
      item.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.selectResult(result);
      });

      this.resultsList.appendChild(item);
    }
  }

  /**
   * Handles selection of a search result.
   */
  private selectResult(result: SearchResult): void {
    flyToResult(result);
    this.placeMarker(result);

    // Show info in input
    if (this.input) {
      this.input.value = result.displayName;
    }

    this.clearResults();
    log.info(`Selected: ${result.displayName}`);
  }

  /**
   * Places a marker on the globe at the search result location.
   */
  private placeMarker(result: SearchResult): void {
    if (!this.viewer) return;

    // Remove previous marker
    if (this.searchMarkerEntityId) {
      const prev = this.viewer.entities.getById(this.searchMarkerEntityId);
      if (prev) this.viewer.entities.remove(prev);
    }

    const entity = this.viewer.entities.add({
      name: result.displayName,
      position: Cartesian3.fromDegrees(result.longitude, result.latitude),
      point: {
        pixelSize: 12,
        color: Color.fromCssColorString('#3b82f6'),
        outlineColor: Color.WHITE,
        outlineWidth: 2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
      label: {
        text: result.city || result.displayName.split(',')[0] || '',
        font: '14px Inter, sans-serif',
        fillColor: Color.WHITE,
        outlineColor: Color.BLACK,
        outlineWidth: 3,
        style: 2, // FILL_AND_OUTLINE
        verticalOrigin: VerticalOrigin.BOTTOM,
        pixelOffset: { x: 0, y: -16 } as unknown as import('cesium').Cartesian2,
        disableDepthTestDistance: Number.POSITIVE_INFINITY,
      },
    });

    this.searchMarkerEntityId = entity.id;
  }

  /**
   * Clears the search results list.
   */
  private clearResults(): void {
    if (this.resultsList) {
      this.resultsList.innerHTML = '';
    }
  }

  /**
   * Cleans up the search panel.
   */
  dispose(): void {
    if (this.viewer && this.searchMarkerEntityId) {
      const entity = this.viewer.entities.getById(this.searchMarkerEntityId);
      if (entity) this.viewer.entities.remove(entity);
    }
    this.panel?.remove();
    this.panel = null;
    this.input = null;
    this.resultsList = null;
    this.viewer = null;
  }
}
