/**
 * EventDetailPanel — Professional GIS-style panel showing full event details.
 * Opens when an event marker is clicked. Shows all metadata, coordinates,
 * timestamps, external links, and provider attribution.
 */

import { eventBus } from '../../../hooks/use-event-bus';
import type { EarthEvent } from '../../../events/earth-event.types';
import { EVENT_ICONS } from '../../../events/earth-event.types';
import { createLogger } from '../../../utils/logger';
import { safeQuerySelector, createDOMElement } from '../../../utils/dom';

const log = createLogger('EventDetailPanel');

/**
 * Side panel displaying detailed information about a selected Earth event.
 */
export class EventDetailPanel {
  private container: HTMLElement | null = null;
  private visible = false;
  private currentEvent: EarthEvent | null = null;
  private unsubscribers: Array<() => void> = [];
  private getEventById: ((id: string) => EarthEvent | undefined) | null = null;

  /**
   * Initializes the panel and subscribes to event selection events.
   *
   * @param parentId - Parent element ID
   * @param eventLookup - Function to look up events by ID from the store
   */
  init(parentId: string, eventLookup: (id: string) => EarthEvent | undefined): void {
    const parent = safeQuerySelector(`#${parentId}`);
    if (!parent) return;

    this.getEventById = eventLookup;

    this.container = createDOMElement('div', {
      id: 'event-detail-panel',
      className: 'ao-panel ao-panel--right ao-event-detail-panel',
    });
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    // Subscribe to event selection
    this.unsubscribers.push(
      eventBus.on('event:select', (payload) => {
        const event = this.getEventById?.(payload.eventId);
        if (event) {
          this.showEvent(event);
        }
      }),
    );

    this.unsubscribers.push(
      eventBus.on('event:deselect', () => {
        this.hide();
      }),
    );

    log.info('Event detail panel initialized');
  }

  /**
   * Displays details for a specific event.
   */
  showEvent(event: EarthEvent): void {
    this.currentEvent = event;
    this.render();
    this.show();
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
      this.currentEvent = null;
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
    for (const unsub of this.unsubscribers) {
      unsub();
    }
    this.unsubscribers = [];
    this.container?.remove();
    this.container = null;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private render(): void {
    if (!this.container || !this.currentEvent) return;
    const event = this.currentEvent;

    const icon = EVENT_ICONS[event.type] || '📌';
    const timeAgo = this.formatTimeAgo(event.timestamp);
    const severityClass = `ao-severity--${event.severity}`;

    this.container.innerHTML = `
      <div class="ao-panel__header">
        <div class="ao-panel__title">
          <span class="ao-event-icon">${icon}</span>
          Event Details
        </div>
        <button class="ao-panel__close" id="event-detail-close" aria-label="Close">✕</button>
      </div>
      <div class="ao-panel__body ao-event-detail__body">
        <div class="ao-event-detail__title">${event.title}</div>
        <div class="ao-event-detail__badges">
          <span class="ao-badge ${severityClass}">${event.severity.toUpperCase()}</span>
          <span class="ao-badge ao-badge--type">${event.type}</span>
          <span class="ao-badge ao-badge--status ao-badge--status-${event.status}">${event.status}</span>
        </div>

        <div class="ao-event-detail__section">
          <div class="ao-event-detail__label">Description</div>
          <div class="ao-event-detail__value">${event.description}</div>
        </div>

        <div class="ao-event-detail__section">
          <div class="ao-event-detail__label">Location</div>
          <div class="ao-event-detail__coords">
            <span>${event.latitude.toFixed(4)}° ${event.latitude >= 0 ? 'N' : 'S'}</span>
            <span>${event.longitude.toFixed(4)}° ${event.longitude >= 0 ? 'E' : 'W'}</span>
            <button class="ao-btn-icon ao-copy-btn" id="event-detail-copy-coords" 
              aria-label="Copy coordinates" title="Copy coordinates">📋</button>
          </div>
        </div>

        <div class="ao-event-detail__section">
          <div class="ao-event-detail__label">Time</div>
          <div class="ao-event-detail__value">
            ${event.timestamp.toLocaleString()}<br/>
            <span class="ao-text-muted">${timeAgo}</span>
          </div>
        </div>

        ${this.renderMetadata(event)}

        <div class="ao-event-detail__section">
          <div class="ao-event-detail__label">Source</div>
          <div class="ao-event-detail__value">
            <span class="ao-text-muted">${event.providerName}</span>
            ${event.source ? `<br/><a href="${event.source}" target="_blank" rel="noopener noreferrer" class="ao-link">View Source ↗</a>` : ''}
          </div>
        </div>

        <div class="ao-event-detail__section">
          <div class="ao-event-detail__label">Confidence</div>
          <div class="ao-event-detail__confidence">
            <div class="ao-progress-bar">
              <div class="ao-progress-bar__fill" style="width: ${Math.round(event.confidence * 100)}%"></div>
            </div>
            <span>${Math.round(event.confidence * 100)}%</span>
          </div>
        </div>

        <div class="ao-event-detail__actions">
          <button class="ao-btn ao-btn--primary" id="event-detail-fly-to">🎯 Fly To</button>
          <button class="ao-btn ao-btn--secondary" id="event-detail-share">📤 Share</button>
        </div>
      </div>
    `;

    // Wire event handlers
    this.container.querySelector('#event-detail-close')?.addEventListener('click', () => {
      this.hide();
    });

    this.container.querySelector('#event-detail-fly-to')?.addEventListener('click', () => {
      eventBus.emit('camera:flyTo', {
        lat: event.latitude,
        lng: event.longitude,
        altitude: 500_000,
      });
    });

    this.container.querySelector('#event-detail-copy-coords')?.addEventListener('click', () => {
      void navigator.clipboard.writeText(`${event.latitude.toFixed(6)}, ${event.longitude.toFixed(6)}`);
      eventBus.emit('notification:show', { message: 'Coordinates copied!', type: 'info' });
    });

    this.container.querySelector('#event-detail-share')?.addEventListener('click', () => {
      const url = `${window.location.origin}${window.location.pathname}#lat=${event.latitude}&lng=${event.longitude}`;
      void navigator.clipboard.writeText(url);
      eventBus.emit('notification:show', { message: 'Share link copied!', type: 'info' });
    });
  }

  private renderMetadata(event: EarthEvent): string {
    const entries = Object.entries(event.metadata).filter(
      ([key]) => !['sources', 'categories'].includes(key),
    );

    if (entries.length === 0) return '';

    const rows = entries
      .map(([key, value]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
        const display = typeof value === 'boolean'
          ? (value ? '✅ Yes' : '❌ No')
          : String(value);
        return `<tr><td class="ao-text-muted">${label}</td><td>${display}</td></tr>`;
      })
      .join('');

    return `
      <div class="ao-event-detail__section">
        <div class="ao-event-detail__label">Details</div>
        <table class="ao-event-detail__table">
          ${rows}
        </table>
      </div>
    `;
  }

  private formatTimeAgo(date: Date): string {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }
}
