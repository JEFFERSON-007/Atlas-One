/**
 * Toolbar — Primary navigation toolbar with glassmorphism styling.
 * Contains icon buttons for Search, Layers, Home, Settings, Fullscreen, and Coordinates.
 */

import { createElement } from '../../../utils/dom';
import { eventBus } from '../../../hooks/use-event-bus';
import { createLogger } from '../../../utils/logger';

const log = createLogger('Toolbar');

export interface ToolbarButton {
  id: string;
  label: string;
  icon: string;
  action: () => void;
  toggle?: boolean;
}

/**
 * Creates and manages the main toolbar.
 */
export class Toolbar {
  private container: HTMLElement | null = null;
  private buttons: Map<string, HTMLButtonElement> = new Map();

  /**
   * Initializes the toolbar and appends it to the UI overlay.
   *
   * @param parentId - ID of the parent container
   * @param onButtonClick - Callback when a toolbar button is clicked
   */
  init(
    parentId: string,
    onButtonClick: (buttonId: string) => void,
  ): void {
    const parent = document.getElementById(parentId);
    if (!parent) return;

    this.container = createElement('nav', {
      id: 'toolbar',
      class: 'tn-toolbar',
      role: 'toolbar',
      'aria-label': 'Main navigation toolbar',
    });

    const toolbarButtons: ToolbarButton[] = [
      {
        id: 'btn-search',
        label: 'Search locations',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
        action: () => onButtonClick('search'),
      },
      {
        id: 'btn-layers',
        label: 'Toggle layers',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>`,
        action: () => onButtonClick('layers'),
      },
      {
        id: 'btn-ai-assistant',
        label: 'AI Assistant',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/><circle cx="12" cy="12" r="4"/></svg>`,
        action: () => onButtonClick('btn-ai-assistant'),
      },
      {
        id: 'btn-info',
        label: 'Location information',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
        action: () => onButtonClick('info'),
      },
      {
        id: 'btn-analytics',
        label: 'Earth Intelligence Analytics',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
        action: () => onButtonClick('analytics'),
      },
      {
        id: 'btn-events-list',
        label: 'Active Events List',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>`,
        action: () => onButtonClick('events-list'),
      },
      {
        id: 'btn-mobility-analytics',
        label: 'Mobility Intelligence Dashboard',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z"/><path d="M12 6v6l4 2"/></svg>`,
        action: () => onButtonClick('mobility-analytics'),
      },
      {
        id: 'btn-mobility-list',
        label: 'Dynamic Objects List',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.2c.3.4.8.5 1.3.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>`,
        action: () => onButtonClick('mobility-list'),
      },
      {
        id: 'btn-mobility-filter',
        label: 'Filter Mobility Objects',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
        action: () => onButtonClick('mobility-filter'),
      },
      {
        id: 'btn-digital-twin',
        label: 'Global Digital Twin Intelligence',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="6" x2="9.01" y2="6"/><line x1="15" y1="6" x2="15.01" y2="6"/><line x1="9" y1="10" x2="9.01" y2="10"/><line x1="15" y1="10" x2="15.01" y2="10"/><line x1="9" y1="14" x2="9.01" y2="14"/><line x1="15" y1="14" x2="15.01" y2="14"/><line x1="9" y1="18" x2="15" y2="18"/></svg>`,
        action: () => onButtonClick('digital-twin'),
      },
      {
        id: 'btn-country-intel',
        label: 'Country & City Intelligence',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
        action: () => onButtonClick('country-intel'),
      },
      {
        id: 'btn-sensor-mode',
        label: 'Visual Sensor Modes (GLSL)',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        action: () => onButtonClick('sensor-mode'),
      },
      {
        id: 'btn-share',
        label: 'Share Current State',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>`,
        action: () => onButtonClick('share'),
      },
      {
        id: 'btn-home',
        label: 'Reset to home view',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
        action: () => {
          eventBus.emit('camera:reset');
          onButtonClick('home');
        },
      },
      {
        id: 'btn-settings',
        label: 'Settings',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
        action: () => onButtonClick('settings'),
      },
      {
        id: 'btn-fullscreen',
        label: 'Toggle fullscreen',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`,
        action: () => {
          this.toggleFullscreen();
          onButtonClick('fullscreen');
        },
      },
      {
        id: 'btn-coordinates',
        label: 'Show coordinates',
        icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="10" r="3"/><path d="M12 21.7C17.3 17 20 13 20 10a8 8 0 1 0-16 0c0 3 2.7 7 8 11.7z"/></svg>`,
        action: () => onButtonClick('coordinates'),
        toggle: true,
      },
    ];

    for (const btn of toolbarButtons) {
      const button = createElement('button', {
        id: btn.id,
        class: 'tn-toolbar__btn',
        'aria-label': btn.label,
        title: btn.label,
        type: 'button',
      });
      button.innerHTML = btn.icon;
      button.addEventListener('click', btn.action);
      this.container.appendChild(button);
      this.buttons.set(btn.id, button);
    }

    parent.appendChild(this.container);
    log.info('Toolbar initialized');
  }

  /**
   * Sets the active/pressed state of a toolbar button.
   */
  setActive(buttonId: string, active: boolean): void {
    const btn = this.buttons.get(buttonId);
    if (btn) {
      btn.classList.toggle('tn-toolbar__btn--active', active);
      btn.setAttribute('aria-pressed', String(active));
    }
  }

  /**
   * Toggles browser fullscreen mode.
   */
  private toggleFullscreen(): void {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        eventBus.emit('notification:show', {
          message: 'Fullscreen not supported in this browser',
          type: 'warn',
        });
      });
    } else {
      document.exitFullscreen().catch(() => {/* ignore */});
    }
  }

  /**
   * Cleans up the toolbar.
   */
  dispose(): void {
    this.container?.remove();
    this.container = null;
    this.buttons.clear();
  }
}
