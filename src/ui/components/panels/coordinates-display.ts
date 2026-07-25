/**
 * CoordinatesDisplay — Shows mouse cursor lat/lng/altitude in the bottom-right.
 * Updates on mouse move with throttling for performance.
 */

import { createElement, setTextContent } from '../../../utils/dom';
import { throttle } from '../../../utils/throttle';
import { formatCoordinate } from '../../../utils/validators';
import { createLogger } from '../../../utils/logger';

const log = createLogger('CoordinatesDisplay');

/**
 * Coordinates overlay display.
 */
export class CoordinatesDisplay {
  private container: HTMLElement | null = null;
  private latEl: HTMLElement | null = null;
  private lngEl: HTMLElement | null = null;
  private altEl: HTMLElement | null = null;
  private visible = false;
  private animFrameId: number | null = null;

  /**
   * Initializes the coordinates display.
   */
  init(parentId: string): void {
    const parent = document.getElementById(parentId);
    if (!parent) return;

    this.container = createElement('div', {
      id: 'coordinates-display',
      class: 'tn-coordinates',
      'aria-label': 'Cursor coordinates',
      role: 'status',
    });

    this.latEl = createElement('span', { class: 'tn-coordinates__value' }, '0.0000°');
    this.lngEl = createElement('span', { class: 'tn-coordinates__value' }, '0.0000°');
    this.altEl = createElement('span', { class: 'tn-coordinates__value' }, '0 m');

    const latLabel = createElement('span', { class: 'tn-coordinates__label' }, 'LAT');
    const lngLabel = createElement('span', { class: 'tn-coordinates__label' }, 'LNG');
    const altLabel = createElement('span', { class: 'tn-coordinates__label' }, 'ALT');

    const latGroup = createElement('div', { class: 'tn-coordinates__group' });
    latGroup.appendChild(latLabel);
    latGroup.appendChild(this.latEl);

    const lngGroup = createElement('div', { class: 'tn-coordinates__group' });
    lngGroup.appendChild(lngLabel);
    lngGroup.appendChild(this.lngEl);

    const altGroup = createElement('div', { class: 'tn-coordinates__group' });
    altGroup.appendChild(altLabel);
    altGroup.appendChild(this.altEl);

    this.container.appendChild(latGroup);
    this.container.appendChild(lngGroup);
    this.container.appendChild(altGroup);

    parent.appendChild(this.container);

    // Start polling cursor data
    this.startUpdating();

    log.info('Coordinates display initialized');
  }

  /**
   * Toggles visibility of the coordinates display.
   */
  toggle(): void {
    this.visible = !this.visible;
    if (this.container) {
      this.container.classList.toggle('tn-coordinates--visible', this.visible);
    }
  }

  setVisible(vis: boolean): void {
    this.visible = vis;
    if (this.container) {
      this.container.classList.toggle('tn-coordinates--visible', vis);
    }
  }

  /**
   * Starts a throttled update loop reading cursor position.
   */
  private startUpdating(): void {
    const update = throttle((..._args: unknown[]) => {
      const cursor = (window as Record<string, unknown>).__tn_cursor as
        | { lat: number; lng: number; alt: number }
        | undefined;

      if (cursor && this.latEl && this.lngEl && this.altEl) {
        setTextContent(this.latEl, `${formatCoordinate(cursor.lat, 4)}°`);
        setTextContent(this.lngEl, `${formatCoordinate(cursor.lng, 4)}°`);
        setTextContent(
          this.altEl,
          cursor.alt > 1000
            ? `${(cursor.alt / 1000).toFixed(1)} km`
            : `${cursor.alt.toFixed(0)} m`,
        );
      }
    }, 100);

    const loop = () => {
      update();
      this.animFrameId = requestAnimationFrame(loop);
    };
    this.animFrameId = requestAnimationFrame(loop);
  }

  dispose(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.container?.remove();
    this.container = null;
  }
}
