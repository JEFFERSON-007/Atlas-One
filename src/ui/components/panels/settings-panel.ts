/**
 * SettingsPanel — Application settings controls.
 * Provides toggles for FPS, auto-rotate, terrain, clouds, and quality selector.
 */

import { createElement } from '../../../utils/dom';
import { eventBus } from '../../../hooks/use-event-bus';
import type { GraphicsQuality } from '../../../config/app.config';
import { createLogger } from '../../../utils/logger';

const log = createLogger('SettingsPanel');

export interface SettingsState {
  showFps: boolean;
  autoRotate: boolean;
  terrain: boolean;
  clouds: boolean;
  graphicsQuality: GraphicsQuality;
  animationSpeed: number;
}

/**
 * Settings panel with application controls.
 */
export class SettingsPanel {
  private panel: HTMLElement | null = null;
  private visible = false;
  private state: SettingsState = {
    showFps: false,
    autoRotate: false,
    terrain: true,
    clouds: false,
    graphicsQuality: 'medium',
    animationSpeed: 1.0,
  };

  private onSettingChange: ((key: string, value: unknown) => void) | null = null;

  /**
   * Initializes the settings panel.
   */
  init(
    parentId: string,
    initialState: Partial<SettingsState>,
    onChange: (key: string, value: unknown) => void,
  ): void {
    this.state = { ...this.state, ...initialState };
    this.onSettingChange = onChange;
    const parent = document.getElementById(parentId);
    if (!parent) return;

    this.panel = createElement('div', {
      id: 'settings-panel',
      class: 'tn-panel tn-settings-panel',
      role: 'dialog',
      'aria-label': 'Settings',
    });

    const header = createElement(
      'div',
      { class: 'tn-panel__header' },
      createElement('h2', { class: 'tn-panel__title' }, 'Settings'),
    );

    const closeBtn = createElement('button', {
      class: 'tn-panel__close',
      'aria-label': 'Close settings panel',
      type: 'button',
    }, '×');
    closeBtn.addEventListener('click', () => this.toggle());
    header.appendChild(closeBtn);

    this.panel.appendChild(header);

    const content = createElement('div', { class: 'tn-settings-panel__content' });

    // Graphics Quality
    content.appendChild(this.createSelect('graphicsQuality', 'Graphics Quality', [
      { value: 'low', label: 'Low' },
      { value: 'medium', label: 'Medium' },
      { value: 'high', label: 'High' },
      { value: 'ultra', label: 'Ultra' },
    ], this.state.graphicsQuality));

    // Toggles
    content.appendChild(this.createToggle('showFps', 'Show FPS', this.state.showFps));
    content.appendChild(this.createToggle('autoRotate', 'Auto Rotate', this.state.autoRotate));
    content.appendChild(this.createToggle('terrain', 'Terrain', this.state.terrain));
    content.appendChild(this.createToggle('clouds', 'Clouds', this.state.clouds));

    // Animation Speed
    content.appendChild(this.createSlider('animationSpeed', 'Animation Speed', this.state.animationSpeed, 0.1, 3.0, 0.1));

    this.panel.appendChild(content);
    parent.appendChild(this.panel);

    log.info('Settings panel initialized');
  }

  private createToggle(key: string, label: string, checked: boolean): HTMLElement {
    const row = createElement('div', { class: 'tn-settings-panel__row' });
    const lbl = createElement('label', {
      class: 'tn-settings-panel__label',
      for: `setting-${key}`,
    }, label);

    const switchEl = createElement('div', { class: 'tn-toggle-switch' });
    const input = createElement('input', {
      type: 'checkbox',
      id: `setting-${key}`,
      class: 'tn-toggle-input',
      role: 'switch',
      'aria-label': label,
    }) as HTMLInputElement;
    input.checked = checked;
    input.addEventListener('change', () => {
      (this.state as unknown as Record<string, unknown>)[key] = input.checked;
      this.emitChange(key, input.checked);
    });
    switchEl.appendChild(input);
    switchEl.appendChild(createElement('span', { class: 'tn-toggle-slider' }));

    row.appendChild(lbl);
    row.appendChild(switchEl);
    return row;
  }

  private createSelect(
    key: string,
    label: string,
    options: { value: string; label: string }[],
    current: string,
  ): HTMLElement {
    const row = createElement('div', { class: 'tn-settings-panel__row' });
    const lbl = createElement('label', {
      class: 'tn-settings-panel__label',
      for: `setting-${key}`,
    }, label);

    const select = createElement('select', {
      id: `setting-${key}`,
      class: 'tn-settings-panel__select',
      'aria-label': label,
    }) as HTMLSelectElement;

    for (const opt of options) {
      const option = createElement('option', { value: opt.value }, opt.label);
      if (opt.value === current) option.setAttribute('selected', '');
      select.appendChild(option);
    }

    select.addEventListener('change', () => {
      (this.state as unknown as Record<string, unknown>)[key] = select.value;
      this.emitChange(key, select.value);
    });

    row.appendChild(lbl);
    row.appendChild(select);
    return row;
  }

  private createSlider(
    key: string,
    label: string,
    value: number,
    min: number,
    max: number,
    step: number,
  ): HTMLElement {
    const row = createElement('div', { class: 'tn-settings-panel__row tn-settings-panel__row--slider' });
    const lbl = createElement('label', {
      class: 'tn-settings-panel__label',
      for: `setting-${key}`,
    }, `${label}: ${value.toFixed(1)}x`);

    const input = createElement('input', {
      type: 'range',
      id: `setting-${key}`,
      class: 'tn-settings-panel__slider',
      min: String(min),
      max: String(max),
      step: String(step),
      value: String(value),
      'aria-label': label,
    }) as HTMLInputElement;

    input.addEventListener('input', () => {
      const val = parseFloat(input.value);
      (this.state as unknown as Record<string, unknown>)[key] = val;
      lbl.textContent = `${label}: ${val.toFixed(1)}x`;
      this.emitChange(key, val);
    });

    row.appendChild(lbl);
    row.appendChild(input);
    return row;
  }

  private emitChange(key: string, value: unknown): void {
    eventBus.emit('settings:changed', { key, value });
    this.onSettingChange?.(key, value);
  }

  toggle(): void {
    this.visible = !this.visible;
    if (this.panel) {
      this.panel.classList.toggle('tn-panel--visible', this.visible);
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  dispose(): void {
    this.panel?.remove();
    this.panel = null;
    this.onSettingChange = null;
  }
}
