'use client';

import { useEffect, useRef, useState } from 'react';

const MAPBOX_SUGGESTION_LIMIT = 5;

export interface AddressFieldSuggestion {
  formattedAddress: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
}

function parseSuggestionContext(feature: {
  place_name?: string;
  center?: [number, number];
  context?: Array<{ id?: string; text?: string; short_code?: string }>;
}): AddressFieldSuggestion {
  const context = feature.context ?? [];
  const place = context.find((item) => item.id?.startsWith('place'));
  const region = context.find((item) => item.id?.startsWith('region'));
  const postcode = context.find((item) => item.id?.startsWith('postcode'));
  return {
    city: place?.text ?? '',
    state: region?.short_code?.split('-')[1] ?? region?.text ?? '',
    zip: postcode?.text ?? '',
    formattedAddress: feature.place_name ?? '',
    lat: typeof feature.center?.[1] === 'number' ? feature.center[1] : null,
    lng: typeof feature.center?.[0] === 'number' ? feature.center[0] : null,
  };
}

interface MapboxFeature {
  id?: string;
  place_name?: string;
  text?: string;
  center?: [number, number];
  context?: Array<{ id?: string; text?: string; short_code?: string }>;
}

export function AddressField({
  label = 'Address',
  value,
  onChange,
  onSelect,
  disabled,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  onSelect: (suggestion: AddressFieldSuggestion) => void;
  disabled?: boolean;
}) {
  const [suggestions, setSuggestions] = useState<Array<{ id: string; label: string } & AddressFieldSuggestion>>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestSequenceRef = useRef(0);
  const justSelectedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (disabled) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const query = value.trim();
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!accessToken || query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    const controller = new AbortController();

    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
        url.searchParams.set('access_token', accessToken);
        url.searchParams.set('country', 'US');
        url.searchParams.set('types', 'address,place,postcode,locality,neighborhood');
        url.searchParams.set('limit', String(MAPBOX_SUGGESTION_LIMIT));
        url.searchParams.set('autocomplete', 'true');

        const response = await fetch(url, { signal: controller.signal, cache: 'no-store' });
        if (!response.ok) throw new Error('mapbox');

        const payload = (await response.json()) as { features?: MapboxFeature[] };
        if (requestSequenceRef.current !== requestId) return;

        const next = (payload.features ?? []).map((feature) => ({
          id: feature.id ?? `${feature.place_name ?? feature.text ?? 'address'}-${crypto.randomUUID()}`,
          label: feature.text ?? feature.place_name ?? 'Address',
          ...parseSuggestionContext(feature),
        }));

        setSuggestions(next);
        setOpen(next.length > 0);
      } catch {
        if (controller.signal.aborted) return;
        setSuggestions([]);
        setOpen(false);
      } finally {
        if (requestSequenceRef.current === requestId) setLoading(false);
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [disabled, value]);

  return (
    <label style={{ display: 'grid', gap: '5px', position: 'relative' }}>
      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 700, fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)' }}>
        {label}
      </span>
      <input
        ref={inputRef}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder="Search for an address"
        style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '9px 12px', color: 'var(--white)', width: '100%' }}
      />
      {loading ? (
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Searching addresses...</div>
      ) : null}
      {open && suggestions.length > 0 ? (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 20, marginTop: '6px', border: '1px solid var(--border-hi)', borderRadius: 'var(--radius-md)', background: 'var(--surface)', boxShadow: '0 12px 28px rgba(0,0,0,0.28)', overflow: 'hidden' }}>
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                justSelectedRef.current = true;
                onSelect(suggestion);
                setSuggestions([]);
                setOpen(false);
                inputRef.current?.blur();
              }}
              style={{ width: '100%', textAlign: 'left', padding: '10px 12px', border: 'none', borderTop: '1px solid var(--border)', background: 'transparent', color: 'var(--white)', cursor: 'pointer' }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{suggestion.label}</div>
              <div style={{ marginTop: '3px', fontSize: '11px', color: 'var(--muted)' }}>{suggestion.formattedAddress}</div>
            </button>
          ))}
        </div>
      ) : null}
    </label>
  );
}
