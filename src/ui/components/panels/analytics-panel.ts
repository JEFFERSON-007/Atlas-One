/**
 * AnalyticsPanel — Real-time Earth Intelligence dashboard.
 * Displays global statistics, active event counters, severity breakdown,
 * and high-priority event alerts in a glassmorphic dashboard grid.
 */

import type { EarthEvent } from '../../../events/earth-event.types';
import { EventType, EventSeverity, EVENT_ICONS } from '../../../events/earth-event.types';
import { querySelectorSafe, createElement } from '../../../utils/dom';
import { createLogger } from '../../../utils/logger';

const log = createLogger('AnalyticsPanel');

/**
 * Analytics dashboard panel showing live natural event statistics.
 */
export class AnalyticsPanel {
  private container: HTMLElement | null = null;
  private visible = false;
  private getEvents: (() => EarthEvent[]) | null = null;
  private refreshTimer: ReturnType<typeof setInterval> | null = null;

  /**
   * Initializes the analytics panel.
   */
  init(parentId: string, eventGetter: () => EarthEvent[]): void {
    const parent = querySelectorSafe(`#${parentId}`);
    if (!parent) return;

    this.getEvents = eventGetter;

    this.container = createElement('div', {
      id: 'analytics-panel',
      class: 'ao-panel ao-panel--left ao-analytics-panel',
    });
    this.container.style.display = 'none';
    parent.appendChild(this.container);

    this.refreshTimer = setInterval(() => {
      if (this.visible) this.render();
    }, 10_000);

    log.info('Analytics panel initialized');
  }

  show(): void {
    if (this.container) {
      this.render();
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
    if (!this.container || !this.getEvents) return;

    const events = this.getEvents();
    const stats = this.computeStats(events);

    this.container.innerHTML = `
      <div class="ao-panel__header">
        <div class="ao-panel__title">📊 Earth Intelligence Dashboard</div>
        <button class="ao-panel__close" id="analytics-close" aria-label="Close">✕</button>
      </div>
      <div class="ao-panel__body ao-analytics__body">
        <!-- Stat Grid -->
        <div class="ao-analytics__grid">
          <div class="ao-stat-card">
            <div class="ao-stat-card__value" style="color: #60a5fa">${stats.total}</div>
            <div class="ao-stat-card__label">Active Events</div>
          </div>
          <div class="ao-stat-card">
            <div class="ao-stat-card__value" style="color: #f87171">${stats.earthquakes}</div>
            <div class="ao-stat-card__label">Earthquakes</div>
          </div>
          <div class="ao-stat-card">
            <div class="ao-stat-card__value" style="color: #fb923c">${stats.wildfires}</div>
            <div class="ao-stat-card__label">Wildfires</div>
          </div>
          <div class="ao-stat-card">
            <div class="ao-stat-card__value" style="color: #fbbf24">${stats.volcanoes}</div>
            <div class="ao-stat-card__label">Volcanoes</div>
          </div>
          <div class="ao-stat-card">
            <div class="ao-stat-card__value" style="color: #facc15">${stats.lightning}</div>
            <div class="ao-stat-card__label">Lightning Strikes</div>
          </div>
          <div class="ao-stat-card">
            <div class="ao-stat-card__value" style="color: #a78bfa">${stats.storms}</div>
            <div class="ao-stat-card__label">Severe Storms</div>
          </div>
        </div>

        <!-- Severity Breakdown -->
        <div class="ao-analytics__section">
          <div class="ao-analytics__section-title">Severity Breakdown</div>
          <div class="ao-severity-bar">
            ${this.renderSeverityBar(stats)}
          </div>
          <div class="ao-severity-legend">
            <span class="ao-legend-item"><i style="background:#dc2626"></i> Critical (${stats.critical})</span>
            <span class="ao-legend-item"><i style="background:#f87171"></i> Severe (${stats.severe})</span>
            <span class="ao-legend-item"><i style="background:#fb923c"></i> Major (${stats.major})</span>
            <span class="ao-legend-item"><i style="background:#34d399"></i> Minor (${stats.minor})</span>
          </div>
        </div>

        <!-- High Priority Highlights -->
        <div class="ao-analytics__section">
          <div class="ao-analytics__section-title">Critical & Major Alerts</div>
          <div class="ao-analytics__highlights">
            ${this.renderHighlights(stats.highPriorityEvents)}
          </div>
        </div>
      </div>
    `;

    this.container.querySelector('#analytics-close')?.addEventListener('click', () => {
      this.hide();
    });
  }

  private computeStats(events: EarthEvent[]) {
    let earthquakes = 0;
    let wildfires = 0;
    let volcanoes = 0;
    let lightning = 0;
    let storms = 0;
    let tsunamis = 0;

    let critical = 0;
    let severe = 0;
    let major = 0;
    let minor = 0;

    const highPriorityEvents: EarthEvent[] = [];

    for (const e of events) {
      switch (e.type) {
        case EventType.Earthquake: earthquakes++; break;
        case EventType.Wildfire: wildfires++; break;
        case EventType.Volcano: volcanoes++; break;
        case EventType.Lightning: lightning++; break;
        case EventType.Storm: storms++; break;
        case EventType.Tsunami: tsunamis++; break;
      }

      if (e.severity === EventSeverity.Extreme) critical++;
      else if (e.severity === EventSeverity.Severe) severe++;
      else if (e.severity === EventSeverity.Major) major++;
      else minor++;

      if (e.severity === EventSeverity.Extreme || e.severity === EventSeverity.Severe || e.severity === EventSeverity.Major) {
        highPriorityEvents.push(e);
      }
    }

    return {
      total: events.length,
      earthquakes,
      wildfires,
      volcanoes,
      lightning,
      storms,
      tsunamis,
      critical,
      severe,
      major,
      minor,
      highPriorityEvents: highPriorityEvents.slice(0, 5),
    };
  }

  private renderSeverityBar(stats: ReturnType<typeof this.computeStats>): string {
    const total = stats.total || 1;
    const critPct = (stats.critical / total) * 100;
    const sevPct = (stats.severe / total) * 100;
    const majPct = (stats.major / total) * 100;
    const minPct = (stats.minor / total) * 100;

    return `
      <div class="ao-severity-bar__fill" style="width:${critPct}%;background:#dc2626"></div>
      <div class="ao-severity-bar__fill" style="width:${sevPct}%;background:#f87171"></div>
      <div class="ao-severity-bar__fill" style="width:${majPct}%;background:#fb923c"></div>
      <div class="ao-severity-bar__fill" style="width:${minPct}%;background:#34d399"></div>
    `;
  }

  private renderHighlights(events: EarthEvent[]): string {
    if (events.length === 0) {
      return '<div class="ao-text-muted" style="font-size:0.85rem">No critical or major events active</div>';
    }

    return events
      .map((e) => {
        const icon = EVENT_ICONS[e.type] || '📌';
        return `
          <div class="ao-highlight-item" style="border-left: 3px solid ${e.color}">
            <span>${icon}</span>
            <div class="ao-highlight-item__info">
              <div class="ao-highlight-item__title">${e.title}</div>
              <div class="ao-text-muted" style="font-size:0.75rem">${e.description}</div>
            </div>
          </div>
        `;
      })
      .join('');
  }
}
