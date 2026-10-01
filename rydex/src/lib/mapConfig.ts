import type { StyleSpecification } from "maplibre-gl";

/**
 * 100% Free & Open-Source OpenStreetMap Tile Specification.
 * Zero API keys required, zero watermarks.
 * Uses official OpenStreetMap distributed edge tile servers (a, b, c).
 */
export const OSM_MAP_STYLE: StyleSpecification = {
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
        // Slight subtle contrast adjustment for clean road visibility
        "raster-contrast": 0.04,
      },
    },
  ],
};

/**
 * Clean Humanitarian OpenStreetMap style (soft pleasant palette).
 */
export const OSM_HOT_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    "osm-hot-tiles": {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
  },
  layers: [
    {
      id: "osm-hot-tiles-layer",
      type: "raster",
      source: "osm-hot-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

// Aliased to OSM_MAP_STYLE so all components automatically use 100% free unwatermarked tiles
export const VOYAGER_MAP_STYLE = OSM_MAP_STYLE;
export const OSM_STANDARD_STYLE = OSM_MAP_STYLE;
