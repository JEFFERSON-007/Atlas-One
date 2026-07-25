/**
 * LayersPanel — Toggleable layer controls with switch UI.
 */

import { createElement } from '../../../utils/dom';
import type { LayerRegistry } from '../../../layers/layer-registry';
import { createLogger } from '../../../utils/logger';

const log = createLogger('LayersPanel');

/**
 * Panel displaying all registered layers with toggle switches.
 */
export class LayersPanel {
  private panel: HTMLElement | null = null;
  private visible = false;

  /**
   * Initializes the layers panel.
   *
   * @param parentId - Parent container ID
   * @param registry - Layer registry instance
   */
  init(parentId: string, registry: LayerRegistry): void {
    const parent = document.getElementById(parentId);
    if (!parent) return;

    this.panel = createElement('div', {
      id: 'layers-panel',
      class: 'tn-panel tn-layers-panel',
      role: 'dialog',
      'aria-label': 'Map layers',
    });

    const header = createElement(
      'div',
      { class: 'tn-panel__header' },
      createElement('h2', { class: 'tn-panel__title' }, 'Layers'),
    );

    const closeBtn = createElement('button', {
      class: 'tn-panel__close',
      'aria-label': 'Close layers panel',
      type: 'button',
    }, '×');
    closeBtn.addEventListener('click', () => this.toggle());
    header.appendChild(closeBtn);

    this.panel.appendChild(header);

    // Render layer toggles
    const list = createElement('div', { class: 'tn-layers-panel__list' });

    for (const layer of registry.getAll()) {
      const item = createElement('div', {
        class: 'tn-layers-panel__item',
      });

      const label = createElement('label', {
        class: 'tn-layers-panel__label',
        for: `layer-toggle-${layer.metadata.id}`,
      });

      const icon = createElement('span', {
        class: 'tn-layers-panel__icon',
        'aria-hidden': 'true',
      }, layer.metadata.icon);

      const text = createElement('span', {
        class: 'tn-layers-panel__text',
      }, layer.metadata.name);

      label.appendChild(icon);
      label.appendChild(text);

      // Toggle switch
      const toggle = createElement('input', {
        type: 'checkbox',
        id: `layer-toggle-${layer.metadata.id}`,
        class: 'tn-toggle-input',
        role: 'switch',
        'aria-label': `Toggle ${layer.metadata.name}`,
      }) as HTMLInputElement;

      toggle.checked = layer.isEnabled();

      toggle.addEventListener('change', () => {
        registry.toggle(layer.metadata.id);
      });

      const switchEl = createElement('div', { class: 'tn-toggle-switch' });
      switchEl.appendChild(toggle);
      switchEl.appendChild(createElement('span', { class: 'tn-toggle-slider' }));

      item.appendChild(label);
      item.appendChild(switchEl);
      list.appendChild(item);
    }

    this.panel.appendChild(list);
    parent.appendChild(this.panel);

    log.info('Layers panel initialized');
  }

  /**
   * Toggles panel visibility.
   */
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
  }
}
