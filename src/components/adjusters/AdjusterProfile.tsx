'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FormInput } from '@/components/ui/FormInput';
import type { CarrierOption } from '@/lib/supabase/adjusters';
import type { AdjusterHomeBase, AdjusterRow } from '@/lib/types';

const CERTIFICATION_OPTIONS = ['TWIA Cert', 'Flood Cert', 'Commercial Lic', 'Drone Cert', 'Xactimate Cert'] as const;
const CLAIM_TYPE_OPTIONS = ['Residential', 'Commercial', 'Farm/Ranch', 'Industrial', 'Flood', 'Auto'] as const;
const AVAILABILITY_OPTIONS = ['available', 'busy', 'remote', 'on_leave'] as const;
const MAPBOX_SUGGESTION_LIMIT = 5;

interface EditableHomeBase extends AdjusterHomeBase {
  localId: string;
}

interface MapboxSuggestion {
  id: string;
  label: string;
  formattedAddress: string;
  city: string;
  state: string;
  zip: string;
  lat: number | null;
  lng: number | null;
}

function buildMissingItems(values: {
  firstName: string;
  lastName: string;
  certifications: string[];
  approvedClaimTypes: string[];
  approvedCarrierIds: string[];
  homeBases: AdjusterHomeBase[];
}) {
  const missing: string[] = [];

  if (!values.firstName.trim() || !values.lastName.trim()) {
    missing.push('name');
  }
  if (values.certifications.length === 0) {
    missing.push('certifications');
  }
  if (values.approvedClaimTypes.length === 0) {
    missing.push('claim types');
  }
  if (values.approvedCarrierIds.length === 0) {
    missing.push('carriers');
  }
  if (values.homeBases.length === 0) {
    missing.push('home base');
  }

  return missing;
}

function defaultHomeBase(): AdjusterHomeBase {
  return {
    name: '',
    address: '',
    formattedAddress: '',
    city: '',
    state: '',
    zip: '',
    lat: null,
    lng: null,
    isPrimary: true,
  };
}

function getAvailabilityLabel(value: (typeof AVAILABILITY_OPTIONS)[number]) {
  if (value === 'available') return 'Available';
  if (value === 'busy') return 'Busy';
  if (value === 'on_leave') return 'On Leave';
  return 'Remote';
}

function createEditableHomeBase(homeBase?: Partial<AdjusterHomeBase>): EditableHomeBase {
  return {
    localId:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ...defaultHomeBase(),
    ...homeBase,
  };
}

