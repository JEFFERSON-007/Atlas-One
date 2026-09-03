/**
 * Environmental Layer Renderer — CesiumJS primitives for environmental data visualization.
 * Supports raster/heatmap/grid/point rendering with color interpolation.
 */

import { Cartesian3, Color, type Viewer, PointPrimitiveCollection, LabelCollection, NearFarScalar } from 'cesium';
import { createLogger } from '../../utils/logger';
import { eventBus } from '../../hooks/use-event-bus';
import type { EnvironmentalObservation, EnvironmentalLegend, ColorStop } from '../types/environmental.types';
import { EnvironmentalVariable, DataState } from '../types/environmental.types';

const log = createLogger('EnvironmentalLayerRenderer');

/** Default color scales per variable. */
const COLOR_SCALES: Partial<Record<EnvironmentalVariable, ColorStop[]>> = {
  [EnvironmentalVariable.Temperature]: [
    { value: -40, color: '#1a237e', label: '-40°C' },
    { value: -20, color: '#1565c0' },
    { value: 0, color: '#4fc3f7', label: '0°C' },
    { value: 15, color: '#66bb6a' },
    { value: 25, color: '#fdd835', label: '25°C' },
    { value: 35, color: '#ef6c00' },
    { value: 50, color: '#b71c1c', label: '50°C' },
  ],
  [EnvironmentalVariable.PM25]: [
    { value: 0, color: '#4caf50', label: 'Good' },
    { value: 12, color: '#ffeb3b', label: 'Moderate' },
    { value: 35, color: '#ff9800', label: 'Unhealthy (SG)' },
    { value: 55, color: '#f44336', label: 'Unhealthy' },
    { value: 150, color: '#9c27b0', label: 'Very Unhealthy' },
    { value: 250, color: '#4a0072', label: 'Hazardous' },
  ],
  [EnvironmentalVariable.Precipitation]: [
    { value: 0, color: '#e3f2fd', label: '0 mm' },
    { value: 2, color: '#90caf9' },
    { value: 10, color: '#42a5f5' },
    { value: 25, color: '#1e88e5', label: '25 mm' },
    { value: 50, color: '#1565c0' },
    { value: 100, color: '#0d47a1', label: '100 mm' },
  ],
  [EnvironmentalVariable.WindSpeed]: [
    { value: 0, color: '#e8f5e9', label: 'Calm' },
    { value: 5, color: '#a5d6a7' },
    { value: 10, color: '#66bb6a' },
    { value: 20, color: '#fdd835', label: '20 m/s' },
    { value: 30, color: '#ff9800' },
    { value: 50, color: '#f44336', label: '50 m/s' },
  ],
  [EnvironmentalVariable.FireRadiativePower]: [
    { value: 0, color: '#fff9c4', label: 'Low' },
    { value: 50, color: '#ffcc02' },
    { value: 150, color: '#ff9800', label: 'Moderate' },
    { value: 500, color: '#f44336' },
    { value: 1000, color: '#b71c1c', label: 'Extreme' },
  ],
};

export class EnvironmentalLayerRenderer {
  private viewer: Viewer | null = null;
  private pointCollection: PointPrimitiveCollection | null = null;
  private labelCollection: LabelCollection | null = null;

  init(viewer: Viewer): void {
    this.viewer = viewer;
    this.pointCollection = new PointPrimitiveCollection();
    this.labelCollection = new LabelCollection();
    viewer.scene.primitives.add(this.pointCollection);
    viewer.scene.primitives.add(this.labelCollection);
    log.info('Environmental layer renderer initialized');
  }

