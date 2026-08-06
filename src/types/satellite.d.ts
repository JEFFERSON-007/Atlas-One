declare module 'satellite.js' {
  export interface SatRec {
    no: number;
    [key: string]: unknown;
  }

  export interface EciVec3 {
    x: number;
    y: number;
    z: number;
  }

  export interface PositionAndVelocity {
    position: EciVec3 | boolean;
    velocity: EciVec3 | boolean;
  }

  export interface GeodeticLocation {
    longitude: number;
    latitude: number;
    height: number;
  }

  export function twoline2satrec(longtle1: string, longtle2: string): SatRec;
  export function propagate(satrec: SatRec, date: Date): PositionAndVelocity;
  export function gstime(date: Date): number;
  export function eciToGeodetic(eci: EciVec3, gmst: number): GeodeticLocation;
  export function degreesLat(radians: number): number;
  export function degreesLong(radians: number): number;
}
