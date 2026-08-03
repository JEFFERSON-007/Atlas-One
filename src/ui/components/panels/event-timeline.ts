/**
 * EventTimeline — Horizontal bottom timeline bar for temporal control.
 */

import { safeQuerySelector, createDOMElement } from '../../../utils/dom';
import { createLogger } from '../../../utils/logger';

const log = createLogger('EventTimeline');

export class EventTimeline {
  private container: HTMLElement | null = null;
  private visible = false;

  init(parentId: string): void {
    const parent = safeQuerySelector(`#${parentId}`);
    if (!parent) return;

    this.container = createDOMElement('div', {
      id: 'event-timeline',
      className: 'ao-timeline-strip',
    });
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.render();
    log.info('Event timeline initialized');
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
      <button class="ao-btn-icon" id="timeline-play" title="Play/Pause">▶</button>
      <div class="ao-timeline__scrubber">
        <input type="range" min="0" max="100" value="100" class="ao-range" id="timeline-range" />
      </div>
      <span class="ao-timeline__label">Live (Last 24h)</span>
    `;
  }
}