  /**
   * Renders environmental observations as colored point primitives.
   */
  renderObservations(observations: EnvironmentalObservation[], variable: EnvironmentalVariable): void {
    if (!this.pointCollection || !this.labelCollection) return;

    this.clear();

    const scale = COLOR_SCALES[variable] ?? COLOR_SCALES[EnvironmentalVariable.Temperature]!;

    for (const obs of observations) {
      const color = this.interpolateColor(obs.value, scale);
      const position = Cartesian3.fromDegrees(obs.longitude, obs.latitude, (obs.altitude ?? 0) + 100);

      this.pointCollection.add({
        position,
        color,
        pixelSize: this.getPointSize(variable, obs.value),
        scaleByDistance: new NearFarScalar(1e4, 1.5, 1e7, 0.5),
      });
    }

    // Emit legend update
    const legend = this.buildLegend(variable, observations, scale);
    eventBus.emit('environment:legend-update', legend);

    log.info(`Rendered ${observations.length} ${variable} observations`);
  }

  /** Clears all rendered primitives. */
  clear(): void {
    if (this.pointCollection) this.pointCollection.removeAll();
    if (this.labelCollection) this.labelCollection.removeAll();
  }

  /** Builds a legend descriptor from current data. */
  private buildLegend(
    variable: EnvironmentalVariable,
    observations: EnvironmentalObservation[],
    scale: ColorStop[],
  ): EnvironmentalLegend {
    const values = observations.map(o => o.value);
    const min = values.length > 0 ? Math.min(...values) : (scale[0]?.value ?? 0);
    const max = values.length > 0 ? Math.max(...values) : (scale[scale.length - 1]?.value ?? 0);
    const unit = observations[0]?.unit ?? '';
    const dataState = observations[0]?.dataState ?? DataState.UNAVAILABLE;
    const timestamp = observations[0]?.timestamp ?? null;

    return {
      variable,
      title: this.getVariableTitle(variable),
      unit,
      min,
      max,
      stops: scale,
      dataState,
      timestamp,
    };
  }

  /** Interpolates color from a scale based on value. */
  private interpolateColor(value: number, scale: ColorStop[]): Color {
    if (scale.length === 0) return Color.WHITE;
    if (value <= (scale[0]?.value ?? 0)) return Color.fromCssColorString(scale[0]?.color ?? '#fff');
    if (value >= (scale[scale.length - 1]?.value ?? 0)) return Color.fromCssColorString(scale[scale.length - 1]?.color ?? '#fff');

    for (let i = 0; i < scale.length - 1; i++) {
      const s1 = scale[i];
      const s2 = scale[i + 1];
      if (s1 && s2 && value >= s1.value && value <= s2.value) {
        const t = (value - s1.value) / (s2.value - s1.value);
        const c1 = Color.fromCssColorString(s1.color);
        const c2 = Color.fromCssColorString(s2.color);
        return Color.lerp(c1, c2, t, new Color());
      }
    }

    return Color.WHITE;
  }

  private getPointSize(variable: EnvironmentalVariable, value: number): number {
    switch (variable) {
      case EnvironmentalVariable.FireRadiativePower:
        return Math.min(6 + value / 50, 20);
      case EnvironmentalVariable.PM25:
        return Math.min(5 + value / 10, 18);
      default:
        return 8;
    }
  }

  private getVariableTitle(variable: EnvironmentalVariable): string {
    const titles: Partial<Record<EnvironmentalVariable, string>> = {
      [EnvironmentalVariable.Temperature]: 'Temperature',
      [EnvironmentalVariable.Precipitation]: 'Precipitation',
      [EnvironmentalVariable.WindSpeed]: 'Wind Speed',
      [EnvironmentalVariable.PM25]: 'PM2.5',
      [EnvironmentalVariable.FireRadiativePower]: 'Fire Radiative Power',
      [EnvironmentalVariable.SnowCover]: 'Snow Cover',
      [EnvironmentalVariable.SeaSurfaceTemperature]: 'Sea Surface Temperature',
    };
    return titles[variable] ?? variable;
  }

  dispose(): void {
    this.clear();
    if (this.viewer && this.pointCollection) {
      this.viewer.scene.primitives.remove(this.pointCollection);
    }
    if (this.viewer && this.labelCollection) {
      this.viewer.scene.primitives.remove(this.labelCollection);
    }
    this.viewer = null;
    this.pointCollection = null;
    this.labelCollection = null;
  }
}
