export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { redisGet, redisSet } from "@/lib/redis";

interface CacheEntry {
  data: any;
  expiresAt: number;
}
const placesCache = new Map<string, CacheEntry>();
const PLACES_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes in-memory
const REDIS_PLACES_CACHE_TTL_SEC = 24 * 60 * 60; // 24 hours in Upstash Redis
const MAX_PLACES_CACHE_SIZE = 350;

async function getCached(key: string): Promise<any | null> {
  const entry = placesCache.get(key);
  if (entry && Date.now() <= entry.expiresAt) {
    return entry.data;
  }
  // Fallback to Upstash Redis
  const fromRedis = await redisGet(key);
  if (fromRedis) {
    placesCache.set(key, { data: fromRedis, expiresAt: Date.now() + PLACES_CACHE_TTL_MS });
    return fromRedis;
  }
  return null;
}

async function setCached(key: string, data: any, ttlSec: number = REDIS_PLACES_CACHE_TTL_SEC) {
  if (placesCache.size >= MAX_PLACES_CACHE_SIZE) {
    const firstKey = placesCache.keys().next().value;
    if (firstKey) placesCache.delete(firstKey);
  }
  placesCache.set(key, { data, expiresAt: Date.now() + PLACES_CACHE_TTL_MS });
  // Also store in Upstash Redis
  await redisSet(key, data, ttlSec);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // Descriptive User-Agent to prevent rate-limiting from public Photon servers
  const headers = {
    "User-Agent": "RideNow-Vehicle-Booking-Site/1.0 (contact: support@ridenow.app; contact_page: https://ride-now-vehicle-booking-site.vercel.app/contact)"
  };

  try {
    if (action === "autocomplete") {
      const input = (searchParams.get("input") || "").trim();
      if (!input || input.length < 2) {
        return NextResponse.json({ predictions: [], status: "OK" });
      }
      const country = (searchParams.get("country") || "in").toUpperCase();
      const lat = searchParams.get("lat") ? parseFloat(searchParams.get("lat")!) : null;
      const lng = searchParams.get("lng") ? parseFloat(searchParams.get("lng")!) : null;

      const cacheKey = `ac_v4_${input.toLowerCase()}_${country}_${lat ? lat.toFixed(2) : ""}_${lng ? lng.toFixed(2) : ""}`;
      const cached = await getCached(cacheKey);
      if (cached) {
        return NextResponse.json(
          { predictions: cached, status: "OK" },
          { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
        );
      }

      let photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(input)}&limit=15`;
      if (country && country !== "NULL") photonUrl += `&countrycode=${country.toLowerCase()}`;
      if (lat !== null && lng !== null) photonUrl += `&lat=${lat}&lon=${lng}&location_bias_scale=0.8`;

      let nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(input)}&limit=12&addressdetails=1`;
      if (country && country !== "NULL") nomUrl += `&countrycodes=${country.toLowerCase()}`;
      if (lat !== null && lng !== null) {
        // Soft bias Nominatim within ~70km around user coordinates
        const d = 0.65;
        nomUrl += `&viewbox=${lng - d},${lat + d},${lng + d},${lat - d}&bounded=0`;
      }

      const [photonResult, nomResult] = await Promise.allSettled([
        fetch(photonUrl, { headers, signal: AbortSignal.timeout(3500) }).then((r) => r.ok ? r.json() : null),
        fetch(nomUrl, { headers, signal: AbortSignal.timeout(3500) }).then((r) => r.ok ? r.json() : null),
      ]);

      const photonData = photonResult.status === "fulfilled" ? photonResult.value : null;
      const nomData = nomResult.status === "fulfilled" ? nomResult.value : null;

      const classifyCategory = (rawCat: string, name: string): string => {
        const text = `${rawCat} ${name}`.toLowerCase();
        if (text.includes("airport") || text.includes("aerodrome") || text.includes("terminal") || text.includes("airfield")) return "airport";
        if (text.includes("station") || text.includes("railway") || text.includes("junction") || text.includes("metro") || text.includes("platform")) return "train_station";
        if (text.includes("bus") || text.includes("stand") || text.includes("isbt")) return "bus_station";
        if (text.includes("hospital") || text.includes("clinic") || text.includes("medical") || text.includes("health") || text.includes("pharmacy")) return "hospital";
        if (text.includes("college") || text.includes("university") || text.includes("school") || text.includes("institute") || text.includes("campus") || text.includes("academy")) return "education";
        if (text.includes("mall") || text.includes("market") || text.includes("bazaar") || text.includes("plaza") || text.includes("store") || text.includes("supermarket")) return "shopping";
        if (text.includes("hotel") || text.includes("resort") || text.includes("inn") || text.includes("lodge")) return "hotel";
        if (text.includes("restaurant") || text.includes("cafe") || text.includes("food") || text.includes("dhaba")) return "restaurant";
        if (text.includes("post office") || text.includes("bank") || text.includes("temple") || text.includes("mosque") || text.includes("church") || text.includes("mandir") || text.includes("gurudwara")) return "landmark";
        return "place";
      };

      const rawPredictions: any[] = [];

      // 1. Process Photon results
      if (photonData?.features && Array.isArray(photonData.features)) {
        for (const feature of photonData.features) {
          const props = feature.properties || {};
          const coords = feature.geometry?.coordinates || [0, 0];
          const name = props.name || props.street || "";
          if (!name) continue;

          const streetAndNumber = [props.housenumber, props.street].filter(Boolean).join(" ");
          const localArea = props.district || props.suburb || props.locality;
          const cityTown = props.city || props.town || props.village;
          const secondary = [streetAndNumber, localArea, cityTown, props.state].filter((s) => s && s !== name).join(", ");

          const parts: string[] = [name];
          if (streetAndNumber && streetAndNumber !== name) parts.push(streetAndNumber);
          if (localArea && localArea !== name) parts.push(localArea);
          if (cityTown && cityTown !== name) parts.push(cityTown);
          if (props.postcode) parts.push(props.postcode);
          if (props.state && props.state !== name) parts.push(props.state);
          const description = parts.filter(Boolean).join(", ");

          const cat = classifyCategory(props.osm_value || props.osm_key || "", name);
          const pLat = coords[1];
          const pLng = coords[0];

          rawPredictions.push({
            place_id: `photon_${pLat}_${pLng}_${(props.countrycode || "in").toLowerCase()}_${encodeURIComponent(description)}`,
            description,
            title: name,
            subtitle: secondary || props.country || "India",
            category: cat,
            lat: pLat,
            lng: pLng,
            countrycode: (props.countrycode || "in").toLowerCase(),
            locality: localArea || "",
            city: cityTown || "",
            state: props.state || "",
            postalCode: props.postcode || "",
          });
        }
      }

      // 2. Process Nominatim results
      if (Array.isArray(nomData)) {
        for (const item of nomData) {
          const addr = item.address || {};
          const name = item.name || (item.display_name ? item.display_name.split(",")[0] : "");
          if (!name) continue;

          const street = [addr.house_number, addr.road].filter(Boolean).join(" ");
          const localArea = addr.suburb || addr.neighbourhood || addr.residential;
          const cityTown = addr.city || addr.town || addr.municipality || addr.village;
          const secondary = [street, localArea, cityTown, addr.state].filter((s) => s && s !== name).join(", ");

          const cat = classifyCategory(item.type || item.class || "", name);
          const pLat = parseFloat(item.lat);
          const pLng = parseFloat(item.lon);

          rawPredictions.push({
            place_id: `nom_${pLat}_${pLng}_in_${encodeURIComponent(item.display_name)}`,
            description: item.display_name,
            title: name,
            subtitle: secondary || "India",
            category: cat,
            lat: pLat,
            lng: pLng,
            countrycode: String(addr.country_code || "in").toLowerCase(),
            locality: localArea || "",
            city: cityTown || "",
            state: addr.state || "",
            postalCode: addr.postcode || "",
          });
        }
      }

      // 3. Deduplicate by proximity (< 50m) or identical title
      const uniquePredictions: any[] = [];
      const seenTitles = new Set<string>();

      for (const p of rawPredictions) {
        const normTitle = (p.title || "").toLowerCase().trim();
        if (seenTitles.has(normTitle)) continue;

        const isDuplicateNearby = uniquePredictions.some((ex) => {
          const dLat = Math.abs(ex.lat - p.lat);
          const dLng = Math.abs(ex.lng - p.lng);
          return dLat < 0.0005 && dLng < 0.0005;
        });

        if (!isDuplicateNearby) {
          seenTitles.add(normTitle);
          uniquePredictions.push(p);
        }
      }

      // 4. Calculate proximity distance and sort
      if (lat !== null && lng !== null) {
        uniquePredictions.forEach((p) => {
          const dLat = (p.lat - lat) * (Math.PI / 180);
          const dLng = (p.lng - lng) * (Math.PI / 180);
          const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat * (Math.PI / 180)) * Math.cos(p.lat * (Math.PI / 180)) *
            Math.sin(dLng / 2) * Math.sin(dLng / 2);
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          p.distanceKm = +(6371 * c).toFixed(1);
        });

        uniquePredictions.sort((a, b) => {
          if (a.distanceKm !== undefined && b.distanceKm !== undefined) {
            return a.distanceKm - b.distanceKm;
          }
          return 0;
        });
      }

      const predictions = uniquePredictions.slice(0, 10);

      await setCached(cacheKey, predictions);
      return NextResponse.json(
        { predictions, status: "OK" },
        { headers: { "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600" } }
      );
    }

    if (action === "details") {
      const placeId = searchParams.get("placeId") || "";

      if (placeId.startsWith("photon_") || placeId.startsWith("nom_")) {
        const parts = placeId.split("_");
        if (parts.length >= 4) {
          const isPhoton = placeId.startsWith("photon_");
          const lat = Number(parts[1]);
          const lng = Number(parts[2]);
          const countrycode = isPhoton ? parts[3] : "in";
          const descParts = isPhoton ? parts.slice(4) : parts.slice(3);
          const description = decodeURIComponent(descParts.join("_"));
          return NextResponse.json({
            status: "OK",
            result: {
              formatted_address: description,
              geometry: {
                location: { lat, lng },
              },
              address_components: [
                {
                  long_name: (countrycode || "IN").toUpperCase(),
                  short_name: (countrycode || "in").toLowerCase(),
                  types: ["country"],
                },
              ],
            },
          });
        }
      }
      return NextResponse.json({ status: "INVALID_REQUEST", message: "Invalid placeId format" }, { status: 400 });
    }

    if (action === "geocode") {
      const lat = searchParams.get("lat");
      const lng = searchParams.get("lng");
      const address = (searchParams.get("address") || "").trim();

      const cacheKey = address
        ? `gc_addr_${address.toLowerCase()}`
        : `gc_rev_${lat ? Number(lat).toFixed(4) : ""}_${lng ? Number(lng).toFixed(4) : ""}`;
      const cached = await getCached(cacheKey);
      if (cached) {
        return NextResponse.json(
          { results: cached, status: "OK" },
          { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } }
        );
      }

      if (address) {
        const country = (searchParams.get("country") || "in").toUpperCase();
        let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(address)}`;
        if (country && country !== "NULL") {
          url += `&countrycode=${country}`;
        }
        if (lat && lng) {
          url += `&lat=${lat}&lon=${lng}`;
        }

        let results: any[] = [];
        try {
          const res = await fetch(url, { headers, signal: AbortSignal.timeout(3500) });
          if (res.ok) {
            const data = await res.json();
            results = (data?.features || []).map((feature: any) => {
              const props = feature.properties || {};
              const coords = feature.geometry?.coordinates || [0, 0];
              const streetAndNumber = [props.housenumber, props.street].filter(Boolean).join(" ");
              const localArea = props.district || props.suburb || props.locality;
              const cityTown = props.city || props.town || props.village;
              const parts: string[] = [props.name];
              if (streetAndNumber && streetAndNumber !== props.name) parts.push(streetAndNumber);
              if (localArea && localArea !== props.name) parts.push(localArea);
              if (cityTown && cityTown !== props.name) parts.push(cityTown);
              if (props.postcode) parts.push(props.postcode);
              if (props.state && props.state !== props.name) parts.push(props.state);
              if (props.country && props.country !== props.name) parts.push(props.country);
              const description = parts.filter(Boolean).join(", ");
              
              return {
                name: props.name || localArea || cityTown || "Selected Location",
                formatted_address: description,
                locality: localArea || "",
                city: cityTown || "",
                state: props.state || "",
                postalCode: props.postcode || "",
                geometry: {
                  location: {
                    lat: coords[1],
                    lng: coords[0],
                  },
                },
                address_components: [
                  {
                    long_name: props.country || "India",
                    short_name: String(props.countrycode || "in").toLowerCase(),
                    types: ["country"],
                  },
                ],
              };
            });
          }
        } catch (e) {
          console.warn("Photon address geocode error:", e);
        }

        // Secondary fallback to Nominatim search if no results
        if (results.length === 0) {
          try {
            let nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=5&addressdetails=1`;
            if (country && country !== "NULL") {
              nomUrl += `&countrycodes=${country.toLowerCase()}`;
            }
            const nomRes = await fetch(nomUrl, { headers, signal: AbortSignal.timeout(3500) });
            if (nomRes.ok) {
              const nomData = await nomRes.json();
              if (Array.isArray(nomData)) {
                results = nomData.map((item: any) => {
                  const addr = item.address || {};
                  return {
                    name: item.name || addr.amenity || addr.building || addr.road || "Selected Location",
                    formatted_address: item.display_name,
                    locality: addr.suburb || addr.neighbourhood || addr.residential || "",
                    city: addr.city || addr.town || addr.village || addr.county || "",
                    state: addr.state || "",
                    postalCode: addr.postcode || "",
                    geometry: {
                      location: {
                        lat: parseFloat(item.lat),
                        lng: parseFloat(item.lon),
                      },
                    },
                    address_components: [
                      {
                        long_name: addr.country || "India",
                        short_name: String(addr.country_code || "in").toLowerCase(),
                        types: ["country"],
                      },
                    ],
                  };
                });
              }
            }
          } catch (nomErr) {
            console.warn("Nominatim address search fallback error:", nomErr);
          }
        }

        await setCached(cacheKey, results);
        return NextResponse.json(
          { results, status: "OK" },
          { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } }
        );
      } else if (lat && lng) {
        let results: any[] = [];
        try {
          const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
          const res = await fetch(url, { headers, signal: AbortSignal.timeout(3500) });
          if (res.ok) {
            const data = await res.json();
            results = (data?.features || []).map((feature: any) => {
              const props = feature.properties || {};
              const coords = feature.geometry?.coordinates || [0, 0];
              const streetAndNumber = [props.housenumber, props.street].filter(Boolean).join(" ");
              const localArea = props.district || props.suburb || props.locality;
              const cityTown = props.city || props.town || props.village;
              const parts: string[] = [props.name];
              if (streetAndNumber && streetAndNumber !== props.name) parts.push(streetAndNumber);
              if (localArea && localArea !== props.name) parts.push(localArea);
              if (cityTown && cityTown !== props.name) parts.push(cityTown);
              if (props.postcode) parts.push(props.postcode);
              if (props.state && props.state !== props.name) parts.push(props.state);
              if (props.country && props.country !== props.name) parts.push(props.country);
              const description = parts.filter(Boolean).join(", ");
              
              return {
                name: props.name || localArea || cityTown || "Pin Location",
                formatted_address: description,
                locality: localArea || "",
                city: cityTown || "",
                state: props.state || "",
                postalCode: props.postcode || "",
                geometry: {
                  location: {
                    lat: coords[1],
                    lng: coords[0],
                  },
                },
                address_components: [
                  {
                    long_name: props.country || "India",
                    short_name: String(props.countrycode || "in").toLowerCase(),
                    types: ["country"],
                  },
                ],
              };
            });
          }
        } catch (e) {
          console.warn("Photon reverse failed, falling back to Nominatim:", e);
        }

        // Secondary fallback: Nominatim OpenStreetMap reverse geocoding
        if (results.length === 0) {
          try {
            const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
            const nomRes = await fetch(nomUrl, { headers, signal: AbortSignal.timeout(3500) });
            if (nomRes.ok) {
              const nomData = await nomRes.json();
              if (nomData?.display_name) {
                const nomAddr = nomData.address || {};
                results.push({
                  name: nomData.name || nomAddr.amenity || nomAddr.building || nomAddr.road || "Pin Location",
                  formatted_address: nomData.display_name,
                  locality: nomAddr.suburb || nomAddr.neighbourhood || nomAddr.residential || "",
                  city: nomAddr.city || nomAddr.town || nomAddr.village || nomAddr.county || "",
                  state: nomAddr.state || "",
                  postalCode: nomAddr.postcode || "",
                  geometry: {
                    location: {
                      lat: parseFloat(nomData.lat || String(lat)),
                      lng: parseFloat(nomData.lon || String(lng)),
                    },
                  },
                  address_components: [
                    {
                      long_name: nomAddr.country || "India",
                      short_name: String(nomAddr.country_code || "in").toLowerCase(),
                      types: ["country"],
                    },
                  ],
                });
              }
            }
          } catch (nomErr) {
            console.warn("Nominatim reverse fallback error:", nomErr);
          }
        }

        await setCached(cacheKey, results);
        return NextResponse.json(
          { results, status: "OK" },
          { headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200" } }
        );
      }
      return NextResponse.json({ status: "INVALID_REQUEST", message: "Missing coordinates or address" }, { status: 400 });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Places Proxy Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
