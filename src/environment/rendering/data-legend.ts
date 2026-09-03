/**
 * Data Legend — Dynamic legend that updates based on the active environmental dataset.
 * Emits events for UI synchronization.
 */

import { createElement } from '../../utils/dom';
import { createLogger } from '../../utils/logger';
import { eventBus } from '../../hooks/use-event-bus';
import type { EnvironmentalLegend } from '../types/environmental.types';
import { DataState } from '../types/environmental.types';

const log = createLogger('DataLegend');

const DATA_STATE_LABELS: Record<DataState, string> = {
  [DataState.LIVE]: '● LIVE',
  [DataState.HISTORICAL]: '◆ HISTORICAL',
  [DataState.FORECAST]: '◇ FORECAST',
  [DataState.SIMULATED]: '○ SIMULATED',
  [DataState.DERIVED]: '◈ DERIVED',
  [DataState.UNAVAILABLE]: '✕ UNAVAILABLE',
};

export class DataLegend {
  private container: HTMLElement | null = null;

  init(parentId: string): void {
    const parent = document.getElementById(parentId);
    if (!parent) return;

    this.container = createElement('div', {
      id: 'environmental-legend',
      style: `
        position: absolute;
        bottom: 5rem;
        right: 1rem;
        width: 200px;
        display: none;
        flex-direction: column;
        gap: 6px;
        padding: 10px 12px;
        background: rgba(10, 12, 18, 0.88);
        backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        z-index: 90;
        font-family: 'Inter', system-ui, sans-serif;
        font-size: 0.7rem;
        color: rgba(255, 255, 255, 0.85);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
      `,
    });

    parent.appendChild(this.container);

    // Listen for legend updates
    eventBus.on('environment:legend-update', (legend: EnvironmentalLegend) => {
      this.updateLegend(legend);
    });

    eventBus.on('environment:legend-hide', () => {
      this.hide();
    });

    log.info('Data legend initialized');
  }

  private updateLegend(legend: EnvironmentalLegend): void {
    if (!this.container) return;

    const stateLabel = DATA_STATE_LABELS[legend.dataState] ?? 'UNKNOWN';
    const stateColor = legend.dataState === DataState.LIVE ? '#4caf50' :
                        legend.dataState === DataState.FORECAST ? '#ff9800' :
                        legend.dataState === DataState.UNAVAILABLE ? '#f44336' : '#90caf9';

    const timestampStr = legend.timestamp
      ? legend.timestamp.toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      : '—';

    // Build gradient bar from color stops
    const gradientStops = legend.stops
      .map((s, i) => `${s.color} ${(i / (legend.stops.length - 1)) * 100}%`)
      .join(', ');

    this.container.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <strong style="letter-spacing: 0.04em;">${legend.title}</strong>
        <span style="color: ${stateColor}; font-size: 0.6rem;">${stateLabel}</span>
      </div>
      <div style="
        height: 10px;
        border-radius: 4px;
        background: linear-gradient(to right, ${gradientStops});
        margin: 4px 0;
      "></div>
      <div style="display: flex; justify-content: space-between; font-size: 0.6rem; opacity: 0.7;">
        <span>${legend.min.toFixed(1)} ${legend.unit}</span>
        <span>${legend.max.toFixed(1)} ${legend.unit}</span>
      </div>
      <div style="font-size: 0.58rem; opacity: 0.5; margin-top: 2px;">
        Updated: ${timestampStr}
      </div>
    `;

    this.container.style.display = 'flex';
  }

  hide(): void {
    if (this.container) this.container.style.display = 'none';
  }

  show(): void {
    if (this.container) this.container.style.display = 'flex';
  }

  dispose(): void {
    if (this.container?.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
    this.container = null;
  }
}
