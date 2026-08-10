/**
 * TimeControllerBar — Centralized time playback bar UI component.
 * Displays current platform time, Play/Pause toggle, Live mode toggle,
 * Step buttons (-1h / +1h), and speed multipliers (0.25x, 0.5x, 1x, 2x, 5x, 10x, 50x, 100x).
 */

import { eventBus } from '../../../hooks/use-event-bus';
import type { TimeController, PlaybackSpeed } from '../../../twin/time/time-controller';
import { createLogger } from '../../../utils/logger';
import { querySelectorSafe, createElement } from '../../../utils/dom';

const log = createLogger('TimeControllerBar');

export class TimeControllerBar {
  private container: HTMLElement | null = null;
  private timeController: TimeController | null = null;
  private unsubscribers: Array<() => void> = [];

  init(parentId: string, timeController: TimeController): void {
    const parent = querySelectorSafe(`#${parentId}`);
    if (!parent) return;

    this.timeController = timeController;

    this.container = createElement('div', {
      id: 'time-controller-bar',
      style: `
        position: absolute;
        bottom: 1rem;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(10, 14, 23, 0.85);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 30px;
        padding: 0.4rem 1rem;
        color: #e2e8f0;
        font-family: Inter, sans-serif;
        font-size: 0.8rem;
        z-index: 100;
        box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        display: flex;
        align-items: center;
        gap: 0.75rem;
        pointer-events: auto;
      `,
    });

    parent.appendChild(this.container);

    this.unsubscribers.push(
      eventBus.on('time:updated', () => {
        this.render();
      }),
    );

    this.render();
    log.info('Time Controller Bar initialized');
  }

  private render(): void {
    if (!this.container || !this.timeController) return;

    const state = this.timeController.getState();
    const timeStr = state.currentTime.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

    this.container.innerHTML = `
      <button id="btn-time-live" class="ao-btn ao-btn--small ${state.isLive ? 'ao-btn--primary' : 'ao-btn--secondary'}" style="border-radius: 20px; font-size: 0.72rem; padding: 2px 10px;">
        ${state.isLive ? '● LIVE' : 'SYNC LIVE'}
      </button>

      <button id="btn-time-step-back" class="ao-btn ao-btn--small ao-btn--secondary" style="border-radius: 50%; width: 26px; height: 26px; padding: 0;" title="-1 Hour">
        ⏮
      </button>

      <button id="btn-time-play" class="ao-btn ao-btn--small ${state.isPaused ? 'ao-btn--secondary' : 'ao-btn--primary'}" style="border-radius: 50%; width: 28px; height: 28px; padding: 0;" title="${state.isPaused ? 'Play' : 'Pause'}">
        ${state.isPaused ? '▶' : '⏸'}
      </button>

      <button id="btn-time-step-forward" class="ao-btn ao-btn--small ao-btn--secondary" style="border-radius: 50%; width: 26px; height: 26px; padding: 0;" title="+1 Hour">
        ⏭
      </button>

      <span style="font-family: monospace; font-weight: 600; color: #fff; min-width: 170px; text-align: center;">
        ${timeStr}
      </span>

      <select id="select-time-speed" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #38bdf8; border-radius: 12px; font-size: 0.72rem; padding: 2px 6px; cursor: pointer;">
        ${([0.25, 0.5, 1, 2, 5, 10, 50, 100] as PlaybackSpeed[])
          .map(
            (sp) => `
              <option value="${sp}" ${state.speedMultiplier === sp ? 'selected' : ''}>${sp}x speed</option>
            `,
          )
          .join('')}
      </select>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const liveBtn = querySelectorSafe('#btn-time-live');
    liveBtn?.addEventListener('click', () => {
      this.timeController?.setLiveMode();
      this.render();
    });

    const playBtn = querySelectorSafe('#btn-time-play');
    playBtn?.addEventListener('click', () => {
      this.timeController?.togglePause();
      this.render();
    });

    const stepBack = querySelectorSafe('#btn-time-step-back');
    stepBack?.addEventListener('click', () => {
      this.timeController?.step(-3600);
      this.render();
    });

    const stepFwd = querySelectorSafe('#btn-time-step-forward');
    stepFwd?.addEventListener('click', () => {
      this.timeController?.step(3600);
      this.render();
    });

    const speedSelect = querySelectorSafe<HTMLSelectElement>('#select-time-speed');
    speedSelect?.addEventListener('change', (e) => {
      const val = parseFloat((e.target as HTMLSelectElement).value) as PlaybackSpeed;
      this.timeController?.setSpeed(val);
      this.render();
    });
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    this.container?.remove();
    this.container = null;
    log.info('Time Controller Bar disposed');
  }
}
