
export enum Screen {
  HOME,
  LIVE,
  HISTORY,
  PRIVACY,
}

export interface Cards {
  common: number;
  semiRare: number;
  rare: number;
}

export interface Match {
  id: string;
  startedAt: string;
  endedAt: string;
  distanceMeters: number;
  topSpeedKmh: number;
  steps: number;
  cards: Cards;
}

export interface AppState {
  history: Match[];
  sensorConsent: boolean;
}

export type PermissionStatus = 'prompt' | 'granted' | 'denied';

export interface LocationPoint {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}
