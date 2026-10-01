import type { StyleSpecification } from "maplibre-gl";

/**
 * Uber-Style Minimalist OpenStreetMap Style Specification.
 * - Desaturates busy green terrain, elevation contours, and noisy coloring.
 * - Flat, clean, high-contrast roads and infrastructure.
 * - 100% Free, zero API key required, zero watermarks.
 */
export const UBER_MINIMAL_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
      paint: {
        // Desaturate terrain, foliage, and clutter to create a clean Uber-like minimal street map
        "raster-saturation": -0.85,
        "raster-contrast": 0.12,
        "raster-brightness-min": 0.08,
        "raster-brightness-max": 0.98,
      },
    },
  ],
};

// Aliases for compatibility
export const OSM_MAP_STYLE = UBER_MINIMAL_MAP_STYLE;
export const VOYAGER_MAP_STYLE = UBER_MINIMAL_MAP_STYLE;
export const OSM_STANDARD_STYLE = UBER_MINIMAL_MAP_STYLE;
