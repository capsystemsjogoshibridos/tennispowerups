
import { LocationPoint } from '../types';

export function haversineDistance(p1: LocationPoint, p2: LocationPoint): number {
  const R = 6371e3; // metres
  const φ1 = p1.latitude * Math.PI / 180;
  const φ2 = p2.latitude * Math.PI / 180;
  const Δφ = (p2.latitude - p1.latitude) * Math.PI / 180;
  const Δλ = (p2.longitude - p1.longitude) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // in metres
}
