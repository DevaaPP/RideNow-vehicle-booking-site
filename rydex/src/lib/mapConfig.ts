import type { StyleSpecification } from "maplibre-gl";

/**
 * Uber-Style Clean Road & Street Map Specification.
 * - Pure roads, streets, highways, and street labels only.
 * - Zero terrain clutter, zero elevation contours, zero distracting vegetation patches.
 * - High-contrast street cartography modeled after Uber & Google Maps.
 * - 100% Free, zero API key required, zero watermarks.
 * - Built on OpenStreetMap data via Carto Positron CDN.
 */
export const UBER_MINIMAL_MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "uber-streets": {
      type: "raster",
      tiles: [
        "https://a.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
        "https://b.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
        "https://c.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
        "https://d.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions" target="_blank" rel="noopener noreferrer">CARTO</a>',
    },
  },
  layers: [
    {
      id: "uber-streets-layer",
      type: "raster",
      source: "uber-streets",
      minzoom: 0,
      maxzoom: 20,
      paint: {
        // Crisp, high-clarity roads with minimal background noise
        "raster-contrast": 0.1,
        "raster-saturation": 0.05,
        "raster-brightness-min": 0.0,
        "raster-brightness-max": 1.0,
      },
    },
  ],
};

// Aliases for seamless compatibility across all map components
export const OSM_MAP_STYLE = UBER_MINIMAL_MAP_STYLE;
export const VOYAGER_MAP_STYLE = UBER_MINIMAL_MAP_STYLE;
export const OSM_STANDARD_STYLE = UBER_MINIMAL_MAP_STYLE;
