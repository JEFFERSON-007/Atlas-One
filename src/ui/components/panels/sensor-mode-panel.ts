/**
 * SensorModePanel — Visual mode selector for post-processing shaders.
 * Displays a compact strip of sensor mode buttons with keyboard shortcuts.
 */

import { SensorMode, SENSOR_MODE_LABELS, SENSOR_MODE_KEYS } from '../../../core/engine/postfx/sensor-mode.types';
import type { PostProcessManager } from '../../../core/engine/postfx/post-process-manager';
import { createElement } from '../../../utils/dom';
import { createLogger } from '../../../utils/logger';

const log = createLogger('SensorModePanel');

export class SensorModePanel {
  private container: HTMLElement | null = null;
  private postProcessManager: PostProcessManager | null = null;
  private buttons: Map<SensorMode, HTMLElement> = new Map();

  init(parentId: string, postProcessManager: PostProcessManager): void {
    const parent = document.getElementById(parentId);
    if (!parent) return;

    this.postProcessManager = postProcessManager;

    this.container = createElement('div', {
      id: 'sensor-mode-panel',
      style: `
        position: absolute;
        bottom: 3.5rem;
        left: 50%;
        transform: translateX(-50%);
        display: none;
        gap: 4px;
        padding: 6px 10px;
        background: rgba(10, 12, 18, 0.85);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 10px;
        z-index: 90;
        font-family: 'Inter', system-ui, sans-serif;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
      `,
    });

    this.buildModeButtons();
    parent.appendChild(this.container);

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));

    log.info('Sensor mode panel initialized');
  }

  toggle(): void {
    if (!this.container) return;
    const isShown = this.container.style.display === 'flex';
    this.container.style.display = isShown ? 'none' : 'flex';
  }

  isVisible(): boolean {
    return this.container?.style.display === 'flex';
  }

  show(): void {
    if (this.container) this.container.style.display = 'flex';
  }

  hide(): void {
    if (this.container) this.container.style.display = 'none';
  }

  private buildModeButtons(): void {
    if (!this.container) return;

    const modes = Object.values(SensorMode);
    const keyMap = Object.entries(SENSOR_MODE_KEYS);

    for (const mode of modes) {
      const keyEntry = keyMap.find(([, m]) => m === mode);
      const keyLabel = keyEntry ? keyEntry[0] : '';
      const label = SENSOR_MODE_LABELS[mode];

      const btn = createElement('button', {
        'data-mode': mode,
        style: `
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 6px 10px;
          min-width: 52px;
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 6px;
          background: rgba(255,255,255,0.04);
          color: rgba(255,255,255,0.6);
          cursor: pointer;
          font-size: 0.6rem;
          font-family: 'Inter', system-ui, sans-serif;
          transition: all 0.2s ease;
          letter-spacing: 0.04em;
          pointer-events: auto;
        `,
      });

      // Key badge
      const keyBadge = createElement('span', {
        style: `
          font-size: 0.65rem;
          font-weight: 700;
          margin-bottom: 2px;
          color: rgba(0, 200, 255, 0.8);
        `,
      }, keyLabel);

      const labelEl = createElement('span', {}, label);

      btn.appendChild(keyBadge);
      btn.appendChild(labelEl);

      btn.addEventListener('mouseenter', () => {
        if (this.postProcessManager?.getMode() !== mode) {
          btn.style.background = 'rgba(255,255,255,0.1)';
          btn.style.color = '#fff';
        }
      });

      btn.addEventListener('mouseleave', () => {
        if (this.postProcessManager?.getMode() !== mode) {
          btn.style.background = 'rgba(255,255,255,0.04)';
          btn.style.color = 'rgba(255,255,255,0.6)';
        }
      });

      btn.addEventListener('click', () => {
        this.selectMode(mode);
      });

      this.buttons.set(mode, btn);
      this.container.appendChild(btn);
    }

    // Highlight initial mode
    this.highlightActiveMode(SensorMode.NORMAL);
  }

  private selectMode(mode: SensorMode): void {
    this.postProcessManager?.setMode(mode);
    this.highlightActiveMode(mode);
  }

  private highlightActiveMode(activeMode: SensorMode): void {
    for (const [mode, btn] of this.buttons) {
      if (mode === activeMode) {
        btn.style.background = 'rgba(0, 200, 255, 0.15)';
        btn.style.color = '#fff';
        btn.style.borderColor = 'rgba(0, 200, 255, 0.4)';
      } else {
        btn.style.background = 'rgba(255,255,255,0.04)';
        btn.style.color = 'rgba(255,255,255,0.6)';
        btn.style.borderColor = 'rgba(255,255,255,0.06)';
      }
    }
  }

  private handleKeyDown(e: KeyboardEvent): void {
    // Don't intercept if user is typing in an input
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      return;
    }

    const mode = SENSOR_MODE_KEYS[e.key];
    if (mode) {
      e.preventDefault();
      this.selectMode(mode);
    }
  }

  dispose(): void {
    this.container?.remove();
    this.container = null;
    this.buttons.clear();
    log.info('Sensor mode panel disposed');
  }
}
