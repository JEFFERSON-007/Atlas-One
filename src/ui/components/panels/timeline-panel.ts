/**
 * TimelinePanel — Advanced time controller UI component for Atlas One v0.7.
 * Supports REAL_TIME, HISTORICAL, and SIMULATION modes.
 */

import { eventBus } from '../../../hooks/use-event-bus';
import type { TemporalEngine } from '../../../twin/time/temporal-engine';
import { TemporalMode, PlaybackSpeed } from '../../../twin/time/temporal-state.types';
import { createLogger } from '../../../utils/logger';
import { querySelectorSafe, createElement } from '../../../utils/dom';

const log = createLogger('TimelinePanel');

export class TimelinePanel {
  private container: HTMLElement | null = null;
  private temporalEngine: TemporalEngine | null = null;
  private unsubscribers: Array<() => void> = [];

  init(parentId: string, temporalEngine: TemporalEngine): void {
    const parent = querySelectorSafe(`#${parentId}`);
    if (!parent) return;

    this.temporalEngine = temporalEngine;

    this.container = createElement('div', {
      id: 'timeline-panel',
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
    log.info('Timeline Panel initialized');
  }

  private render(): void {
    if (!this.container || !this.temporalEngine) return;

    const state = this.temporalEngine.getState();
    const timeStr = state.currentTime.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
    const isRealTime = state.mode === TemporalMode.REAL_TIME;
    const isPlaying = state.isPlaying;

    this.container.innerHTML = `
      <div style="display: flex; gap: 0.5rem; align-items: center; padding-right: 0.5rem; border-right: 1px solid rgba(255,255,255,0.2);">
        <button id="btn-mode-live" class="ao-btn ao-btn--small ${isRealTime ? 'ao-btn--primary' : 'ao-btn--secondary'}" style="border-radius: 20px; font-size: 0.72rem; padding: 2px 10px;">
          ${isRealTime ? '● LIVE' : 'SYNC LIVE'}
        </button>
        <span style="font-size: 0.7rem; color: #94a3b8; text-transform: uppercase;">${state.mode}</span>
      </div>

      <button id="btn-time-step-back" class="ao-btn ao-btn--small ao-btn--secondary" style="border-radius: 50%; width: 26px; height: 26px; padding: 0;" title="-1 Hour">
        ⏮
      </button>

      <button id="btn-time-play" class="ao-btn ao-btn--small ${!isPlaying ? 'ao-btn--secondary' : 'ao-btn--primary'}" style="border-radius: 50%; width: 28px; height: 28px; padding: 0;" title="${isPlaying ? 'Pause' : 'Play'}" ${isRealTime ? 'disabled style="opacity: 0.5;"' : ''}>
        ${isPlaying ? '⏸' : '▶'}
      </button>

      <button id="btn-time-step-forward" class="ao-btn ao-btn--small ao-btn--secondary" style="border-radius: 50%; width: 26px; height: 26px; padding: 0;" title="+1 Hour">
        ⏭
      </button>

      <div style="display: flex; flex-direction: column; align-items: center;">
        <span style="font-family: monospace; font-weight: 600; color: #fff; min-width: 170px; text-align: center;">
          ${timeStr}
        </span>
      </div>

      <select id="select-time-speed" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.15); color: #38bdf8; border-radius: 12px; font-size: 0.72rem; padding: 2px 6px; cursor: pointer;">
        ${([1, 60, 3600, 86400] as PlaybackSpeed[])
          .map(
            (sp) => {
              const label = sp === 1 ? '1x (Real)' : sp === 60 ? '1m/s' : sp === 3600 ? '1h/s' : '1d/s';
              return `<option value="${sp}" ${state.playbackSpeed === sp ? 'selected' : ''}>${label}</option>`;
            }
          )
          .join('')}
      </select>
    `;

    this.attachEvents();
  }

  private attachEvents(): void {
    const liveBtn = querySelectorSafe('#btn-mode-live');
    liveBtn?.addEventListener('click', () => {
      this.temporalEngine?.setMode(TemporalMode.REAL_TIME);
      this.render();
    });

    const playBtn = querySelectorSafe('#btn-time-play');
    playBtn?.addEventListener('click', () => {
      this.temporalEngine?.togglePause();
      this.render();
    });

    const stepBack = querySelectorSafe('#btn-time-step-back');
    stepBack?.addEventListener('click', () => {
      this.temporalEngine?.step(-3600); // Back 1 hour
      this.render();
    });

    const stepFwd = querySelectorSafe('#btn-time-step-forward');
    stepFwd?.addEventListener('click', () => {
      this.temporalEngine?.step(3600); // Fwd 1 hour
      this.render();
    });

    const speedSelect = querySelectorSafe<HTMLSelectElement>('#select-time-speed');
    speedSelect?.addEventListener('change', (e) => {
      const val = parseInt((e.target as HTMLSelectElement).value, 10) as PlaybackSpeed;
      this.temporalEngine?.setSpeed(val);
      this.render();
    });
  }

  dispose(): void {
    for (const unsub of this.unsubscribers) unsub();
    this.unsubscribers = [];
    this.container?.remove();
    this.container = null;
    log.info('Timeline Panel disposed');
  }
}
