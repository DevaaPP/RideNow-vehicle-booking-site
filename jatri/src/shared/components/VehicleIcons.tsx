import React from "react";

interface VehicleIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
}

/**
 * Scooty (Step-through Moped / Activa silhouette)
 */
export function ScootyIcon({ size = 24, className = "", ...props }: VehicleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Wheels */}
      <circle cx="8" cy="24" r="4" strokeWidth="2.2" />
      <circle cx="8" cy="24" r="1.5" fill="currentColor" />
      <circle cx="24" cy="24" r="4" strokeWidth="2.2" />
      <circle cx="24" cy="24" r="1.5" fill="currentColor" />

      {/* Scooter Chassis: Step-through floorboard and front apron */}
      <path d="M8 24h6l2-8h4l2 8h2" />
      <path d="M22 16l-3-10h-3" strokeWidth="2.2" />
      <path d="M16 6h4" strokeWidth="2.5" />
      {/* Seat & Engine Body */}
      <path d="M10 16h6c2 0 3.5 1.5 3.5 3.5V24H8v-4.5c0-1.9 1.6-3.5 3.5-3.5h0" fill="currentColor" fillOpacity="0.15" />
      {/* Handlebar & mirror */}
      <circle cx="18" cy="4" r="1" fill="currentColor" />
    </svg>
  );
}

/**
 * Commuter / Sports Motorcycle
 */
export function BikeIcon({ size = 24, className = "", ...props }: VehicleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Wheels */}
      <circle cx="7" cy="23" r="4.5" strokeWidth="2.2" />
      <circle cx="7" cy="23" r="1.5" fill="currentColor" />
      <circle cx="25" cy="23" r="4.5" strokeWidth="2.2" />
      <circle cx="25" cy="23" r="1.5" fill="currentColor" />

      {/* Motorcycle Frame & Fuel Tank */}
      <path d="M7 23l6-8h4l4 8" />
      <path d="M13 15l4-7h4" strokeWidth="2.2" />
      <path d="M11 15h6l3-4h-5z" fill="currentColor" fillOpacity="0.2" />
      {/* Handlebars */}
      <path d="M19 6h4" strokeWidth="2.5" />
      {/* Exhaust pipe */}
      <path d="M14 22h10" strokeWidth="1.8" />
    </svg>
  );
}

/**
 * Iconic Indian 3-Wheeler Auto Rickshaw
 */
export function AutoRickshawIcon({ size = 24, className = "", ...props }: VehicleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Front Wheel (Single) & Rear Wheel */}
      <circle cx="8" cy="24" r="3.5" strokeWidth="2.2" />
      <circle cx="24" cy="24" r="3.5" strokeWidth="2.2" />

      {/* Auto Canopy & Body Structure */}
      <path d="M5 19l3-9h14l3 5v7h-5" />
      <path d="M12 24h8" />
      {/* Windshield angle */}
      <path d="M8 10l-2 9h4" />
      {/* Canopy top */}
      <path d="M7 10c0-1.5 1.5-2.5 3-2.5h10c1.5 0 3 1 3 2.5v3H7v-3z" fill="currentColor" fillOpacity="0.2" />
      {/* Driver & passenger divider */}
      <path d="M14 10v10" strokeWidth="1.5" />
      {/* Headlight */}
      <path d="M4 17h2" strokeWidth="2.5" />
    </svg>
  );
}

/**
 * Economy Hatchback Car (Simple / Mini)
 */
export function CarMiniIcon({ size = 24, className = "", ...props }: VehicleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Wheels */}
      <circle cx="9" cy="23" r="3.5" strokeWidth="2.2" />
      <circle cx="23" cy="23" r="3.5" strokeWidth="2.2" />

      {/* Hatchback Body Profile */}
      <path d="M4 20h2m6 0h8m4 0h4v-3c0-1.5-1-2.5-2.5-2.5H23l-3-6H10L6 14.5c-1.5 0-2 1-2 2.5v3z" />
      {/* Windows */}
      <path d="M11 9h8l2.5 5H7.5L11 9z" fill="currentColor" fillOpacity="0.15" />
      <path d="M15 9v5" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Executive Sedan Car (Premier)
 */
