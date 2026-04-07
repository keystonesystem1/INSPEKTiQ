interface AddressInput {
  lossAddress?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
}

interface GeocodedPoint {
  lat: number;
  lng: number;
}

function normalizePart(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function buildQuery(input: AddressInput) {
  return [
    normalizePart(input.lossAddress),
    normalizePart(input.city),
    normalizePart(input.state),
    normalizePart(input.zip),
  ]
    .filter(Boolean)
    .join(', ');
}

export async function geocodeAddress(input: AddressInput): Promise<GeocodedPoint | null> {
  const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const query = buildQuery(input);

  if (!accessToken || !query) {
    return null;
  }

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
  );
  url.searchParams.set('access_token', accessToken);
  url.searchParams.set('country', 'US');
  url.searchParams.set('limit', '1');
  url.searchParams.set('types', 'address,place,postcode,locality,neighborhood');

  try {
    const response = await fetch(url, { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      features?: Array<{ center?: [number, number] }>;
    };
    const center = payload.features?.[0]?.center;

    if (!center || typeof center[0] !== 'number' || typeof center[1] !== 'number') {
      return null;
    }

    return { lng: center[0], lat: center[1] };
  } catch {
    return null;
  }
}
