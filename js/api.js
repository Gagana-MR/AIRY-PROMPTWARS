/**
 * AIRY - Real-time Air Quality & Geocoding API Client
 * Uses Open-Meteo Air Quality & Geocoding APIs (Free, real-time, global, no API key required)
 */

export const POPULAR_CITIES = [
  { name: 'Bengaluru', country: 'India', lat: 12.9716, lon: 77.5946, admin: 'Karnataka' },
  { name: 'New Delhi', country: 'India', lat: 28.6139, lon: 77.2090, admin: 'Delhi' },
  { name: 'Mumbai', country: 'India', lat: 19.0760, lon: 72.8777, admin: 'Maharashtra' },
  { name: 'New York', country: 'United States', lat: 40.7128, lon: -74.0060, admin: 'New York' },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lon: -0.1278, admin: 'England' },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lon: 139.6503, admin: 'Tokyo' },
  { name: 'Paris', country: 'France', lat: 48.8566, lon: 2.3522, admin: 'Île-de-France' },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lon: 103.8198, admin: 'Singapore' }
];

export const DEFAULT_CITY = POPULAR_CITIES[0]; // Bengaluru

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes cache

/**
 * Fetch real-time Air Quality data for latitude & longitude
 */
export async function fetchAirQuality(lat, lon) {
  const cacheKey = `airy_aqi_${lat.toFixed(3)}_${lon.toFixed(3)}`;
  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_TTL_MS) {
        return { data: parsed.data, fromCache: true };
      }
    }
  } catch (e) {
    console.warn('Session storage read failed', e);
  }

  const endpoint = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  endpoint.searchParams.set('latitude', lat);
  endpoint.searchParams.set('longitude', lon);
  endpoint.searchParams.set('current', 'european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone');
  endpoint.searchParams.set('hourly', 'pm2_5,pm10,us_aqi,ozone');
  endpoint.searchParams.set('timezone', 'auto');
  endpoint.searchParams.set('forecast_days', '2');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(endpoint.toString(), { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Open-Meteo returned status ${response.status}: ${response.statusText}`);
    }

    const json = await response.json();
    
    // Validate current data
    if (!json.current) {
      throw new Error('Air quality data unavailable for this location.');
    }

    try {
      sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: json }));
    } catch (e) {
      // Storage full or unavailable
    }

    return { data: json, fromCache: false };
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('Failed to fetch air quality:', err);
    throw err;
  }
}

/**
 * Search cities using Open-Meteo Geocoding API
 */
export async function searchCities(query) {
  const trimmed = query.trim();
  if (!trimmed || trimmed.length < 2) return [];

  const endpoint = new URL('https://geocoding-api.open-meteo.com/v1/search');
  endpoint.searchParams.set('name', trimmed);
  endpoint.searchParams.set('count', '6');
  endpoint.searchParams.set('language', 'en');
  endpoint.searchParams.set('format', 'json');

  try {
    const response = await fetch(endpoint.toString());
    if (!response.ok) return [];
    const data = await response.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map(r => ({
      name: r.name,
      country: r.country || '',
      admin: r.admin1 || r.admin2 || '',
      lat: r.latitude,
      lon: r.longitude
    }));
  } catch (err) {
    console.warn('Geocoding search failed:', err);
    return [];
  }
}

/**
 * Reverse geocode coordinates to City Name
 */
export async function reverseGeocode(lat, lon) {
  try {
    // Check if it matches any popular city closely
    for (const city of POPULAR_CITIES) {
      const dLat = Math.abs(city.lat - lat);
      const dLon = Math.abs(city.lon - lon);
      if (dLat < 0.25 && dLon < 0.25) {
        return city;
      }
    }

    // Try BigDataCloud open client-side geocoding API or default fallback
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
    if (res.ok) {
      const data = await res.json();
      return {
        name: data.locality || data.city || 'Current Location',
        country: data.countryName || '',
        admin: data.principalSubdivision || '',
        lat,
        lon
      };
    }
  } catch (e) {
    console.warn('Reverse geocode failed:', e);
  }

  return {
    name: 'Your Location',
    country: '',
    admin: `${lat.toFixed(2)}°, ${lon.toFixed(2)}°`,
    lat,
    lon
  };
}
