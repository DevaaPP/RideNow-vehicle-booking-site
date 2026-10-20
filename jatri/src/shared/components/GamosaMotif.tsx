import React from "react";

interface GamosaDividerProps {
  className?: string;
  accentColor?: string;
  label?: string;
}

/**
 * Assamese Gamosa-inspired Diamond Motif (কিংখাপ / Phut)
 * A clean, scalable vector diamond weave used in traditional Assamese textiles.
 */
export function GamosaDiamond({
  size = 14,
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
      {/* Outer woven diamond */}
      <polygon
        points="12,2 22,12 12,22 2,12"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      {/* Inner core diamond */}
      <polygon
        points="12,7 17,12 12,17 7,12"
        fill={color}
      />
      {/* Delicate horizontal woven threads */}
      <line x1="0" y1="12" x2="3" y2="12" stroke={color} strokeWidth="1.5" />
      <line x1="21" y1="12" x2="24" y2="12" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

/**
 * GamosaDivider
 * A continuous-flow editorial separator with a delicate Assamese vermilion diamond ornament.
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
        <GamosaDiamond size={13} color={accentColor} />
        {label && (
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#696B64] dark:text-[#929D93]">
            {label}
          </span>
        )}
        <GamosaDiamond size={13} color={accentColor} />
      </div>
      <div className="flex-1 h-px bg-[#DED7CA] dark:bg-[#34443A]" />
    </div>
  );
}

/**
 * GamosaBorder
 * A restrained, rhythmic geometric woven strip inspired by the border (দাঁহি) of a Gamosa.
 * Used at structural transition boundaries (e.g., above footers or hero sections).
 */
export function GamosaBorder({
  className = "",
  height = 8,
  accentColor = "#E34222",
}: {
  className?: string;
  height?: number;
  accentColor?: string;
}) {
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
            id="gamosa-border-pattern"
            width="24"
            height={height}
            patternUnits="userSpaceOnUse"
          >
            {/* Top and bottom thread lines */}
            <line x1="0" y1="0.5" x2="24" y2="0.5" stroke={accentColor} strokeWidth="1" strokeOpacity="0.4" />
            <line x1="0" y1={height - 0.5} x2="24" y2={height - 0.5} stroke={accentColor} strokeWidth="1" strokeOpacity="0.4" />
            {/* Geometric diamond motif */}
            <polygon
              points={`12,2 ${12 + height * 0.75},${height / 2} 12,${height - 2} ${12 - height * 0.75},${height / 2}`}
              fill={accentColor}
            />
          </pattern>
        </defs>
        <rect width="100%" height={height} fill="url(#gamosa-border-pattern)" />
      </svg>
    </div>
  );
}
