import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");

  // Descriptive User-Agent to prevent rate-limiting from public Photon servers
  const headers = {
    "User-Agent": "RideNow-Vehicle-Booking-Site/1.0 (contact: support@ridenow.app; contact_page: https://ride-now-vehicle-booking-site.vercel.app/contact)"
  };

  try {
    if (action === "autocomplete") {
      const input = searchParams.get("input") || "";
      const country = (searchParams.get("country") || "in").toUpperCase();
      const lat = searchParams.get("lat");
      const lng = searchParams.get("lng");
      const bbox = searchParams.get("bbox");

      let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(input.trim())}`;
      
      if (country && country !== "NULL") {
        url += `&countrycode=${country}`;
      }
      if (bbox) {
        url += `&bbox=${bbox}`;
      }
      if (lat && lng) {
        url += `&lat=${lat}&lon=${lng}`;
      }

      let res = await fetch(url, { headers });
      let data = await res.json();

      // Fallback 1: If search within bounding box (bbox) returns nothing, try without bbox
      if (bbox && (!data?.features || data.features.length === 0)) {
        let fallbackUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(input.trim())}`;
        if (country && country !== "NULL") {
          fallbackUrl += `&countrycode=${country}`;
        }
        if (lat && lng) {
          fallbackUrl += `&lat=${lat}&lon=${lng}`;
        }
        const fallbackRes = await fetch(fallbackUrl, { headers });
        if (fallbackRes.ok) {
          data = await fallbackRes.json();
        }
      }

      // Fallback 2: If still nothing, try without country constraint to capture edge results
      if (!data?.features || data.features.length === 0) {
        let fallbackUrl2 = `https://photon.komoot.io/api/?q=${encodeURIComponent(input.trim())}`;
        if (lat && lng) {
          fallbackUrl2 += `&lat=${lat}&lon=${lng}`;
        }
        const fallbackRes2 = await fetch(fallbackUrl2, { headers });
        if (fallbackRes2.ok) {
          data = await fallbackRes2.json();
        }
      }

      // Map Photon FeatureCollection to client-compatible autocomplete predictions
      const predictions = (data?.features || []).map((feature: any) => {
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

        const place_id = `photon_${coords[1]}_${coords[0]}_${(props.countrycode || "in").toLowerCase()}_${encodeURIComponent(description)}`;

        return {
          place_id,
          description,
          lat: coords[1],
          lng: coords[0],
          countrycode: (props.countrycode || "in").toLowerCase(),
        };
      });

      return NextResponse.json(
        { predictions, status: "OK" },
        { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=86400" } }
      );
    }

    if (action === "details") {
      const placeId = searchParams.get("placeId") || "";
      
      if (placeId.startsWith("photon_")) {
        const parts = placeId.split("_");
        if (parts.length >= 5) {
          const [_, lat, lng, countrycode, ...descParts] = parts;
          const description = decodeURIComponent(descParts.join("_"));
          return NextResponse.json({
            status: "OK",
            result: {
              formatted_address: description,
              geometry: {
                location: {
                  lat: Number(lat),
                  lng: Number(lng),
                },
              },
              address_components: [
                {
                  long_name: countrycode.toUpperCase(),
                  short_name: countrycode.toLowerCase(),
                  types: ["country"],
                },
              ],
            },
          }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
        }
      }
      return NextResponse.json({ status: "INVALID_REQUEST", message: "Invalid placeId format" }, { status: 400 });
    }

    if (action === "geocode") {
      const lat = searchParams.get("lat");
      const lng = searchParams.get("lng");
      const address = searchParams.get("address");

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
          const res = await fetch(url, { headers });
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
                formatted_address: description,
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
            const nomRes = await fetch(nomUrl, { headers });
            if (nomRes.ok) {
              const nomData = await nomRes.json();
              if (Array.isArray(nomData)) {
                results = nomData.map((item: any) => ({
                  formatted_address: item.display_name,
                  geometry: {
                    location: {
                      lat: parseFloat(item.lat),
                      lng: parseFloat(item.lon),
                    },
                  },
                  address_components: [
                    {
                      long_name: item.address?.country || "India",
                      short_name: String(item.address?.country_code || "in").toLowerCase(),
                      types: ["country"],
                    },
                  ],
                }));
              }
            }
          } catch (nomErr) {
            console.warn("Nominatim address search fallback error:", nomErr);
          }
        }

        return NextResponse.json(
          { results, status: "OK" },
          { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
        );
      } else if (lat && lng) {
        let results: any[] = [];
        try {
          const url = `https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`;
          const res = await fetch(url, { headers });
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
                formatted_address: description,
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
            const nomRes = await fetch(nomUrl, { headers });
            if (nomRes.ok) {
              const nomData = await nomRes.json();
              if (nomData?.display_name) {
                results.push({
                  formatted_address: nomData.display_name,
                  geometry: {
                    location: {
                      lat: parseFloat(nomData.lat || String(lat)),
                      lng: parseFloat(nomData.lon || String(lng)),
                    },
                  },
                  address_components: [
                    {
                      long_name: nomData.address?.country || "India",
                      short_name: String(nomData.address?.country_code || "in").toLowerCase(),
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

        return NextResponse.json(
          { results, status: "OK" },
          { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } }
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
