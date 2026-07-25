/**
 * FPSCounter — Optional frames-per-second display using requestAnimationFrame timing.
 */

import { createElement, setTextContent } from '../../../utils/dom';
import { createLogger } from '../../../utils/logger';

const log = createLogger('FPSCounter');

/**
 * Real-time FPS counter display.
 */
export class FPSCounter {
  private container: HTMLElement | null = null;
  private valueEl: HTMLElement | null = null;
  private visible = false;
  private animFrameId: number | null = null;
  private frames = 0;
  private lastTime = performance.now();

  /**
   * Initializes the FPS counter.
   */
  init(parentId: string): void {
    const parent = document.getElementById(parentId);
    if (!parent) return;

    this.container = createElement('div', {
      id: 'fps-counter',
      class: 'tn-fps',
      'aria-label': 'Frames per second',
      role: 'status',
    });

    const label = createElement('span', { class: 'tn-fps__label' }, 'FPS');
    this.valueEl = createElement('span', { class: 'tn-fps__value' }, '60');

    this.container.appendChild(label);
    this.container.appendChild(this.valueEl);

    parent.appendChild(this.container);

    this.startCounting();
    log.info('FPS counter initialized');
  }

  /**
   * Sets visibility of the FPS counter.
   */
  setVisible(visible: boolean): void {
    this.visible = visible;
    if (this.container) {
      this.container.classList.toggle('tn-fps--visible', visible);
    }
  }

  /**
   * Starts the FPS counting loop.
   */
  private startCounting(): void {
    const tick = () => {
      this.frames++;
      const now = performance.now();
      const delta = now - this.lastTime;

      if (delta >= 1000) {
        const fps = Math.round((this.frames * 1000) / delta);
        if (this.valueEl) {
          setTextContent(this.valueEl, String(fps));
        }
        this.frames = 0;
        this.lastTime = now;
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  dispose(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
    }
    this.container?.remove();
    this.container = null;
  }
}
