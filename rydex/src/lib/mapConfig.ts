import type { StyleSpecification } from "maplibre-gl";

/**
 * RideNow Modern Light Ride-Hailing Map Style Specification.
 * - Clean, light/neutral map background.
 * - Clear road hierarchy with major roads distinct over minor roads.
 * - Subtle greens, muted parks, and soft pastel water to eliminate visual clutter.
 * - Road routes and vehicle markers remain the strongest visual elements.
 * - 100% Free, zero API key required, zero watermarks.
 * - Built on OpenStreetMap tile infrastructure.
 */
export const UBER_MINIMAL_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "osm-streets": {
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
      id: "osm-streets-layer",
      type: "raster",
      source: "osm-streets",
      minzoom: 0,
      maxzoom: 19,
      paint: {
        // Gentle desaturation: parks & terrain become soft subtle sage, roads stay crisp
        "raster-saturation": -0.5,
        "raster-contrast": 0.12,
        "raster-brightness-min": 0.06,
        "raster-brightness-max": 1.0,
      },
    },
  ],
};

// Aliases for seamless compatibility
export const OSM_MAP_STYLE = UBER_MINIMAL_MAP_STYLE;
export const VOYAGER_MAP_STYLE = UBER_MINIMAL_MAP_STYLE;
export const OSM_STANDARD_STYLE = UBER_MINIMAL_MAP_STYLE;
