import type { StyleSpecification } from "maplibre-gl";

/**
 * Uber-Style Clean OpenStreetMap Cartography.
 * - 100% Free, zero API key required, zero watermarks.
 * - Direct OpenStreetMap tiles with custom raster styling.
 * - Suppresses terrain clutter, elevation noise, and bright foliage to a clean neutral tone.
 * - Keeps all roads, expressways, residential streets, and road labels sharp and legible.
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
        // Mute bright green vegetation to a neutral gray-beige tone so roads stand out like Uber
        "raster-saturation": -0.65,
        "raster-contrast": 0.18,
        "raster-brightness-min": 0.04,
        "raster-brightness-max": 0.98,
      },
    },
  ],
};

// Aliases for seamless compatibility across all map components
export const OSM_MAP_STYLE = UBER_MINIMAL_MAP_STYLE;
export const VOYAGER_MAP_STYLE = UBER_MINIMAL_MAP_STYLE;
export const OSM_STANDARD_STYLE = UBER_MINIMAL_MAP_STYLE;
