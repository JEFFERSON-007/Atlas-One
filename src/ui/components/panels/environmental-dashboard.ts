/**
 * Environmental Dashboard — Collapsible panel showing global environmental metrics.
 * Shows: Temperature · AQI · Active Fires · Flood Alerts · Sea Surface Temp · Snow/Ice · Vegetation
 */

import { createElement } from '../../../utils/dom';
import { createLogger } from '../../../utils/logger';
import { eventBus } from '../../../hooks/use-event-bus';
import type { EnvironmentalDataEngine } from '../../../environment/engine/environmental-data-engine';
import { EnvironmentalVariable, DataState } from '../../../environment/types/environmental.types';

const log = createLogger('EnvironmentalDashboard');

interface DashboardMetric {
  label: string;
  icon: string;
  variable: EnvironmentalVariable;
  unit: string;
  value: string;
  dataState: DataState;
}

export class EnvironmentalDashboard {
  private container: HTMLElement | null = null;
  private visible = false;
  private engine: EnvironmentalDataEngine | null = null;

  private metrics: DashboardMetric[] = [
    { label: 'Temperature', icon: '🌡️', variable: EnvironmentalVariable.Temperature, unit: '°C', value: '—', dataState: DataState.UNAVAILABLE },
    { label: 'Air Quality', icon: '🏭', variable: EnvironmentalVariable.PM25, unit: 'µg/m³', value: '—', dataState: DataState.UNAVAILABLE },
    { label: 'Active Fires', icon: '🔥', variable: EnvironmentalVariable.FireRadiativePower, unit: '', value: '—', dataState: DataState.UNAVAILABLE },
    { label: 'Precipitation', icon: '🌧️', variable: EnvironmentalVariable.Precipitation, unit: 'mm', value: '—', dataState: DataState.UNAVAILABLE },
    { label: 'Wind Speed', icon: '💨', variable: EnvironmentalVariable.WindSpeed, unit: 'm/s', value: '—', dataState: DataState.UNAVAILABLE },
    { label: 'Snow Cover', icon: '❄️', variable: EnvironmentalVariable.SnowCover, unit: 'cm', value: '—', dataState: DataState.UNAVAILABLE },
    { label: 'Sea Surface', icon: '🌊', variable: EnvironmentalVariable.SeaSurfaceTemperature, unit: '°C', value: '—', dataState: DataState.UNAVAILABLE },
  ];

  init(overlayId: string, engine?: EnvironmentalDataEngine): void {
    this.engine = engine ?? null;
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;

    this.container = createElement('div', {
      id: 'environmental-dashboard',
      style: `
        position: absolute;
        top: 4.5rem;
        right: 1rem;
        width: 260px;
        display: none;
        flex-direction: column;
        gap: 4px;
        padding: 14px 16px;
        background: rgba(10, 12, 18, 0.92);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        z-index: 100;
        font-family: 'Inter', system-ui, sans-serif;
        color: rgba(255, 255, 255, 0.9);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
        transition: opacity 0.3s ease, transform 0.3s ease;
        opacity: 0;
        transform: translateX(10px);
      `,
    });

    // Header
    const header = createElement('div', {
      style: `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
        padding-bottom: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      `,
    });
    header.innerHTML = `
      <span style="font-size: 0.72rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #4caf50;">
        🌍 Environmental Monitor
      </span>
      <button id="env-dashboard-close" style="
        background: none; border: none; color: rgba(255,255,255,0.4);
        cursor: pointer; font-size: 1rem; padding: 0 2px;
      ">✕</button>
    `;
    this.container.appendChild(header);

    // Metric rows
    for (const metric of this.metrics) {
      const row = createElement('div', {
        class: 'env-metric-row',
        'data-variable': metric.variable,
        style: `
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 5px 4px;
          border-radius: 6px;
          transition: background 0.2s;
          cursor: pointer;
        `,
      });
      row.innerHTML = `
        <span style="font-size: 0.68rem; opacity: 0.7;">${metric.icon} ${metric.label}</span>
        <span class="env-metric-value" style="font-size: 0.72rem; font-weight: 500; font-variant-numeric: tabular-nums;">
          ${metric.value} ${metric.unit}
        </span>
      `;

      // Hover effect
      row.addEventListener('mouseenter', () => {
        row.style.background = 'rgba(255, 255, 255, 0.04)';
      });
      row.addEventListener('mouseleave', () => {
        row.style.background = 'none';
      });

      this.container.appendChild(row);
    }

    // Footer
    const footer = createElement('div', {
      style: `
        margin-top: 6px;
        padding-top: 6px;
        border-top: 1px solid rgba(255, 255, 255, 0.06);
        font-size: 0.58rem;
        opacity: 0.4;
        text-align: center;
      `,
    });
    footer.textContent = 'Press E to toggle · Data from Open-Meteo, OpenAQ';
    this.container.appendChild(footer);

    overlay.appendChild(this.container);

    // Close button
    document.getElementById('env-dashboard-close')?.addEventListener('click', () => {
      this.hide();
    });

    // Listen for data updates
    eventBus.on('environment:data-loaded', () => {
      this.refreshMetrics();
    });

    log.info('Environmental dashboard initialized');
  }

  show(): void {
    if (!this.container) return;
    this.visible = true;
    this.container.style.display = 'flex';
    requestAnimationFrame(() => {
      if (this.container) {
        this.container.style.opacity = '1';
        this.container.style.transform = 'translateX(0)';
      }
    });
    this.refreshMetrics();
  }

  hide(): void {
    if (!this.container) return;
    this.visible = false;
    this.container.style.opacity = '0';
    this.container.style.transform = 'translateX(10px)';
    setTimeout(() => {
      if (this.container && !this.visible) {
        this.container.style.display = 'none';
      }
    }, 300);
  }

  toggle(): void {
    if (this.visible) this.hide();
    else this.show();
  }

  isVisible(): boolean {
    return this.visible;
  }

  private refreshMetrics(): void {
    if (!this.engine || !this.container) return;

    for (const metric of this.metrics) {
      const cached = this.engine.getCachedObservations(metric.variable);
      const row = this.container.querySelector(`[data-variable="${metric.variable}"]`);
      if (!row) continue;

      const valueEl = row.querySelector('.env-metric-value') as HTMLElement | null;
      if (!valueEl) continue;

      if (cached.length > 0) {
        const avg = cached.reduce((s, o) => s + o.value, 0) / cached.length;
        metric.value = avg.toFixed(1);
        metric.dataState = cached[0].dataState;
        valueEl.textContent = `${metric.value} ${metric.unit}`;
        valueEl.style.color = 'rgba(255, 255, 255, 0.9)';
      } else {
        valueEl.textContent = `— ${metric.unit}`;
        valueEl.style.color = 'rgba(255, 255, 255, 0.3)';
      }
    }
  }

  dispose(): void {
    if (this.container?.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
    this.container = null;
    this.engine = null;
  }
}