function parseSuggestionContext(feature: {
  place_name?: string;
  center?: [number, number];
  properties?: Record<string, unknown>;
  context?: Array<{ id?: string; text?: string; short_code?: string }>;
}) {
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

function HomeBaseAddressField({
  value,
  disabled,
  onChange,
  onSelect,
}: {
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSelect: (suggestion: MapboxSuggestion) => void;
}) {
  const [suggestions, setSuggestions] = useState<MapboxSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const requestSequenceRef = useRef(0);

  useEffect(() => {
    if (disabled) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    const query = value.trim();
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;

    if (!accessToken || query.length < 3) {
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    const requestId = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestId;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(async () => {
      setLoading(true);
      try {
        const url = new URL(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`,
        );
        url.searchParams.set('access_token', accessToken);
        url.searchParams.set('country', 'US');
        url.searchParams.set('types', 'address,place,postcode,locality,neighborhood');
        url.searchParams.set('limit', String(MAPBOX_SUGGESTION_LIMIT));
        url.searchParams.set('autocomplete', 'true');

        const response = await fetch(url, {
          signal: controller.signal,
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Unable to load address suggestions.');
        }

        const payload = (await response.json()) as {
          features?: Array<{
            id?: string;
            place_name?: string;
            text?: string;
            center?: [number, number];
            properties?: Record<string, unknown>;
            context?: Array<{ id?: string; text?: string; short_code?: string }>;
          }>;
        };

        if (requestSequenceRef.current !== requestId) {
          return;
        }

        const nextSuggestions = (payload.features ?? []).map((feature) => {
          const parsed = parseSuggestionContext(feature);
          return {
            id: feature.id ?? `${feature.place_name ?? feature.text ?? 'address'}-${Math.random().toString(16).slice(2)}`,
            label: feature.text ?? feature.place_name ?? 'Address',
            ...parsed,
          } satisfies MapboxSuggestion;
        });

        setSuggestions(nextSuggestions);
        setOpen(nextSuggestions.length > 0);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }
        setSuggestions([]);
        setOpen(false);
      } finally {
        if (requestSequenceRef.current === requestId) {
          setLoading(false);
        }
      }
    }, 250);

    return () => {
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [disabled, value]);

  return (
    <label style={{ display: 'grid', gap: '5px', position: 'relative' }}>
      <span
        style={{
          fontFamily: 'Barlow Condensed, sans-serif',
          fontWeight: 700,
          fontSize: '10px',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--muted)',
        }}
      >
        Address
      </span>
      <input
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          setOpen(true);
        }}
        onBlur={() => {
          window.setTimeout(() => setOpen(false), 150);
        }}
        onFocus={() => {
          if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        placeholder="Search for an address"
        disabled={disabled}
        className="form-input"
        style={{
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '9px 12px',
          color: 'var(--white)',
          width: '100%',
        }}
      />
      {loading ? (
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>Searching addresses...</div>
      ) : null}
      {open && suggestions.length > 0 ? (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 20,
            marginTop: '6px',
            border: '1px solid var(--border-hi)',
            borderRadius: 'var(--radius-md)',
            background: 'var(--surface)',
            boxShadow: '0 12px 28px rgba(0,0,0,0.28)',
            overflow: 'hidden',
          }}
        >
          {suggestions.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onMouseDown={(event) => {
                event.preventDefault();
                onSelect(suggestion);
                setOpen(false);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                border: 'none',
                borderTop: '1px solid var(--border)',
                background: 'transparent',
                color: 'var(--white)',
                cursor: 'pointer',
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600 }}>{suggestion.label}</div>
              <div style={{ marginTop: '3px', fontSize: '11px', color: 'var(--muted)' }}>
                {suggestion.formattedAddress}
              </div>
            </button>
          ))}
        </div>
      ) : null}
    </label>
  );
}

export function AdjusterProfile({
  adjuster,
  carrierOptions,
  canEdit,
}: {
  adjuster: AdjusterRow;
  carrierOptions: CarrierOption[];
  canEdit: boolean;
}) {
  const router = useRouter();
  const [firstName, setFirstName] = useState(adjuster.firstName ?? '');
  const [lastName, setLastName] = useState(adjuster.lastName ?? '');
  const [isActive, setIsActive] = useState(adjuster.isActive);
  const [maxActiveClaims, setMaxActiveClaims] = useState(String(adjuster.maxActiveClaims));
  const [availability, setAvailability] = useState(adjuster.availability);
  const [certifications, setCertifications] = useState<string[]>(adjuster.certifications);
  const [approvedClaimTypes, setApprovedClaimTypes] = useState<string[]>(adjuster.approvedClaimTypes);
  const [approvedCarrierIds, setApprovedCarrierIds] = useState<string[]>(adjuster.approvedCarriers);
  const [homeBases, setHomeBases] = useState<EditableHomeBase[]>(
    adjuster.homeBases.length
      ? adjuster.homeBases.map((homeBase) => createEditableHomeBase(homeBase))
      : [createEditableHomeBase()],
  );
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const missingItems = useMemo(
    () =>
      buildMissingItems({
        firstName,
        lastName,
        certifications,
        approvedClaimTypes,
        approvedCarrierIds,
        homeBases: homeBases.filter(
          (homeBase) =>
            homeBase.name.trim() ||
            homeBase.address?.trim() ||
            homeBase.city.trim() ||
            homeBase.state.trim() ||
            homeBase.zip.trim(),
        ),
      }),
    [approvedCarrierIds, approvedClaimTypes, certifications, firstName, homeBases, lastName],
  );

  async function handleSave() {
    if (!canEdit) {
      return;
    }

    setSaving(true);
    setError(null);
    setToastMessage(null);

    try {
      const response = await fetch(`/api/adjusters/${adjuster.userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          isActive,
          maxActiveClaims: Math.min(30, Math.max(1, Number(maxActiveClaims) || 1)),
          availability,
          certifications,
          approvedClaimTypes,
          approvedCarrierIds,
          homeBases: homeBases
            .filter(
              (homeBase) =>
                homeBase.name.trim() ||
                homeBase.address?.trim() ||
                homeBase.city.trim() ||
                homeBase.state.trim() ||
                homeBase.zip.trim(),
            )
            .map(({ localId: _localId, ...homeBase }) => homeBase),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? 'Unable to save adjuster profile.');
      }

      setToastMessage('Profile saved.');
      setTimeout(() => {
        setToastMessage((current) => (current === 'Profile saved.' ? null : current));
      }, 3000);
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save adjuster profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: 'grid', gap: '18px' }}>
      {missingItems.length > 0 ? (
        <div
          style={{
            border: '1px solid rgba(224,123,63,0.35)',
            background: 'rgba(224,123,63,0.1)',
            color: 'var(--orange)',
            borderRadius: 'var(--radius-lg)',
            padding: '12px 14px',
          }}
        >
          <div
            style={{
              fontFamily: 'Barlow Condensed, sans-serif',
              fontWeight: 800,
              fontSize: '12px',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              marginBottom: '6px',
            }}
          >
            Profile Incomplete
          </div>
          <div style={{ fontSize: '12px' }}>
            Missing: {missingItems.join(', ')}
          </div>
        </div>
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 360px) minmax(0, 1fr)', gap: '18px' }}>
        <div style={{ display: 'grid', gap: '18px' }}>
          <Card>
            <div style={{ display: 'grid', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '999px',
                    display: 'grid',
                    placeItems: 'center',
                    background: 'var(--blue-dim)',
                    border: '2px solid var(--blue)',
                    color: 'var(--blue)',
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 800,
                    fontSize: '20px',
                  }}
                >
                  {adjuster.initials}
                </div>
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--white)' }}>{adjuster.displayName}</div>
                  <div style={{ marginTop: '4px', color: 'var(--muted)', fontSize: '12px' }}>{adjuster.email}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <FormInput label="First Name" value={firstName} onChange={setFirstName} />
                  <FormInput label="Last Name" value={lastName} onChange={setLastName} />
                </div>

                <label style={{ display: 'grid', gap: '5px' }}>
                  <span
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700,
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                    }}
                  >
                    Email
                  </span>
                  <div
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '9px 12px',
                      color: 'var(--muted)',
                      fontSize: '13px',
                    }}
                  >
                    {adjuster.email}
                  </div>
                </label>

                <label
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    background: 'var(--surface)',
                  }}
                >
                  <span
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700,
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                    }}
                  >
                    Active
                  </span>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(event) => setIsActive(event.target.checked)}
                    disabled={!canEdit || saving}
                  />
                </label>
              </div>
            </div>
          </Card>
        </div>

        <div style={{ display: 'grid', gap: '18px' }}>
          <Card>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                Dispatch Capacity
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '140px 140px 1fr', gap: '12px' }}>
                <FormInput label="Max Active Claims" value={maxActiveClaims} onChange={setMaxActiveClaims} />
                <label style={{ display: 'grid', gap: '5px' }}>
                  <span
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700,
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                    }}
                  >
                    Current Active Claims
                  </span>
                  <div
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '9px 12px',
                      color: 'var(--white)',
                    }}
                  >
                    {adjuster.activeClaims}
                  </div>
                </label>
                <label style={{ display: 'grid', gap: '5px' }}>
                  <span
                    style={{
                      fontFamily: 'Barlow Condensed, sans-serif',
                      fontWeight: 700,
                      fontSize: '10px',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      color: 'var(--muted)',
                    }}
                  >
                    Availability
                  </span>
                  <select
                    value={availability}
                    onChange={(event) => setAvailability(event.target.value as (typeof AVAILABILITY_OPTIONS)[number])}
                    disabled={!canEdit || saving}
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: '9px 12px',
                      color: 'var(--white)',
                    }}
                  >
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {getAvailabilityLabel(option)}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                Certifications
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {CERTIFICATION_OPTIONS.map((option) => {
                  const checked = certifications.includes(option);
                  return (
                    <label
                      key={option}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        background: checked ? 'var(--sage-dim)' : 'var(--surface)',
                        color: checked ? 'var(--sage)' : 'var(--white)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setCertifications((current) =>
                            checked ? current.filter((item) => item !== option) : [...current, option],
                          )
                        }
                        disabled={!canEdit || saving}
                      />
                      <span style={{ fontSize: '12px' }}>{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                Approved Claim Types
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                {CLAIM_TYPE_OPTIONS.map((option) => {
                  const checked = approvedClaimTypes.includes(option);
                  return (
                    <label
                      key={option}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        background: checked ? 'var(--sage-dim)' : 'var(--surface)',
                        color: checked ? 'var(--sage)' : 'var(--white)',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setApprovedClaimTypes((current) =>
                            checked ? current.filter((item) => item !== option) : [...current, option],
                          )
                        }
                        disabled={!canEdit || saving}
                      />
                      <span style={{ fontSize: '12px' }}>{option}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </Card>

          <Card>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontWeight: 700,
                  fontSize: '11px',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: 'var(--muted)',
                }}
              >
                Approved Carriers
              </div>
              {carrierOptions.length ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {carrierOptions.map((carrier) => {
                    const checked = approvedCarrierIds.includes(carrier.id);
                    return (
                      <label
                        key={carrier.id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border)',
                          background: checked ? 'var(--sage-dim)' : 'var(--surface)',
                          color: checked ? 'var(--sage)' : 'var(--white)',
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setApprovedCarrierIds((current) =>
                              checked ? current.filter((item) => item !== carrier.id) : [...current, carrier.id],
                            )
                          }
                          disabled={!canEdit || saving}
                        />
                        <span style={{ fontSize: '12px' }}>{carrier.name}</span>
                      </label>
                    );
                  })}
                </div>
              ) : (
                <div
                  style={{
                    border: '1px dashed var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px',
                    color: 'var(--muted)',
                    fontSize: '12px',
                    background: 'var(--surface)',
                  }}
                >
                  No firm carriers were loaded for this profile. Carrier options come from the firm&apos;s carriers table.
                </div>
              )}
            </div>
          </Card>

          <Card>
            <div style={{ display: 'grid', gap: '14px' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    fontFamily: 'Barlow Condensed, sans-serif',
                    fontWeight: 700,
                    fontSize: '11px',
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--muted)',
                  }}
                >
                  Home Bases
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setHomeBases((current) => [
                      ...current.map((homeBase) => ({ ...homeBase, isPrimary: current.length === 0 ? true : homeBase.isPrimary })),
                      createEditableHomeBase({ isPrimary: current.length === 0 }),
                    ])
                  }
                  disabled={!canEdit || saving}
                >
                  Add Home Base
                </Button>
              </div>

              <div style={{ display: 'grid', gap: '12px' }}>
                {homeBases.map((homeBase) => (
                  <div
                    key={homeBase.localId}
                    style={{
                      display: 'grid',
                      gap: '12px',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: '12px',
                      background: 'var(--surface)',
                    }}
                  >
                    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 220px) minmax(0, 1fr) auto', gap: '12px' }}>
                      <FormInput
                        label="Label"
                        value={homeBase.name}
                        onChange={(value) =>
                          setHomeBases((current) =>
                            current.map((item) => (item.localId === homeBase.localId ? { ...item, name: value } : item)),
                          )
                        }
                      />
                      <HomeBaseAddressField
                        value={homeBase.address ?? ''}
                        disabled={!canEdit || saving}
                        onChange={(value) =>
                          setHomeBases((current) =>
                            current.map((item) =>
                              item.localId === homeBase.localId
                                ? {
                                    ...item,
                                    address: value,
                                    formattedAddress: value,
                                    city: '',
                                    state: '',
                                    zip: '',
                                    lat: null,
                                    lng: null,
                                  }
                                : item,
                            ),
                          )
                        }
                        onSelect={(suggestion) =>
                          setHomeBases((current) =>
                            current.map((item) =>
                              item.localId === homeBase.localId
                                ? {
                                    ...item,
                                    address: suggestion.formattedAddress,
                                    formattedAddress: suggestion.formattedAddress,
                                    city: suggestion.city,
                                    state: suggestion.state,
                                    zip: suggestion.zip,
                                    lat: suggestion.lat,
                                    lng: suggestion.lng,
                                  }
                                : item,
                            ),
                          )
                        }
                      />
                      <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            setHomeBases((current) => current.filter((item) => item.localId !== homeBase.localId))
                          }
                          disabled={!canEdit || saving}
                        >
                          Remove
                        </Button>
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: '12px',
                      }}
                    >
                      {[
                        ['City', homeBase.city || 'Will fill from selected address'],
                        ['State', homeBase.state || 'Will fill from selected address'],
                        ['ZIP', homeBase.zip || 'Will fill from selected address'],
                      ].map(([label, value]) => (
                        <label key={label} style={{ display: 'grid', gap: '5px' }}>
                          <span
                            style={{
                              fontFamily: 'Barlow Condensed, sans-serif',
                              fontWeight: 700,
                              fontSize: '10px',
                              letterSpacing: '0.1em',
                              textTransform: 'uppercase',
                              color: 'var(--muted)',
                            }}
                          >
                            {label}
                          </span>
                          <div
                            style={{
                              border: '1px solid var(--border)',
                              borderRadius: 'var(--radius-md)',
                              background: 'var(--card)',
                              padding: '9px 12px',
                              color: value.includes('selected address') ? 'var(--muted)' : 'var(--white)',
                              fontSize: '12px',
                            }}
                          >
                            {value}
                          </div>
                        </label>
                      ))}
                    </div>

                    <label
                      style={{
                        display: 'grid',
                        gap: '5px',
                      }}
                    >
                      <span
                        style={{
                          fontFamily: 'Barlow Condensed, sans-serif',
                          fontWeight: 700,
                          fontSize: '10px',
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                          color: 'var(--muted)',
                        }}
                      >
                        Selected Address
                      </span>
                      <div
                        style={{
                          border: '1px solid var(--border)',
                          borderRadius: 'var(--radius-md)',
                          background: 'var(--card)',
                          padding: '9px 12px',
                          color: homeBase.formattedAddress ? 'var(--white)' : 'var(--muted)',
                          fontSize: '12px',
                        }}
                      >
                        {homeBase.formattedAddress || 'Search and select an address above to store coordinates.'}
                      </div>
                    </label>

                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: 'var(--muted)',
                        fontSize: '12px',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={homeBase.isPrimary}
                        onChange={() =>
                          setHomeBases((current) =>
                            current.map((item) => ({
                              ...item,
                              isPrimary: item.localId === homeBase.localId,
                            })),
                          )
                        }
                        disabled={!canEdit || saving}
                      />
                      <span>Primary Home Base</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {error ? <div style={{ color: 'var(--red)', fontSize: '12px' }}>{error}</div> : null}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        {toastMessage ? (
          <div
            style={{
              borderRadius: 'var(--radius-md)',
              background: 'var(--sage-dim)',
              color: 'var(--sage)',
              border: '1px solid rgba(91,194,115,0.2)',
              padding: '9px 12px',
              fontSize: '12px',
            }}
          >
            {toastMessage}
          </div>
        ) : <div />}
        <Button onClick={() => void handleSave()} disabled={!canEdit || saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
