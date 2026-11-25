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
 * @param {number} lat Latitude
 * @param {number} lon Longitude
 * @param {boolean} forceRefresh If true, bypasses sessionStorage cache
 */
export async function fetchAirQuality(lat, lon, forceRefresh = false) {
  const normLat = Number(lat).toFixed(4);
  const normLon = Number(lon).toFixed(4);
  const cacheKey = `airy_aqi_${normLat}_${normLon}`;

  if (forceRefresh) {
    try {
      sessionStorage.removeItem(cacheKey);
    } catch (e) {}
  } else {
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
  }

  const endpoint = new URL('https://air-quality-api.open-meteo.com/v1/air-quality');
  endpoint.searchParams.set('latitude', normLat);
  endpoint.searchParams.set('longitude', normLon);
  endpoint.searchParams.set('current', 'european_aqi,us_aqi,pm10,pm2_5,carbon_monoxide,nitrogen_dioxide,sulphur_dioxide,ozone');
  endpoint.searchParams.set('hourly', 'pm2_5,pm10,us_aqi,ozone');
  endpoint.searchParams.set('timezone', 'auto');
  endpoint.searchParams.set('forecast_days', '2');

  // Attempt fetch with 1 automatic retry on temporary network failure
  let lastError = null;
  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(endpoint.toString(), {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Open-Meteo returned status ${response.status}: ${response.statusText}`);
      }

      const json = await response.json();
      
      // Validate current telemetry exists
      if (!json || !json.current) {
        throw new Error('Air quality sensor data is temporarily unavailable for these coordinates.');
      }

      // Compute tomorrow's forecast metrics if hourly data is present
      if (json.hourly && Array.isArray(json.hourly.us_aqi)) {
        // Next day is typically hours 24-47
        const tomorrowAqiSlice = json.hourly.us_aqi.slice(24, 48).filter(v => typeof v === 'number');
        const tomorrowPm25Slice = (json.hourly.pm2_5 || []).slice(24, 48).filter(v => typeof v === 'number');
        
        if (tomorrowAqiSlice.length > 0) {
          const avgAqi = Math.round(tomorrowAqiSlice.reduce((a, b) => a + b, 0) / tomorrowAqiSlice.length);
          const maxAqi = Math.max(...tomorrowAqiSlice);
          const avgPm25 = tomorrowPm25Slice.length > 0 
            ? (tomorrowPm25Slice.reduce((a, b) => a + b, 0) / tomorrowPm25Slice.length).toFixed(1)
            : null;
          
          json.tomorrowForecast = {
            avgAqi,
            maxAqi,
            avgPm25
          };
        }
      }

      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ timestamp: Date.now(), data: json }));
      } catch (e) {}

      return { data: json, fromCache: false };
    } catch (err) {
      clearTimeout(timeoutId);
      lastError = err;
      if (attempt === 1) {
        // Wait 800ms before second try
        await new Promise(r => setTimeout(r, 800));
      }
    }
  }

  console.error('Failed to fetch air quality after retry:', lastError);
  throw lastError || new Error('Network error connecting to Open-Meteo API.');
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
    const response = await fetch(endpoint.toString(), {
      headers: { 'Accept': 'application/json' }
    });
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
    for (const city of POPULAR_CITIES) {
      const dLat = Math.abs(city.lat - lat);
      const dLon = Math.abs(city.lon - lon);
      if (dLat < 0.25 && dLon < 0.25) {
        return city;
      }
    }

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
    admin: `${Number(lat).toFixed(2)}°, ${Number(lon).toFixed(2)}°`,
    lat,
    lon
  };
}
