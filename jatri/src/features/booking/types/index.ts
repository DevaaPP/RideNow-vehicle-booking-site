export type VehicleType = "bike" | "auto" | "car" | "loading" | "truck";

export interface BookingPlace {
  id: string;
  name: string;
  title?: string;
  subtitle?: string;
  category?: string;
  lat?: number;
  lng?: number;
  countrycode?: string;
}

export interface BookingVehicleOption {
  id: VehicleType;
  label: string;
  Icon: any;
  desc: string;
  etaText: string;
}
