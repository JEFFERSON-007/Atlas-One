/**
 * Climate Analytics Panel — Time-series chart + statistics for environmental data.
 * Uses vanilla <canvas> 2D for line/area charts.
 */

import { createElement } from '../../../utils/dom';
import { createLogger } from '../../../utils/logger';
import { EnvironmentalAnalyticsEngine, type TimeSeriesPoint } from '../../../environment/analytics/environmental-analytics-engine';

const log = createLogger('ClimateAnalyticsPanel');

export class ClimateAnalyticsPanel {
  private container: HTMLElement | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private visible = false;
  private analyticsEngine = new EnvironmentalAnalyticsEngine();

  init(overlayId: string): void {
    const overlay = document.getElementById(overlayId);
    if (!overlay) return;

    this.container = createElement('div', {
      id: 'climate-analytics-panel',
      style: `
        position: absolute;
        top: 4.5rem;
        left: 22rem;
        width: 420px;
        height: 320px;
        display: none;
        flex-direction: column;
        padding: 14px 16px;
        background: rgba(10, 12, 18, 0.94);
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.06);
        border-radius: 12px;
        z-index: 100;
        font-family: 'Inter', system-ui, sans-serif;
        color: rgba(255, 255, 255, 0.9);
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      `,
    });

    // Header
    const header = createElement('div', {
      style: `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
        padding-bottom: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
      `,
    });
    header.innerHTML = `
      <span style="font-size: 0.72rem; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: #80cbc4;">
        📊 Climate Analytics
      </span>
      <button id="climate-analytics-close" style="
        background: none; border: none; color: rgba(255,255,255,0.4);
        cursor: pointer; font-size: 1rem; padding: 0 2px;
      ">✕</button>
    `;
    this.container.appendChild(header);

    // Stats row
    const statsRow = createElement('div', {
      id: 'climate-stats-row',
      style: `
        display: flex;
        gap: 12px;
        margin-bottom: 10px;
        font-size: 0.62rem;
      `,
    });
    statsRow.innerHTML = `
      <div style="flex:1; text-align: center;">
        <div style="opacity: 0.5;">MIN</div>
        <div id="climate-stat-min" style="font-weight: 600; font-variant-numeric: tabular-nums;">—</div>
      </div>
      <div style="flex:1; text-align: center;">
        <div style="opacity: 0.5;">MEAN</div>
        <div id="climate-stat-mean" style="font-weight: 600; font-variant-numeric: tabular-nums;">—</div>
      </div>
      <div style="flex:1; text-align: center;">
        <div style="opacity: 0.5;">MAX</div>
        <div id="climate-stat-max" style="font-weight: 600; font-variant-numeric: tabular-nums;">—</div>
      </div>
      <div style="flex:1; text-align: center;">
        <div style="opacity: 0.5;">MEDIAN</div>
        <div id="climate-stat-median" style="font-weight: 600; font-variant-numeric: tabular-nums;">—</div>
      </div>
      <div style="flex:1; text-align: center;">
        <div style="opacity: 0.5;">Δ%</div>
        <div id="climate-stat-change" style="font-weight: 600; font-variant-numeric: tabular-nums;">—</div>
      </div>
    `;
    this.container.appendChild(statsRow);

    // Canvas for chart
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'climate-chart-canvas';
    Object.assign(this.canvas.style, {
      width: '100%',
      height: '180px',
      borderRadius: '8px',
      background: 'rgba(255, 255, 255, 0.02)',
    });
    this.canvas.width = 388;
    this.canvas.height = 180;
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');

    overlay.appendChild(this.container);

    // Close button
    document.getElementById('climate-analytics-close')?.addEventListener('click', () => {
      this.hide();
    });

    log.info('Climate analytics panel initialized');
  }

  /**
   * Plots a time series on the canvas.
   */
  plotTimeSeries(points: TimeSeriesPoint[], label: string, unit: string, color = '#80cbc4'): void {
    if (!this.ctx || !this.canvas || points.length < 2) return;

    const w = this.canvas.width;
    const h = this.canvas.height;
    const padding = { top: 15, right: 10, bottom: 25, left: 40 };
    const plotW = w - padding.left - padding.right;
    const plotH = h - padding.top - padding.bottom;

    // Clear
    this.ctx.clearRect(0, 0, w, h);

    const values = points.map(p => p.value);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const timeMin = points[0].timestamp.getTime();
    const timeMax = points[points.length - 1].timestamp.getTime();
    const timeRange = timeMax - timeMin || 1;

    // Grid lines
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    this.ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (plotH * i) / 4;
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, y);
      this.ctx.lineTo(w - padding.right, y);
      this.ctx.stroke();

      // Y-axis labels
      const yVal = max - (range * i) / 4;
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
      this.ctx.font = '9px Inter, system-ui';
      this.ctx.textAlign = 'right';
      this.ctx.fillText(yVal.toFixed(1), padding.left - 4, y + 3);
    }

    // Area fill
    this.ctx.beginPath();
    this.ctx.moveTo(padding.left, padding.top + plotH);
    for (let i = 0; i < points.length; i++) {
      const x = padding.left + ((points[i].timestamp.getTime() - timeMin) / timeRange) * plotW;
      const y = padding.top + plotH - ((points[i].value - min) / range) * plotH;
      this.ctx.lineTo(x, y);
    }
    this.ctx.lineTo(padding.left + plotW, padding.top + plotH);
    this.ctx.closePath();
    this.ctx.fillStyle = color + '18';
    this.ctx.fill();

    // Line
    this.ctx.beginPath();
    for (let i = 0; i < points.length; i++) {
      const x = padding.left + ((points[i].timestamp.getTime() - timeMin) / timeRange) * plotW;
      const y = padding.top + plotH - ((points[i].value - min) / range) * plotH;
      if (i === 0) this.ctx.moveTo(x, y);
      else this.ctx.lineTo(x, y);
    }
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.5;
    this.ctx.stroke();

    // Label
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = '9px Inter, system-ui';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`${label} (${unit})`, w / 2, h - 4);

    // Update stats
    const stats = this.analyticsEngine.computeStatistics(
      points.map(p => ({
        id: '',
        dataset: '',
        variable: '' as never,
        latitude: 0,
        longitude: 0,
        altitude: null,
        value: p.value,
        unit,
        timestamp: p.timestamp,
        startTime: null,
        endTime: null,
        resolution: null,
        source: '',
        quality: 'high' as never,
        confidence: 1,
        dataState: 'LIVE' as never,
        metadata: {},
      })),
      label,
    );

    this.updateStats(stats.min, stats.mean, stats.max, stats.median, stats.percentChange, unit);
  }

  private updateStats(
    min: number,
    mean: number,
    max: number,
    median: number,
    percentChange: number | null,
    unit: string,
  ): void {
    const setEl = (id: string, text: string) => {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    };

    setEl('climate-stat-min', `${min.toFixed(1)} ${unit}`);
    setEl('climate-stat-mean', `${mean.toFixed(1)} ${unit}`);
    setEl('climate-stat-max', `${max.toFixed(1)} ${unit}`);
    setEl('climate-stat-median', `${median.toFixed(1)} ${unit}`);
    setEl('climate-stat-change', percentChange !== null ? `${percentChange > 0 ? '+' : ''}${percentChange.toFixed(1)}%` : '—');
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
    this.canvas = null;
    this.ctx = null;
  }
}
