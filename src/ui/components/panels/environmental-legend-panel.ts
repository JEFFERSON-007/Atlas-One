/**
 * Environmental Legend Panel — Reactive legend that updates on environment:legend-update events.
 * Wraps the DataLegend renderer and integrates with UIManager's panel system.
 */

import { createElement } from '../../../utils/dom';
import { createLogger } from '../../../utils/logger';
import { eventBus } from '../../../hooks/use-event-bus';
import type { EnvironmentalLegend } from '../../../environment/types/environmental.types';
import { DataState } from '../../../environment/types/environmental.types';

const log = createLogger('EnvironmentalLegendPanel');

const DATA_STATE_COLORS: Record<DataState, string> = {
  [DataState.LIVE]: '#4caf50',
  [DataState.HISTORICAL]: '#90caf9',
  [DataState.FORECAST]: '#ff9800',
  [DataState.SIMULATED]: '#ce93d8',
  [DataState.DERIVED]: '#80deea',
  [DataState.UNAVAILABLE]: '#f44336',
};

export class EnvironmentalLegendPanel {
  private container: HTMLElement | null = null;
  private visible = false;

  init(overlayId: string): void {
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;

    this.container = createElement('div', {
      id: 'environmental-legend-panel',
      style: `
        position: absolute;
        bottom: 5.5rem;
        right: 1rem;
        width: 220px;
        display: none;
        flex-direction: column;
        gap: 8px;
        padding: 12px 14px;
        background: rgba(10, 12, 18, 0.90);
        backdrop-filter: blur(14px);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 10px;
        z-index: 90;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.85);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      `,
    });

    overlay.appendChild(this.container);

    eventBus.on('environment:legend-update', (legend: EnvironmentalLegend) => {
      this.updateLegend(legend);
      this.show();
    });

    eventBus.on('environment:legend-hide', () => {
      this.hide();
    });

    log.info('Environmental legend panel initialized');
  }

  private updateLegend(legend: EnvironmentalLegend): void {
    if (!this.container) return;

    const stateColor = DATA_STATE_COLORS[legend.dataState] ?? '#fff';
    const stateLabel = legend.dataState.toUpperCase();

    const timestamp = legend.timestamp
      ? legend.timestamp.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      : '—';

    const gradientStops = legend.stops
      .map((s, i) => `${s.color} ${(i / (legend.stops.length - 1)) * 100}%`)
      .join(', ');

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="letter-spacing: 0.04em; font-size: 0.72rem;">${legend.title}</strong>
        <span style="
          color: ${stateColor};
          font-size: 0.55rem;
          padding: 1px 6px;
          border: 1px solid ${stateColor}40;
          border-radius: 3px;
          letter-spacing: 0.05em;
        ">${stateLabel}</span>
      </div>
      <div style="
        height: 12px;
        border-radius: 4px;
        background: linear-gradient(to right, ${gradientStops});
        margin: 2px 0;
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.3);
      "></div>
      <div style="display: flex; justify-content: space-between; font-size: 0.6rem; opacity: 0.6;">
        <span>${legend.min.toFixed(1)} ${legend.unit}</span>
        <span>${legend.max.toFixed(1)} ${legend.unit}</span>
      </div>
      <div style="
        display: flex;
        justify-content: space-between;
        font-size: 0.55rem;
        opacity: 0.35;
        margin-top: 2px;
      ">
        <span>Updated: ${timestamp}</span>
        <span>${legend.stops.length} stops</span>
      </div>
    `;
  }

  show(): void {
    if (!this.container) return;
    this.visible = true;
    this.container.style.display = 'flex';
  }

  hide(): void {
    if (!this.container) return;
    this.visible = false;
    this.container.style.display = 'none';
  }

  toggle(): void {
    if (this.visible) this.hide();
    else this.show();
  }

  isVisible(): boolean {
    return this.visible;
  }

  dispose(): void {
    if (this.container?.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
    this.container = null;
  }
}
