/**
 * Unit System — Centralized unit conversion for Atlas One v0.8.
 * All conversions are pure functions. Never scatter conversions throughout the app.
 */

// ---------------------------------------------------------------------------
// Unit Families
// ---------------------------------------------------------------------------

export enum TemperatureUnit {
  Celsius = '°C',
  Fahrenheit = '°F',
  Kelvin = 'K',
}

export enum WindSpeedUnit {
  MetersPerSecond = 'm/s',
  KilometersPerHour = 'km/h',
  MilesPerHour = 'mph',
  Knots = 'kn',
}

export enum PrecipitationUnit {
  Millimeters = 'mm',
  Inches = 'in',
}

export enum PressureUnit {
  Hectopascals = 'hPa',
  Pascals = 'Pa',
}

export enum DistanceUnit {
  Meters = 'm',
  Kilometers = 'km',
  Miles = 'mi',
}

// ---------------------------------------------------------------------------
// User Preferences
// ---------------------------------------------------------------------------

export interface UnitPreferences {
  temperature: TemperatureUnit;
  windSpeed: WindSpeedUnit;
  precipitation: PrecipitationUnit;
  pressure: PressureUnit;
  distance: DistanceUnit;
}

export const DEFAULT_UNIT_PREFERENCES: UnitPreferences = {
  temperature: TemperatureUnit.Celsius,
  windSpeed: WindSpeedUnit.MetersPerSecond,
  precipitation: PrecipitationUnit.Millimeters,
  pressure: PressureUnit.Hectopascals,
  distance: DistanceUnit.Kilometers,
};

// ---------------------------------------------------------------------------
// Temperature Conversions
// ---------------------------------------------------------------------------

export function convertTemperature(
  value: number,
  from: TemperatureUnit,
  to: TemperatureUnit,
): number {
  if (from === to) return value;

  // Normalize to Celsius first
  let celsius: number;
  switch (from) {
    case TemperatureUnit.Celsius:
      celsius = value;
      break;
    case TemperatureUnit.Fahrenheit:
      celsius = (value - 32) * (5 / 9);
      break;
    case TemperatureUnit.Kelvin:
      celsius = value - 273.15;
      break;
  }

  // Convert from Celsius to target
  switch (to) {
    case TemperatureUnit.Celsius:
      return Math.round(celsius * 100) / 100;
    case TemperatureUnit.Fahrenheit:
      return Math.round((celsius * (9 / 5) + 32) * 100) / 100;
    case TemperatureUnit.Kelvin:
      return Math.round((celsius + 273.15) * 100) / 100;
  }
}

// ---------------------------------------------------------------------------
// Wind Speed Conversions
// ---------------------------------------------------------------------------

export function convertWindSpeed(
  value: number,
  from: WindSpeedUnit,
  to: WindSpeedUnit,
): number {
  if (from === to) return value;

  // Normalize to m/s first
  let ms: number;
  switch (from) {
    case WindSpeedUnit.MetersPerSecond:
      ms = value;
      break;
    case WindSpeedUnit.KilometersPerHour:
      ms = value / 3.6;
      break;
    case WindSpeedUnit.MilesPerHour:
      ms = value * 0.44704;
      break;
    case WindSpeedUnit.Knots:
      ms = value * 0.514444;
      break;
  }

  switch (to) {
    case WindSpeedUnit.MetersPerSecond:
      return Math.round(ms * 100) / 100;
    case WindSpeedUnit.KilometersPerHour:
      return Math.round(ms * 3.6 * 100) / 100;
    case WindSpeedUnit.MilesPerHour:
      return Math.round(ms * 2.23694 * 100) / 100;
    case WindSpeedUnit.Knots:
      return Math.round(ms * 1.94384 * 100) / 100;
  }
}

// ---------------------------------------------------------------------------
// Precipitation Conversions
// ---------------------------------------------------------------------------

export function convertPrecipitation(
  value: number,
  from: PrecipitationUnit,
  to: PrecipitationUnit,
): number {
  if (from === to) return value;
  if (from === PrecipitationUnit.Millimeters) {
    return Math.round(value * 0.0393701 * 1000) / 1000;
  }
  return Math.round(value * 25.4 * 100) / 100;
}

// ---------------------------------------------------------------------------
// Pressure Conversions
// ---------------------------------------------------------------------------

export function convertPressure(
  value: number,
  from: PressureUnit,
  to: PressureUnit,
): number {
  if (from === to) return value;
  if (from === PressureUnit.Hectopascals) {
    return Math.round(value * 100 * 100) / 100;
  }
  return Math.round((value / 100) * 100) / 100;
}

// ---------------------------------------------------------------------------
// Distance Conversions
// ---------------------------------------------------------------------------

export function convertDistance(
  value: number,
  from: DistanceUnit,
  to: DistanceUnit,
): number {
  if (from === to) return value;

  // Normalize to meters
  let meters: number;
  switch (from) {
    case DistanceUnit.Meters:
      meters = value;
      break;
    case DistanceUnit.Kilometers:
      meters = value * 1000;
      break;
    case DistanceUnit.Miles:
      meters = value * 1609.344;
      break;
  }

  switch (to) {
    case DistanceUnit.Meters:
      return Math.round(meters * 100) / 100;
    case DistanceUnit.Kilometers:
      return Math.round((meters / 1000) * 1000) / 1000;
    case DistanceUnit.Miles:
      return Math.round((meters / 1609.344) * 1000) / 1000;
  }
}

// ---------------------------------------------------------------------------
// Generic formatting
// ---------------------------------------------------------------------------

/** Formats a value with its unit for display. */
export function formatWithUnit(value: number, unit: string, decimals = 1): string {
  return `${value.toFixed(decimals)} ${unit}`;
}
