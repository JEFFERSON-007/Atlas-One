/**
 * InfoPanel — Displays location and weather information for clicked globe positions.
 * Shows coordinates, country, weather data, and local time in a slide-in panel.
 */

import { createElement, setTextContent } from '../../../utils/dom';
import { eventBus } from '../../../hooks/use-event-bus';
import { getWeatherService } from '../../../api/services/weather.service';
import type { WeatherResult } from '../../../api/providers/weather-provider.interface';
import { createLogger } from '../../../utils/logger';
import { apiGet } from '../../../api/api-client';
import { throttle } from '../../../utils/throttle';

const log = createLogger('InfoPanel');

/** Nominatim reverse geocoding response. */
interface NominatimReverseResult {
  display_name: string;
  address: {
    country?: string;
    state?: string;
    city?: string;
    town?: string;
    village?: string;
  };
}

/**
 * Returns a wind direction compass label from degrees.
 */
function windDirectionLabel(degrees: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return dirs[index] ?? 'N';
}

/**
 * Information panel component for displaying location and weather data.
 */
export class InfoPanel {
  private panel: HTMLElement | null = null;
  private visible = false;
  private contentEl: HTMLElement | null = null;
  private currentLat = 0;
  private currentLng = 0;

  /**
   * Initializes the panel and attaches it to the parent container.
   *
   * @param parentId - ID of parent container
   */
  init(parentId: string): void {
    const parent = document.getElementById(parentId);
    if (!parent) return;

    this.panel = createElement('div', {
      id: 'info-panel',
      class: 'tn-panel tn-info-panel',
      role: 'dialog',
      'aria-label': 'Location Information',
    });

    const header = createElement(
      'div',
      { class: 'tn-panel__header' },
      createElement('h2', { class: 'tn-panel__title' }, 'Location Info'),
    );

    const closeBtn = createElement('button', {
      class: 'tn-panel__close',
      'aria-label': 'Close information panel',
      type: 'button',
    }, '×');
    closeBtn.addEventListener('click', () => this.close());
    header.appendChild(closeBtn);

    this.panel.appendChild(header);

    this.contentEl = createElement('div', { class: 'tn-info-panel__content' });
    this.renderEmpty();
    this.panel.appendChild(this.contentEl);

    parent.appendChild(this.panel);

    // Listen for location click events
    const throttledClick = throttle((lat: unknown, lng: unknown) => {
      if (typeof lat === 'number' && typeof lng === 'number') {
        this.handleLocationClick(lat, lng);
      }
    }, 1000);

    eventBus.on('location:click', (payload: any) => {
      throttledClick(payload.lat, payload.lng);
    });

    log.info('Info panel initialized');
  }

  /**
   * Handles a globe click by opening the panel and fetching data.
   */
  private handleLocationClick(lat: number, lng: number): void {
    this.currentLat = lat;
    this.currentLng = lng;
    this.open();
    this.renderLoading(lat, lng);
    void this.fetchAllData(lat, lng);
  }

  /**
   * Fetches weather and reverse geocoding data concurrently.
   */
  private async fetchAllData(lat: number, lng: number): Promise<void> {
    const [weather, location] = await Promise.all([
      this.fetchWeather(lat, lng),
      this.fetchLocationName(lat, lng),
    ]);

    // Only render if we haven't moved to a different location
    if (lat === this.currentLat && lng === this.currentLng) {
      this.renderData(lat, lng, weather, location);
    }
  }

  /**
   * Fetches weather using the weather service.
   */
  private async fetchWeather(lat: number, lng: number): Promise<WeatherResult | null> {
    try {
      const service = getWeatherService();
      return await service.getWeather(lat, lng);
    } catch {
      log.warn('Failed to fetch weather for info panel');
      return null;
    }
  }

