export const MAPBOX_BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

export async function fetchAddressSuggestions(query: string, country = 'IE') {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  if (!token) throw new Error('Mapbox token not set');
  if (!query) return [];
  const url = `${MAPBOX_BASE_URL}/${encodeURIComponent(query)}.json?access_token=${token}&autocomplete=true&country=${country}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch suggestions');
  const data = await res.json();
  return data.features || [];
}