export function CarPremierIcon({ size = 24, className = "", ...props }: VehicleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Wheels */}
      <circle cx="8" cy="23" r="3.5" strokeWidth="2.2" />
      <circle cx="24" cy="23" r="3.5" strokeWidth="2.2" />

      {/* 3-Box Sedan Body with Distinct Boot / Trunk */}
      <path d="M3 20h2m6 0h10m4 0h4v-2.5c0-1.2-.8-2-2-2h-3l-4-6.5H11L6 15.5H4c-1.2 0-2 .8-2 2V20z" />
      {/* Sleek Aerodynamic Windows */}
      <path d="M11.5 9.5h8l3 6H7.5l4-6z" fill="currentColor" fillOpacity="0.15" />
      <path d="M16 9.5v6" strokeWidth="1.5" />
      {/* Headlight & Tail accent */}
      <path d="M3 18h2" strokeWidth="2" />
      <path d="M28 17.5h1.5" strokeWidth="2" />
    </svg>
  );
}

/**
 * Premium Spacious SUV / XL 6-Seater (Priority)
 */
export function CarPriorityIcon({ size = 24, className = "", ...props }: VehicleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Heavy SUV Wheels with Disc Detail */}
      <circle cx="8" cy="23" r="4" strokeWidth="2.2" />
      <circle cx="8" cy="23" r="1.5" fill="currentColor" />
      <circle cx="24" cy="23" r="4" strokeWidth="2.2" />
      <circle cx="24" cy="23" r="1.5" fill="currentColor" />

      {/* High-stance Tall SUV Body with Roof Rails */}
      <path d="M3 20h1m8 0h8m8 0h1v-4c0-1.5-1-2.5-2.5-2.5H25l-2-7H9L5 13.5H3.5C2 13.5 1 14.5 1 16v4h2" />
      {/* Roof Rails */}
      <path d="M10 4.5h12" strokeWidth="2" />
      <path d="M12 4.5v2" strokeWidth="1.5" />
      <path d="M20 4.5v2" strokeWidth="1.5" />
      {/* 3-Row Windows */}
      <path d="M9.5 7h12.5l1.5 6.5H6.5L9.5 7z" fill="currentColor" fillOpacity="0.15" />
      <path d="M14 7v6.5" strokeWidth="1.5" />
      <path d="M19 7v6.5" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Goods Carrier / Tata Ace Mini Truck
 */
export function MiniTruckIcon({ size = 24, className = "", ...props }: VehicleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Wheels */}
      <circle cx="8" cy="23" r="3.5" strokeWidth="2.2" />
      <circle cx="23" cy="23" r="3.5" strokeWidth="2.2" />

      {/* Driver Cab */}
      <path d="M3 20h2m6 0h8m4 0h5v-5h-9V9H4c-1.5 0-2 1.5-2 3v8h1" />
      <path d="M5 12h5l2 3H4v-2c0-.5.5-1 1-1z" fill="currentColor" fillOpacity="0.15" />
      {/* Cargo Bed Frame */}
      <path d="M15 11h13v9H15z" strokeWidth="2" fill="currentColor" fillOpacity="0.08" />
      <path d="M15 15h13" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Heavy Commercial 14ft Freight Lorry
 */
export function FreightTruckIcon({ size = 24, className = "", ...props }: VehicleIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* Double Wheels on Rear */}
      <circle cx="6" cy="24" r="3" strokeWidth="2" />
      <circle cx="22" cy="24" r="3" strokeWidth="2" />
      <circle cx="27" cy="24" r="3" strokeWidth="2" />

      {/* Front Cab */}
      <path d="M2 21h1m6 0h10m10 0h2v-6h-7V7H2v14z" />
      <path d="M3 9h5v6H3V9z" fill="currentColor" fillOpacity="0.15" />
      {/* Large Cargo Container */}
      <path d="M10 7h19v14H10z" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
      <path d="M16 7v14" strokeWidth="1.5" />
      <path d="M23 7v14" strokeWidth="1.5" />
    </svg>
  );
}

/**
 * Universal Vehicle Icon Resolver
 */
export const VEHICLE_SVG_ICONS: Record<string, React.ComponentType<VehicleIconProps>> = {
  scooty: ScootyIcon,
  bike: BikeIcon,
  auto: AutoRickshawIcon,
  mini: CarMiniIcon,
  car: CarPremierIcon,
  premier: CarPremierIcon,
  priority: CarPriorityIcon,
  xl: CarPriorityIcon,
  loading: MiniTruckIcon,
  truck: FreightTruckIcon,
};