  /**
   * Fetches location name via Nominatim reverse geocoding.
   */
  private async fetchLocationName(
    lat: number,
    lng: number,
  ): Promise<{ country: string; place: string } | null> {
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat.toFixed(6)}&lon=${lng.toFixed(6)}&zoom=10&addressdetails=1`;
      const response = await apiGet<NominatimReverseResult>(url, {
        timeout: 5000,
        retries: 0,
        headers: { 'User-Agent': 'Atlas One/0.2 (Earth Intelligence Platform)' },
      });

      if (response.data) {
        const addr = response.data.address;
        const place = addr.city ?? addr.town ?? addr.village ?? addr.state ?? '';
        return {
          country: addr.country ?? 'Unknown',
          place,
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  /**
   * Renders empty state.
   */
  private renderEmpty(): void {
    if (!this.contentEl) return;
    this.contentEl.innerHTML = '';
    const msg = createElement('p', { class: 'tn-info-panel__empty' }, 'Click anywhere on the globe to see location details.');
    this.contentEl.appendChild(msg);
  }

  /**
   * Renders loading skeleton.
   */
  private renderLoading(lat: number, lng: number): void {
    if (!this.contentEl) return;
    this.contentEl.innerHTML = '';

    // Location section with coordinates (immediately available)
    const locSection = this.createSection('📍 Location');
    locSection.appendChild(this.createRow('Latitude', `${lat.toFixed(5)}°`));
    locSection.appendChild(this.createRow('Longitude', `${lng.toFixed(5)}°`));
    locSection.appendChild(this.createRow('Country', ''));
    // Add shimmer to country
    const countryValue = locSection.querySelector('.tn-info-panel__value:last-child');
    if (countryValue) {
      countryValue.classList.add('tn-info-panel__skeleton');
      setTextContent(countryValue as HTMLElement, '██████████');
    }

    this.contentEl.appendChild(locSection);

    // Weather section with skeleton
    const wxSection = this.createSection('🌤️ Weather');
    const skeletonRows = ['Temperature', 'Humidity', 'Pressure', 'Wind Speed', 'Wind Direction', 'Conditions'];
    for (const label of skeletonRows) {
      const row = this.createRow(label, '');
      const value = row.querySelector('.tn-info-panel__value');
      if (value) {
        value.classList.add('tn-info-panel__skeleton');
        setTextContent(value as HTMLElement, '████████');
      }
      wxSection.appendChild(row);
    }
    this.contentEl.appendChild(wxSection);
  }

  /**
   * Renders the full data view.
   */
  private renderData(
    lat: number,
    lng: number,
    weather: WeatherResult | null,
    location: { country: string; place: string } | null,
  ): void {
    if (!this.contentEl) return;
    this.contentEl.innerHTML = '';

    // --- Location Section ---
    const locSection = this.createSection('📍 Location');
    locSection.appendChild(this.createRow('Latitude', `${lat.toFixed(5)}°`));
    locSection.appendChild(this.createRow('Longitude', `${lng.toFixed(5)}°`));
    if (location) {
      locSection.appendChild(this.createRow('Country', location.country));
      if (location.place) {
        locSection.appendChild(this.createRow('Place', location.place));
      }
    } else {
      locSection.appendChild(this.createRow('Country', 'Unknown'));
    }
    this.contentEl.appendChild(locSection);

    // --- Weather Section ---
    const wxSection = this.createSection('🌤️ Weather');
    if (weather) {
      wxSection.appendChild(this.createRow('Temperature', `${weather.temperature.toFixed(1)}°C`));
      wxSection.appendChild(this.createRow('Humidity', `${weather.humidity}%`));
      wxSection.appendChild(this.createRow('Pressure', `${weather.pressure.toFixed(0)} hPa`));
      wxSection.appendChild(this.createRow('Wind Speed', `${weather.windSpeed.toFixed(1)} km/h`));
      wxSection.appendChild(this.createRow('Wind Direction', `${weather.windDirection}° (${windDirectionLabel(weather.windDirection)})`));
      wxSection.appendChild(this.createRow('Conditions', weather.description));

      // Attribution
      const attribution = createElement('p', { class: 'tn-info-panel__attribution' }, `Data: ${getWeatherService().getProviderInfo().attribution}`);
      wxSection.appendChild(attribution);
    } else {
      const errorMsg = createElement('p', { class: 'tn-info-panel__error' }, 'Weather data unavailable for this location.');
      wxSection.appendChild(errorMsg);
    }
    this.contentEl.appendChild(wxSection);

    // --- Local Time Section ---
    const timeSection = this.createSection('🕐 Local Time');
    const localTime = this.estimateLocalTime(lng);
    timeSection.appendChild(this.createRow('Estimated Time', localTime));
    timeSection.appendChild(
      createElement('p', { class: 'tn-info-panel__note' }, 'Based on longitude (approximate)'),
    );
    this.contentEl.appendChild(timeSection);
  }

  /**
   * Estimates local time from longitude (rough UTC offset).
   */
  private estimateLocalTime(longitude: number): string {
    const utcOffset = Math.round(longitude / 15);
    const now = new Date();
    const localMs = now.getTime() + utcOffset * 3600000;
    const localDate = new Date(localMs);
    // Use UTC methods since we already applied the offset
    const hours = localDate.getUTCHours().toString().padStart(2, '0');
    const minutes = localDate.getUTCMinutes().toString().padStart(2, '0');
    const sign = utcOffset >= 0 ? '+' : '';
    return `${hours}:${minutes} (UTC${sign}${utcOffset})`;
  }

  /**
   * Creates a panel section with a title.
   */
  private createSection(title: string): HTMLElement {
    const section = createElement('div', { class: 'tn-info-panel__section' });
    section.appendChild(createElement('h3', { class: 'tn-info-panel__section-title' }, title));
    return section;
  }

  /**
   * Creates a label/value row.
   */
  private createRow(label: string, value: string): HTMLElement {
    const row = createElement('div', { class: 'tn-info-panel__row' });
    row.appendChild(createElement('span', { class: 'tn-info-panel__label' }, label));
    row.appendChild(createElement('span', { class: 'tn-info-panel__value' }, value));
    return row;
  }

  open(): void {
    this.visible = true;
    if (this.panel) {
      this.panel.classList.add('tn-info-panel--visible');
    }
    eventBus.emit('info-panel:open', { lat: this.currentLat, lng: this.currentLng });
  }

  close(): void {
    this.visible = false;
    if (this.panel) {
      this.panel.classList.remove('tn-info-panel--visible');
    }
    eventBus.emit('info-panel:close');
  }

  toggle(): void {
    if (this.visible) {
      this.close();
    } else {
      this.open();
    }
  }

  isVisible(): boolean {
    return this.visible;
  }

  dispose(): void {
    this.panel?.remove();
    this.panel = null;
    this.contentEl = null;
  }
}
