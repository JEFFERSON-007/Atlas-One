/**
 * ComparisonPanel — UI for Earth Time Machine Comparison Mode.
 * Enables side-by-side or slider comparison of two time periods or datasets.
 */

import { eventBus } from '../../../hooks/use-event-bus';
import { createLogger } from '../../../utils/logger';
import { querySelectorSafe, createElement } from '../../../utils/dom';

const log = createLogger('ComparisonPanel');

export class ComparisonPanel {
  private container: HTMLElement | null = null;
  private unsubscribers: Array<() => void> = [];
  private isVisible = false;

  init(parentId: string): void {
    const parent = querySelectorSafe(`#${parentId}`);
    if (!parent) return;

    this.container = createElement('div', {
      id: 'comparison-panel',
      style: `
        position: absolute;
        top: 5rem;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 14, 23, 0.9);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        padding: 1rem;
        color: #e2e8f0;
        font-family: Inter, sans-serif;
        font-size: 0.85rem;
        z-index: 90;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        display: none;
        width: 400px;
        flex-direction: column;
        gap: 1rem;
      `,
    });

    parent.appendChild(this.container);

    this.unsubscribers.push(
      eventBus.on('ui:toggle-comparison', () => {
        this.toggle();
      }),
    );

    this.render();
    log.info('Comparison Panel initialized');
  }

  private toggle(): void {
    this.isVisible = !this.isVisible;
    if (this.container) {
      this.container.style.display = this.isVisible ? 'flex' : 'none';
    }
  }

  private render(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem;">
        <h3 style="margin: 0; font-size: 0.95rem; font-weight: 600;">Temporal Comparison</h3>
        <button id="btn-close-comparison" class="ao-btn ao-btn--ghost" style="padding: 2px 6px;">✕</button>
      </div>

      <div style="display: flex; gap: 1rem;">
        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
          <label style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Left View (Time A)</label>
          <input type="date" id="compare-time-a" class="ao-input" value="2020-01-01" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 4px; border-radius: 4px;">
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
          <label style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Right View (Time B)</label>
          <input type="date" id="compare-time-b" class="ao-input" value="2023-01-01" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: #fff; padding: 4px; border-radius: 4px;">
        </div>
      </div>

      <div style="display: flex; flex-direction: column; gap: 0.5rem;">
        <label style="font-size: 0.75rem; color: #94a3b8; text-transform: uppercase;">Split Position</label>
        <input type="range" id="compare-slider" min="0" max="100" value="50" style="width: 100%;">
      </div>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const closeBtn = querySelectorSafe('#btn-close-comparison');
    closeBtn?.addEventListener('click', () => this.toggle());

    const slider = querySelectorSafe<HTMLInputElement>('#compare-slider');
    slider?.addEventListener('input', (e) => {
      const val = parseFloat((e.target as HTMLInputElement).value);
      // In a full implementation, this would interact with cesium imagery splitter
      eventBus.emit('time:comparison-split', { position: val / 100 });
    });
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    this.container?.remove();
    this.container = null;
  }
}
