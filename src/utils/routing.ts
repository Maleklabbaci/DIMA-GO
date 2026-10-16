import { LatLng, haversineDistanceKm, estimateRoadDistanceKm } from './pricing';

export interface RouteResult {
  distanceKm: number;
  durationMin: number;
  coordinates: [number, number][]; // [lat, lng] array
  isFallback: boolean;
}

/**
 * Fetch exact road route via OSRM with automatic Haversine fallback.
 * Ensures the phone calculator never blocks or stalls during a fast phone order.
 */
export async function fetchOSRMRoute(
  origin: LatLng,
  destination: LatLng
): Promise<RouteResult> {
  const directDist = haversineDistanceKm(origin.lat, origin.lng, destination.lat, destination.lng);
  const fallbackDistanceKm = estimateRoadDistanceKm(directDist);
  const fallbackDurationMin = Math.max(4, Math.round((fallbackDistanceKm / 28) * 60)); // ~28km/h motorcycle speed

  const fallbackResult: RouteResult = {
    distanceKm: fallbackDistanceKm,
    durationMin: fallbackDurationMin,
    coordinates: [
      [origin.lat, origin.lng],
      [
        (origin.lat + destination.lat) / 2 + 0.002,
        (origin.lng + destination.lng) / 2 - 0.002,
      ],
      [destination.lat, destination.lng],
    ],
    isFallback: true,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const url = `https://router.project-osrm.org/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) {
      return fallbackResult;
    }

    const data = await res.json();
    if (data.code !== 'Ok' || !data.routes || !data.routes[0]) {
      return fallbackResult;
    }

    const route = data.routes[0];
    const distanceKm = Number((route.distance / 1000).toFixed(1));
    const durationMin = Math.max(3, Math.round(route.duration / 60));

    // OSRM coordinates are [lng, lat], convert to [lat, lng] for Leaflet
    const coordinates: [number, number][] = route.geometry.coordinates.map(
      (coord: [number, number]) => [coord[1], coord[0]]
    );

    return {
      distanceKm,
      durationMin,
      coordinates,
      isFallback: false,
    };
  } catch {
    return fallbackResult;
  }
}

export interface NominatimPlace {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

/**
 * Search local Algerian landmarks or streets via Nominatim
 */
export async function searchLandmarkNominatim(query: string): Promise<NominatimPlace[]> {
  if (!query || query.trim().length < 3) return [];
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    // Focus search around Wilaya Tipaza / Blida / Alger
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query + ', Tipaza'
    )}&limit=5&countrycodes=dz`;

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'fr,ar',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    return (await res.json()) as NominatimPlace[];
  } catch {
    return [];
  }
}
