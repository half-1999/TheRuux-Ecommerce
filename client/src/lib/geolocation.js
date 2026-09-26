/**
 * Reverse-geocode browser location via OpenStreetMap Nominatim (no API key).
 * Returns partial address fields for checkout autofill.
 */
export async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&addressdetails=1`;

  const res = await fetch(url, {
    headers: {
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error('Geocode failed');
  const data = await res.json();
  const a = data.address || {};

  const line1 = [a.house_number, a.road || a.pedestrian || a.neighbourhood]
    .filter(Boolean)
    .join(' ');

  return {
    line1: line1 || a.suburb || '',
    line2: a.suburb && line1 ? a.suburb : a.neighbourhood || '',
    city: a.city || a.town || a.village || a.county || '',
    state: a.state || a.region || '',
    postalCode: a.postcode || '',
    country: (a.country_code || 'in').toUpperCase().slice(0, 2),
  };
}

export function requestGeolocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 300000 },
    );
  });
}
