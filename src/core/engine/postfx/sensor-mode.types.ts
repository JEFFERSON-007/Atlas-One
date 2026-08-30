/**
 * Sensor Mode Types — Visual post-processing modes for Atlas One v0.8.
 * Inspired by God's Eye View GLSL sensor overlays.
 */

export enum SensorMode {
  NORMAL = 'normal',
  NVG = 'nvg',           // Night Vision (green phosphor)
  FLIR = 'flir',         // Forward-Looking Infrared (thermal)
  CRT = 'crt',           // Cathode Ray Tube (retro monitor)
  NOIR = 'noir',         // Black-and-white cinematic
  SNOW = 'snow',         // Static / signal-loss effect
  TACTICAL = 'tactical', // High-contrast blue tactical
}

export const SENSOR_MODE_LABELS: Record<SensorMode, string> = {
  [SensorMode.NORMAL]: 'Standard',
  [SensorMode.NVG]: 'Night Vision',
  [SensorMode.FLIR]: 'Thermal / FLIR',
  [SensorMode.CRT]: 'CRT Monitor',
  [SensorMode.NOIR]: 'Noir',
  [SensorMode.SNOW]: 'Signal Loss',
  [SensorMode.TACTICAL]: 'Tactical',
};

export const SENSOR_MODE_KEYS: Record<string, SensorMode> = {
  '1': SensorMode.NORMAL,
  '2': SensorMode.NVG,
  '3': SensorMode.FLIR,
  '4': SensorMode.CRT,
  '5': SensorMode.NOIR,
  '6': SensorMode.SNOW,
  '7': SensorMode.TACTICAL,
};
