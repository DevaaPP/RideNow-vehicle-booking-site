import React from "react";

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  strokeWidth?: number | string;
  className?: string;
  filled?: boolean;
}

/**
 * Premium Assamese / Apple SF-inspired Home Icon
 * Characterized by soft rounded eaves, rounded apex, and an arched inner doorway cutout.
 */
export function HomeIcon({
  size = 24,
  strokeWidth = 1.9,
  className = "",
  filled = false,
  ...props
}: IconProps) {
  if (filled) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <path d="M12 2.69l7.74 6.74c.48.42.76 1.03.76 1.67V19c0 1.1-.9 2-2 2h-3c-.55 0-1-.45-1-1v-5c0-.55-.45-1-1-1h-3c-.55 0-1 .45-1 1v5c0 .55-.45 1-1 1H5c-1.1 0-2-.9-2-2v-7.9c0-.64.28-1.25.76-1.67L11.5 2.69a.75.75 0 0 1 1 0z" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Roof with subtle overhang eaves and softly rounded apex */}
      <path d="M3 10.5 L10.8 3.8 a1.8 1.8 0 0 1 2.4 0 L21 10.5" />
      {/* Outer body with rounded bottom corners */}
      <path d="M5.5 9.5 V19 a2 2 0 0 0 2 2 h9 a2 2 0 0 0 2 -2 V9.5" />
      {/* Semicircular arched doorway cutout */}
      <path d="M9.5 21 v-5.5 a2.5 2.5 0 0 1 5 0 V21" />
    </svg>
  );
}

/**
 * Premium Compass / Explore Icon
 * Circular border with a clean, tilted precision needle.
 */
export function CompassIcon({
  size = 24,
  strokeWidth = 1.9,
  className = "",
  active = false,
  ...props
}: IconProps & { active?: boolean }) {
  if (active) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="currentColor"
        className={className}
        aria-hidden="true"
        {...props}
      >
        <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth={strokeWidth} />
        <polygon points="15.8 8.2 13 13.5 8.2 15.8 11 10.5 15.8 8.2" fill="currentColor" />
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <polygon
        points="15.8 8.2 13.2 13.8 8.2 15.8 10.8 10.2 15.8 8.2"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
      />
    </svg>
  );
}

/**
 * Audio Waveform Soundwave Icon
 * 5 vertical bars with rounded pill caps matching reference central button.
 */
export function WaveformIcon({
  size = 24,
  className = "",
  ...props
}: {
  size?: number | string;
  className?: string;
} & React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <rect x="2.5" y="8" width="2.2" height="8" rx="1.1" />
      <rect x="6.8" y="4" width="2.2" height="16" rx="1.1" />
      <rect x="11.1" y="2" width="2.2" height="20" rx="1.1" />
      <rect x="15.4" y="4" width="2.2" height="16" rx="1.1" />
      <rect x="19.7" y="8" width="2.2" height="8" rx="1.1" />
    </svg>
  );
}

/**
 * Bookings Document / Receipt Icon
 * Sheet of paper with folded top-right dog-ear and content lines.
 */
export function BookingsDocIcon({
  size = 24,
  strokeWidth = 1.9,
  className = "",
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      {/* Dog-ear fold */}
      <path d="M14 3v3.5a1 1 0 0 0 1 1h3.5" />
      {/* Document outline */}
      <path d="M17 21H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7.5l4.5 4.5V19a2 2 0 0 1-2 2z" />
      {/* Receipt / itinerary lines */}
      <line x1="8.5" y1="12" x2="15.5" y2="12" />
      <line x1="8.5" y1="15.5" x2="13" y2="15.5" />
    </svg>
  );
}

/**
 * Account / Profile Person Icon
 * Minimalist circle head with smooth curved shoulder arc.
 */
export function AccountPersonIcon({
  size = 24,
  strokeWidth = 1.9,
  className = "",
  ...props
}: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      {...props}
    >
      <circle cx="12" cy="7.5" r="4" />
      <path d="M5.5 20.5a6.5 6.5 0 0 1 13 0" />
    </svg>
  );
}

// Export default HomeIcon as primary drop-in replacement
export default HomeIcon;
