export type Coordinates = [number, number];

export interface LiveTrackingStats {
  distanceToPickup: number;
  durationToPickup: number;
  distanceToDrop: number;
  durationToDrop: number;
}

export type LiveTrackingStatus = "arriving" | "ongoing" | "completed" | string;

export interface LiveTrackingMapProps {
  driverLocation?: Coordinates | null;
  pickupLocation?: Coordinates | null;
  dropLocation?: Coordinates | null;
  status: LiveTrackingStatus;
  vehicleType?: string;
  etaMinutes?: number;
  onStats?: (data: LiveTrackingStats) => void;
}

export interface RouteMapProps {
  pickupLocation?: Coordinates | null;
  dropLocation?: Coordinates | null;
  stops?: Coordinates[];
  driverLocation?: Coordinates | null;
  isDraggable?: boolean;
  onPickupChange?: (coords: Coordinates) => void;
  onDropChange?: (coords: Coordinates) => void;
}
