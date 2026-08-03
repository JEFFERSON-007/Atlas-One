/**
 * EventListPanel — Scrollable sorted list of all active events.
 * Grouped by event type with collapsible sections, sortable, clickable.
 */

import type { EarthEvent, EventType } from '../../../events/earth-event.types';
import { EVENT_ICONS, EVENT_TYPE_COLORS } from '../../../events/earth-event.types';
import { eventBus } from '../../../hooks/use-event-bus';
import { createLogger } from '../../../utils/logger';
import { safeQuerySelector, createDOMElement } from '../../../utils/dom';

const log = createLogger('EventListPanel');

type SortMode = 'time' | 'severity' | 'magnitude';

/** Severity sort order. */
const SEVERITY_ORDER: Record<string, number> = {
  extreme: 5, severe: 4, major: 3, moderate: 2, minor: 1, info: 0,
};

/**
 * Panel showing a filterable list of all active events.
 */
export class EventListPanel {
  private container: HTMLElement | null = null;
  private visible = false;
  private events: EarthEvent[] = [];
  private sortMode: SortMode = 'time';
  private collapsedTypes = new Set<string>();
  private getEvents: (() => EarthEvent[]) | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Initializes the event list panel.
   */
  init(parentId: string, eventGetter: () => EarthEvent[]): void {
    const parent = safeQuerySelector(`#${parentId}`);
    if (!parent) return;

    this.getEvents = eventGetter;

    this.container = createDOMElement('div', {
      id: 'event-list-panel',
      className: 'ao-panel ao-panel--left ao-event-list-panel',
    });
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    // Auto-refresh every 15s when visible
    this.refreshTimer = setInterval(() => {
      if (this.visible) this.refresh();
    }, 15_000);

    log.info('Event list panel initialized');
  }

  /**
   * Refreshes the panel with latest events.
   */
  refresh(): void {
    if (!this.getEvents) return;
    this.events = this.getEvents();
    this.render();
  }

  show(): void {
    if (this.container) {
      this.refresh();
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
    if (this.visible) {
      this.hide();
    } else {
      this.show();
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  dispose(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
    this.container?.remove();
    this.container = null;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private render(): void {
    if (!this.container) return;

    const sorted = this.sortEvents(this.events);
    const grouped = this.groupByType(sorted);

    this.container.innerHTML = `
      <div class="ao-panel__header">
        <div class="ao-panel__title">📋 Events (${this.events.length})</div>
        <button class="ao-panel__close" id="event-list-close" aria-label="Close">✕</button>
      </div>
      <div class="ao-event-list__controls">
        <div class="ao-event-list__sort">
          <button class="ao-btn-sm ${this.sortMode === 'time' ? 'ao-btn-sm--active' : ''}" data-sort="time">Time</button>
          <button class="ao-btn-sm ${this.sortMode === 'severity' ? 'ao-btn-sm--active' : ''}" data-sort="severity">Severity</button>
          <button class="ao-btn-sm ${this.sortMode === 'magnitude' ? 'ao-btn-sm--active' : ''}" data-sort="magnitude">Magnitude</button>
        </div>
      </div>
      <div class="ao-panel__body ao-event-list__body">
        ${this.renderGroups(grouped)}
      </div>
    `;

    // Wire close button
    this.container.querySelector('#event-list-close')?.addEventListener('click', () => {
      this.hide();
    });

    // Wire sort buttons
    this.container.querySelectorAll('[data-sort]').forEach((btn) => {
      btn.addEventListener('click', () => {
        this.sortMode = (btn as HTMLElement).dataset['sort'] as SortMode;
        this.render();
      });
    });

    // Wire type collapse toggles
    this.container.querySelectorAll('[data-type-toggle]').forEach((header) => {
      header.addEventListener('click', () => {
        const type = (header as HTMLElement).dataset['typeToggle']!;
        if (this.collapsedTypes.has(type)) {
          this.collapsedTypes.delete(type);
        } else {
          this.collapsedTypes.add(type);
        }
        this.render();
      });
    });

    // Wire event clicks
    this.container.querySelectorAll('[data-event-id]').forEach((item) => {
      item.addEventListener('click', () => {
        const eventId = (item as HTMLElement).dataset['eventId']!;
        eventBus.emit('event:select', { eventId });
        const event = this.events.find((e) => e.id === eventId);
        if (event) {
          eventBus.emit('camera:flyTo', {
            lat: event.latitude,
            lng: event.longitude,
            altitude: 1_000_000,
          });
        }
      });
    });
  }

  private renderGroups(grouped: Map<string, EarthEvent[]>): string {
    let html = '';
    for (const [type, events] of grouped) {
      const icon = EVENT_ICONS[type as EventType] || '📌';
      const color = EVENT_TYPE_COLORS[type as EventType] || '#94a3b8';
      const isCollapsed = this.collapsedTypes.has(type);

      html += `
        <div class="ao-event-group">
          <div class="ao-event-group__header" data-type-toggle="${type}">
            <span class="ao-event-group__icon">${icon}</span>
            <span class="ao-event-group__name">${type.charAt(0).toUpperCase() + type.slice(1)}</span>
            <span class="ao-event-group__count" style="background:${color}">${events.length}</span>
            <span class="ao-event-group__chevron">${isCollapsed ? '▸' : '▾'}</span>
          </div>
          ${isCollapsed ? '' : `
            <div class="ao-event-group__items">
              ${events.slice(0, 100).map((e) => this.renderEventItem(e)).join('')}
              ${events.length > 100 ? `<div class="ao-event-list__more">+${events.length - 100} more</div>` : ''}
            </div>
          `}
        </div>
      `;
    }
    return html || '<div class="ao-event-list__empty">No events active</div>';
  }

  private renderEventItem(event: EarthEvent): string {
    const timeAgo = this.formatTimeAgo(event.timestamp);
    const mag = event.metadata['magnitude'] as number | undefined;
    const magStr = mag !== undefined ? ` M${mag.toFixed(1)}` : '';

    return `
      <div class="ao-event-item" data-event-id="${event.id}">
        <div class="ao-event-item__severity" style="background:${event.color}"></div>
        <div class="ao-event-item__content">
          <div class="ao-event-item__title">${event.title}${magStr}</div>
          <div class="ao-event-item__meta">${timeAgo} · ${event.severity}</div>
        </div>
      </div>
    `;
  }

  private sortEvents(events: EarthEvent[]): EarthEvent[] {
    const sorted = [...events];
    switch (this.sortMode) {
      case 'time':
        return sorted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      case 'severity':
        return sorted.sort((a, b) => (SEVERITY_ORDER[b.severity] ?? 0) - (SEVERITY_ORDER[a.severity] ?? 0));
      case 'magnitude':
        return sorted.sort((a, b) => {
          const magA = (a.metadata['magnitude'] as number) ?? 0;
          const magB = (b.metadata['magnitude'] as number) ?? 0;
          return magB - magA;
        });
      default:
        return sorted;
    }
  }

  private groupByType(events: EarthEvent[]): Map<string, EarthEvent[]> {
    const groups = new Map<string, EarthEvent[]>();
    for (const event of events) {
      if (!groups.has(event.type)) {
        groups.set(event.type, []);
      }
      groups.get(event.type)!.push(event);
    }
    return groups;
  }

  private formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }
}
