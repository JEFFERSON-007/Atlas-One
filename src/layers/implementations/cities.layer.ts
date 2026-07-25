/**
 * Cities Layer — Displays major world city labels as Cesium entities.
 */

import {
  type Viewer,
  Cartesian3,
  Color,
  LabelStyle,
  VerticalOrigin,
  HorizontalOrigin,
  NearFarScalar,
} from 'cesium';
import { type ILayer, type LayerMetadata, LayerCategory } from '../layer.interface';

interface CityData {
  name: string;
  lat: number;
  lng: number;
  population: number;
}

/** Top 30 world cities by population. */
const MAJOR_CITIES: CityData[] = [
  { name: 'Tokyo', lat: 35.6762, lng: 139.6503, population: 37_400_000 },
  { name: 'Delhi', lat: 28.7041, lng: 77.1025, population: 30_290_000 },
  { name: 'Shanghai', lat: 31.2304, lng: 121.4737, population: 27_058_000 },
  { name: 'São Paulo', lat: -23.5505, lng: -46.6333, population: 22_043_000 },
  { name: 'Mexico City', lat: 19.4326, lng: -99.1332, population: 21_782_000 },
  { name: 'Cairo', lat: 30.0444, lng: 31.2357, population: 20_901_000 },
  { name: 'Mumbai', lat: 19.0760, lng: 72.8777, population: 20_411_000 },
  { name: 'Beijing', lat: 39.9042, lng: 116.4074, population: 20_384_000 },
  { name: 'Dhaka', lat: 23.8103, lng: 90.4125, population: 19_578_000 },
  { name: 'Osaka', lat: 34.6937, lng: 135.5023, population: 19_281_000 },
  { name: 'New York', lat: 40.7128, lng: -74.0060, population: 18_819_000 },
  { name: 'Karachi', lat: 24.8607, lng: 67.0011, population: 16_094_000 },
  { name: 'Istanbul', lat: 41.0082, lng: 28.9784, population: 15_190_000 },
  { name: 'Buenos Aires', lat: -34.6037, lng: -58.3816, population: 15_154_000 },
  { name: 'Lagos', lat: 6.5244, lng: 3.3792, population: 14_368_000 },
  { name: 'London', lat: 51.5074, lng: -0.1278, population: 9_541_000 },
  { name: 'Paris', lat: 48.8566, lng: 2.3522, population: 11_142_000 },
  { name: 'Moscow', lat: 55.7558, lng: 37.6176, population: 12_538_000 },
  { name: 'Los Angeles', lat: 34.0522, lng: -118.2437, population: 12_488_000 },
  { name: 'Sydney', lat: -33.8688, lng: 151.2093, population: 5_312_000 },
  { name: 'Berlin', lat: 52.5200, lng: 13.4050, population: 3_677_000 },
  { name: 'Singapore', lat: 1.3521, lng: 103.8198, population: 5_686_000 },
  { name: 'Dubai', lat: 25.2048, lng: 55.2708, population: 3_331_000 },
  { name: 'Toronto', lat: 43.6532, lng: -79.3832, population: 6_197_000 },
  { name: 'Nairobi', lat: -1.2921, lng: 36.8219, population: 4_397_000 },
  { name: 'Rio de Janeiro', lat: -22.9068, lng: -43.1729, population: 13_458_000 },
  { name: 'Seoul', lat: 37.5665, lng: 126.9780, population: 9_963_000 },
  { name: 'Jakarta', lat: -6.2088, lng: 106.8456, population: 10_562_000 },
  { name: 'Bangkok', lat: 13.7563, lng: 100.5018, population: 10_539_000 },
  { name: 'Lima', lat: -12.0464, lng: -77.0428, population: 10_883_000 },
];

export class CitiesLayer implements ILayer {
  readonly metadata: LayerMetadata = {
    id: 'cities',
    name: 'Cities',
    category: LayerCategory.Reference,
    icon: '🏙️',
    description: 'Major world city labels',
    defaultEnabled: false,
  };

  private viewer: Viewer | null = null;
  private enabled = false;
  private entityIds: string[] = [];

  isEnabled(): boolean {
    return this.enabled;
  }

  init(viewer: Viewer): void {
    this.viewer = viewer;

    for (const city of MAJOR_CITIES) {
      const entity = viewer.entities.add({
        name: city.name,
        position: Cartesian3.fromDegrees(city.lng, city.lat),
        label: {
          text: city.name,
          font: '13px Inter, sans-serif',
          fillColor: Color.fromCssColorString('#e2e8f0'),
          outlineColor: Color.fromCssColorString('#0f172a'),
          outlineWidth: 3,
          style: LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: VerticalOrigin.BOTTOM,
          horizontalOrigin: HorizontalOrigin.CENTER,
          pixelOffset: { x: 0, y: -8 } as unknown as import('cesium').Cartesian2,
          scaleByDistance: new NearFarScalar(1e5, 1.2, 1e7, 0.4),
          translucencyByDistance: new NearFarScalar(1e5, 1.0, 2e7, 0.0),
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
          showBackground: false,
        },
        point: {
          pixelSize: 5,
          color: Color.fromCssColorString('#60a5fa'),
          outlineColor: Color.fromCssColorString('#1e3a5f'),
          outlineWidth: 1,
          scaleByDistance: new NearFarScalar(1e5, 1.0, 1e7, 0.3),
        },
        show: this.enabled,
      });

      if (entity.id) {
        this.entityIds.push(entity.id);
      }
    }
  }

  enable(): void {
    this.enabled = true;
    this.setVisibility(true);
  }

  disable(): void {
    this.enabled = false;
    this.setVisibility(false);
  }

  toggle(): boolean {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
    return this.enabled;
  }

  private setVisibility(visible: boolean): void {
    if (!this.viewer) return;
    for (const id of this.entityIds) {
      const entity = this.viewer.entities.getById(id);
      if (entity) entity.show = visible;
    }
  }

  dispose(): void {
    if (this.viewer) {
      for (const id of this.entityIds) {
        const entity = this.viewer.entities.getById(id);
        if (entity) this.viewer.entities.remove(entity);
      }
    }
    this.entityIds = [];
    this.viewer = null;
  }
}
