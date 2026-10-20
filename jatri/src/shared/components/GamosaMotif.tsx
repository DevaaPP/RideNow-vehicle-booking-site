import React, { useId } from "react";

interface GamosaDividerProps {
  className?: string;
  accentColor?: string;
  label?: string;
}

interface GamosaBorderProps {
  className?: string;
  height?: number;
  accentColor?: string;
  backgroundColor?: string;
  showBackground?: boolean;
}

/**
 * Assamese Gamosa-inspired Kingkhap Diamond Motif (কিংখাপ ফুল / Phut)
 * A traditional stepped geometric weave used in authentic Assamese textiles.
 */
export function GamosaDiamond({
  size = 16,
  color = "#E34222",
  className = "",
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`inline-block shrink-0 ${className}`}
      aria-hidden="true"
    >
      {/* Outer stepped diamond frame */}
      <polygon
        points="12,2 22,12 12,22 2,12"
        stroke={color}
        strokeWidth="1.5"
        fill="none"
      />
      {/* Stepped corner teeth (Assamese Tant weave serrations) */}
      <polygon points="12,0.8 13.2,2 12,3.2 10.8,2" fill={color} />
      <polygon points="12,20.8 13.2,22 12,23.2 10.8,22" fill={color} />
      <polygon points="0.8,12 2,10.8 3.2,12 2,13.2" fill={color} />
      <polygon points="20.8,12 22,10.8 23.2,12 22,13.2" fill={color} />

      {/* Inner secondary diamond */}
      <polygon
        points="12,6 18,12 12,18 6,12"
        stroke={color}
        strokeWidth="1"
        fill="none"
        strokeDasharray="2,1"
      />
      {/* Core solid Kingkhap seed */}
      <polygon
        points="12,8.5 15.5,12 12,15.5 8.5,12"
        fill={color}
      />
      {/* Center pinpoint */}
      <circle cx="12" cy="12" r="1" fill="#FAF7F0" />

      {/* Delicate horizontal warp threads */}
      <line x1="0" y1="12" x2="4" y2="12" stroke={color} strokeWidth="1.2" />
      <line x1="20" y1="12" x2="24" y2="12" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

/**
 * GamosaDivider
 * A continuous-flow editorial separator with an authentic Assamese vermilion Kingkhap ornament.
 */
export function GamosaDivider({
  className = "",
  accentColor = "#E34222",
  label,
}: GamosaDividerProps) {
  return (
    <div className={`relative flex items-center justify-center my-6 w-full ${className}`}>
      <div className="flex-1 h-px bg-[#DED7CA] dark:bg-[#34443A]" />
      <div className="flex items-center gap-2 px-3 bg-transparent">
        <GamosaDiamond size={15} color={accentColor} />
        {label && (
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#696B64] dark:text-[#929D93]">
            {label}
          </span>
        )}
        <GamosaDiamond size={15} color={accentColor} />
      </div>
      <div className="flex-1 h-px bg-[#DED7CA] dark:bg-[#34443A]" />
    </div>
  );
}

/**
 * GamosaBorder
 * An authentic Assamese Gamosa woven border ribbon (দাঁহি / পাৰি).
 *
 * Distinctive cultural characteristics:
 * - Handloom warm ivory cotton ribbon base (#FAF7F0)
 * - Pure Assamese vermilion red (#E34222) woven threadwork
 * - Traditional running saw-tooth fringe (দাঁতিয়া পাৰি / Dati) along top and bottom
 * - Stepped Kingkhap flower diamonds (কিংখাপ ফুল) with concentric layers and winglets
 * - Intermediate Phuti (ফুটি) 4-point star cross-dots
 */
export function GamosaBorder({
  className = "",
  height = 18,
  accentColor = "#E34222",
  backgroundColor = "#FAF7F0",
  showBackground = true,
}: GamosaBorderProps) {
  const patternId = useId();

  return (
    <div
      className={`w-full overflow-hidden leading-none select-none ${className}`}
      style={{ height: `${height}px` }}
      aria-hidden="true"
    >
      <svg
        width="100%"
        height={height}
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern
            id={patternId}
            width="48"
            height={height}
            patternUnits="userSpaceOnUse"
          >
            {/* Woven Ivory Cotton Fabric Base */}
            {showBackground && (
              <rect width="48" height={height} fill={backgroundColor} />
            )}

            {/* Top boundary warp thread (solid) */}
            <line x1="0" y1="1" x2="48" y2="1" stroke={accentColor} strokeWidth="1.2" />

            {/* Top serrated saw-tooth border (দাঁতিয়া পাৰি / Dati fringe pointing down) */}
            <polygon
              points="0,3 3,5.5 6,3 9,5.5 12,3 15,5.5 18,3 21,5.5 24,3 27,5.5 30,3 33,5.5 36,3 39,5.5 42,3 45,5.5 48,3 48,2 0,2"
              fill={accentColor}
            />

            {/* Center Stepped Kingkhap Flower Motif (কিংখাপ ফুল) at x=24, y=height/2 */}
            {/* Outer Diamond */}
            <polygon
              points="24,4.2 30.8,9 24,13.8 17.2,9"
              fill={accentColor}
            />
            {/* Inner Hollow Cutout */}
            <polygon
              points="24,5.8 28.6,9 24,12.2 19.4,9"
              fill={showBackground ? backgroundColor : "#FAF7F0"}
            />
            {/* Core Solid Diamond Seed */}
            <polygon
              points="24,7.2 26.6,9 24,10.8 21.4,9"
              fill={accentColor}
            />

            {/* Flanking Chevron Winglets (কাঁজ / Wing teeth) */}
            <polygon
              points="14,9 15.8,7.2 16.8,9 15.8,10.8"
              fill={accentColor}
            />
            <polygon
              points="34,9 32.2,7.2 31.2,9 32.2,10.8"
              fill={accentColor}
            />

            {/* Intermediate Phuti (ফুটি / 4-point Star Cross) at x=0 and x=48 */}
            <polygon points="0,7.2 2,9 0,10.8 -2,9" fill={accentColor} />
            <polygon points="48,7.2 50,9 48,10.8 46,9" fill={accentColor} />
            <circle cx="0" cy="5.2" r="0.75" fill={accentColor} />
            <circle cx="48" cy="5.2" r="0.75" fill={accentColor} />
            <circle cx="0" cy="12.8" r="0.75" fill={accentColor} />
            <circle cx="48" cy="12.8" r="0.75" fill={accentColor} />

            {/* Bottom serrated saw-tooth border (দাঁতিয়া পাৰি / Dati fringe pointing up) */}
            <polygon
              points="0,15 3,12.5 6,15 9,12.5 12,15 15,12.5 18,15 21,12.5 24,15 27,12.5 30,15 33,12.5 36,15 39,12.5 42,15 45,12.5 48,15 48,16 0,16"
              fill={accentColor}
            />

            {/* Bottom boundary warp thread (solid) */}
            <line x1="0" y1={height - 1} x2="48" y2={height - 1} stroke={accentColor} strokeWidth="1.2" />
          </pattern>
        </defs>
        <rect width="100%" height={height} fill={`url(#${patternId})`} />
      </svg>
    </div>
  );
}
