'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { format, parseISO } from 'date-fns';
import mapboxgl from 'mapbox-gl';
import type { Feature, FeatureCollection, LineString } from 'geojson';
import type { Appointment, SchedulingQueueItem } from '@/lib/types';
import { useTheme } from '@/components/providers/ThemeProvider';

interface RouteMapProps {
  open: boolean;
  selectedDay: string | null;
  appointments: Appointment[];
  unscheduledClaims: SchedulingQueueItem[];
  onOpen: () => void;
  onClose: () => void;
  onOpenSchedule: (claimId: string, date?: string) => void;
}

const HOME_BASE = {
  lat: 31.5493,
  lng: -97.1467,
};

const DEFAULT_CENTER: [number, number] = [HOME_BASE.lng, HOME_BASE.lat];
const DEFAULT_ZOOM = 9.8;
const ROUTE_SOURCE_ID = 'calendar-route-source';
const ROUTE_LAYER_ID = 'calendar-route-layer';

function getAppointmentColor(status: Appointment['status']) {
  if (status === 'pending') return '#E07B3F';
  if (status === 'confirmed') return '#5BC273';
  if (status === 'needs_attention') return '#E05C5C';
  if (status === 'completed') return '#4298CC';
  return '#5BC273';
}

function formatTime(value: string) {
  return format(parseISO(`2026-01-01T${value}`), 'h:mm a');
}

function createHomePinElement() {
  const element = document.createElement('div');
  element.style.width = '28px';
  element.style.height = '28px';
  element.style.borderRadius = '999px';
  element.style.background = '#4298CC';
  element.style.border = '2px solid rgba(255,255,255,0.32)';
  element.style.display = 'grid';
  element.style.placeItems = 'center';
  element.style.boxShadow = '0 10px 18px rgba(0,0,0,0.28)';
  element.innerHTML = '<span style="font-size:12px; line-height:1; color:#06121A;">⌂</span>';
  return element;
}

function createStopPinElement(color: string, label: string) {
  const element = document.createElement('div');
  element.style.width = '28px';
  element.style.height = '28px';
  element.style.borderRadius = '50% 50% 50% 0';
  element.style.transform = 'rotate(-45deg)';
  element.style.background = color;
  element.style.border = '2px solid rgba(255,255,255,0.34)';
  element.style.boxShadow = '0 10px 18px rgba(0,0,0,0.28)';
  element.style.display = 'grid';
  element.style.placeItems = 'center';

  const text = document.createElement('span');
  text.textContent = label;
  text.style.transform = 'rotate(45deg)';
  text.style.fontFamily = 'Barlow Condensed, sans-serif';
  text.style.fontWeight = '800';
  text.style.fontSize = label.length > 1 ? '10px' : '11px';
  text.style.color = color === '#5BC273' || color === '#C9A84C' ? '#06120C' : 'var(--white)';
  text.style.lineHeight = '1';
  element.appendChild(text);

  return element;
}

function buildAppointmentPopup(appointment: Appointment, stopNumber: number) {
  return `
    <div style="min-width:180px">
      <div style="font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:var(--faint)">
        Stop ${stopNumber}
      </div>
      <div style="margin-top:4px;font-size:14px;font-weight:600;color:var(--white)">${appointment.insuredName}</div>
      <div style="margin-top:2px;font-size:12px;color:var(--muted)">${appointment.lossAddress || 'Address unavailable'}</div>
      <div style="margin-top:8px;font-size:12px;color:var(--dim)">${formatTime(appointment.arrivalTime)} · ${appointment.lossType}</div>
    </div>
  `;
}

function createBronzePopupContent(
  claim: SchedulingQueueItem,
  selectedDay: string | null,
  onOpenSchedule: (claimId: string, date?: string) => void,
) {
  const container = document.createElement('div');
  container.style.minWidth = '190px';

  const title = document.createElement('div');
  title.textContent = claim.insuredName;
  title.style.fontSize = '14px';
  title.style.fontWeight = '600';
  title.style.color = 'var(--white)';
  container.appendChild(title);

  const address = document.createElement('div');
  address.textContent = claim.lossAddress || 'Address unavailable';
  address.style.marginTop = '3px';
  address.style.fontSize = '12px';
  address.style.color = 'var(--muted)';
  container.appendChild(address);

  const meta = document.createElement('div');
  meta.textContent = claim.lossType;
  meta.style.marginTop = '8px';
  meta.style.fontSize = '12px';
  meta.style.color = 'var(--dim)';
  container.appendChild(meta);

  const action = document.createElement('button');
  action.type = 'button';
  action.textContent = 'Schedule →';
  action.style.marginTop = '10px';
  action.style.padding = '0';
  action.style.border = 'none';
  action.style.background = 'transparent';
  action.style.color = 'var(--sage)';
  action.style.fontFamily = 'Barlow Condensed, sans-serif';
  action.style.fontWeight = '800';
  action.style.fontSize = '12px';
  action.style.letterSpacing = '0.08em';
  action.style.textTransform = 'uppercase';
  action.style.cursor = 'pointer';
  action.addEventListener('click', () => {
    onOpenSchedule(claim.id, selectedDay ?? undefined);
  });
  container.appendChild(action);

  return container;
}

function getRouteGeoJson(appointments: Appointment[]): FeatureCollection<LineString> {
  const coordinates: [number, number][] = [[HOME_BASE.lng, HOME_BASE.lat]];

  for (const appointment of appointments) {
    if (typeof appointment.lossLng === 'number' && typeof appointment.lossLat === 'number') {
      coordinates.push([appointment.lossLng, appointment.lossLat]);
    }
  }

  const features: Array<Feature<LineString>> =
    coordinates.length > 1
      ? [
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates,
            },
          },
        ]
      : [];

  return {
    type: 'FeatureCollection',
    features,
  };
}

function ensureBuildingLayer(map: mapboxgl.Map, visible: boolean) {
  if (map.getLayer('3d-buildings')) {
    map.setLayoutProperty('3d-buildings', 'visibility', visible ? 'visible' : 'none');
    return;
  }
  if (!map.getSource('composite')) return;
  map.addLayer({
    id: '3d-buildings',
    source: 'composite',
    'source-layer': 'building',
    filter: ['==', 'extrude', 'true'],
    type: 'fill-extrusion',
    minzoom: 14,
    paint: {
      'fill-extrusion-color': '#162130',
      'fill-extrusion-height': ['get', 'height'],
      'fill-extrusion-base': ['get', 'min_height'],
      'fill-extrusion-opacity': 0.8,
    },
  } as Parameters<mapboxgl.Map['addLayer']>[0]);
  if (!visible) {
    map.setLayoutProperty('3d-buildings', 'visibility', 'none');
  }
}

export function RouteMap({
  open,
  selectedDay,
  appointments,
  unscheduledClaims,
  onOpen,
  onClose,
  onOpenSchedule,
}: RouteMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const markerRefs = useRef<mapboxgl.Marker[]>([]);
  const is3DRef = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const { theme } = useTheme();
  const resolvedTheme = theme === 'system'
    ? (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    : theme;

  const sortedAppointments = useMemo(
    () =>
      [...appointments]
        .filter((appointment) => appointment.status !== 'cancelled')
        .sort((a, b) => a.arrivalTime.localeCompare(b.arrivalTime)),
    [appointments],
  );

  const visibleAppointments = useMemo(
    () => sortedAppointments.filter((appointment) => showCompleted || appointment.status !== 'completed'),
    [showCompleted, sortedAppointments],
  );

  const routeStops = useMemo(
    () =>
      visibleAppointments.filter(
        (appointment) => typeof appointment.lossLng === 'number' && typeof appointment.lossLat === 'number',
      ),
    [visibleAppointments],
  );

  const bronzeClaims = useMemo(
    () =>
      selectedDay
        ? unscheduledClaims.filter(
            (claim) => typeof claim.lossLng === 'number' && typeof claim.lossLat === 'number',
          )
        : [],
    [selectedDay, unscheduledClaims],
  );

  const firstAppointmentTime = visibleAppointments.length ? formatTime(visibleAppointments[0].arrivalTime) : '—';
  const hasToken = Boolean(process.env.NEXT_PUBLIC_MAPBOX_TOKEN);

  useEffect(() => {
    if (!open || !containerRef.current || mapRef.current || !hasToken) {
      return;
    }

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: resolvedTheme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    const handleZoom = () => {
      const zoom = map.getZoom();
      if (zoom >= 15) {
        map.easeTo({ pitch: 45 });
      } else if (zoom < 14) {
        map.easeTo({ pitch: 0 });
      }
    };

    map.on('zoomend', handleZoom);

    map.on('load', () => {
      map.addSource(ROUTE_SOURCE_ID, {
        type: 'geojson',
        data: getRouteGeoJson([]),
      });

      map.addLayer({
        id: ROUTE_LAYER_ID,
        type: 'line',
        source: ROUTE_SOURCE_ID,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': '#5BC273',
          'line-width': 2,
          'line-dasharray': [2, 2],
          'line-opacity': 0.8,
        },
      });

      ensureBuildingLayer(map, false);
      map.on('style.load', () => {
        ensureBuildingLayer(map, is3DRef.current);
      });

      setMapReady(true);
    });

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: true,
      className: 'route-map-popup',
      offset: 16,
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      popupRef.current = null;
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      map.off('zoomend', handleZoom);
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [hasToken, open]);

  useEffect(() => {
    is3DRef.current = is3D;
    if (!mapRef.current || !mapReady) return;
    if (is3D) {
      mapRef.current.easeTo({ pitch: 45, bearing: 0 });
      ensureBuildingLayer(mapRef.current, true);
    } else {
      mapRef.current.easeTo({ pitch: 0 });
      ensureBuildingLayer(mapRef.current, false);
    }
  }, [is3D, mapReady]);

  useEffect(() => {
    if (!mapRef.current) return;
    const style = resolvedTheme === 'light' ? 'mapbox://styles/mapbox/light-v11' : 'mapbox://styles/mapbox/dark-v11';
    mapRef.current.setStyle(style);
  }, [resolvedTheme]);

  useEffect(() => {
    if (!open || !mapRef.current || !mapReady) {
      return;
    }

    const source = mapRef.current.getSource(ROUTE_SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    source?.setData(getRouteGeoJson(routeStops));
  }, [mapReady, open, routeStops]);

  useEffect(() => {
    if (!open || !mapRef.current || !mapReady) {
      return;
    }

    const map = mapRef.current;
    const popup = popupRef.current;
    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    bounds.extend([HOME_BASE.lng, HOME_BASE.lat]);

    const homeMarker = new mapboxgl.Marker({ element: createHomePinElement(), anchor: 'center' })
      .setLngLat([HOME_BASE.lng, HOME_BASE.lat])
      .addTo(map);
    markerRefs.current.push(homeMarker);

    if (selectedDay) {
      routeStops.forEach((appointment, index) => {
        const element = createStopPinElement(getAppointmentColor(appointment.status), String(index + 1));
        const marker = new mapboxgl.Marker({ element, anchor: 'bottom' })
          .setLngLat([appointment.lossLng as number, appointment.lossLat as number])
          .addTo(map);

        element.addEventListener('click', () => {
          popup
            ?.setLngLat([appointment.lossLng as number, appointment.lossLat as number])
            .setHTML(buildAppointmentPopup(appointment, index + 1))
            .addTo(map);
        });

        markerRefs.current.push(marker);
        bounds.extend([appointment.lossLng as number, appointment.lossLat as number]);
      });

      bronzeClaims.forEach((claim) => {
        const element = createStopPinElement('#C9A84C', '•');
        const marker = new mapboxgl.Marker({ element, anchor: 'bottom' })
          .setLngLat([claim.lossLng as number, claim.lossLat as number])
          .addTo(map);

        element.addEventListener('click', () => {
          const content = createBronzePopupContent(claim, selectedDay, onOpenSchedule);
          popup?.setDOMContent(content).setLngLat([claim.lossLng as number, claim.lossLat as number]).addTo(map);
        });

        markerRefs.current.push(marker);
        bounds.extend([claim.lossLng as number, claim.lossLat as number]);
      });
    }

    map.fitBounds(bounds, {
      padding: { top: 70, right: 48, bottom: 100, left: 48 },
      maxZoom: selectedDay ? 11.5 : DEFAULT_ZOOM,
    });
  }, [bronzeClaims, mapReady, onOpenSchedule, open, routeStops, selectedDay]);

  return (
    <aside
      className={`relative flex min-h-0 flex-col bg-[var(--surface)] transition-all duration-200 ${
        open ? 'w-[320px] min-w-[320px] border-l border-[var(--border)] opacity-100' : 'w-0 min-w-0 opacity-100'
      }`}
      style={{ overflow: open ? 'hidden' : 'visible' }}
    >
      {!open ? (
        <button
          type="button"
          onClick={onOpen}
          className="absolute left-[-34px] top-1/2 z-20 flex h-16 w-[34px] -translate-y-1/2 items-center justify-center rounded-l-[10px] border border-r-0 border-[var(--border)] bg-[var(--surface)] font-['Barlow_Condensed'] text-[10px] font-extrabold uppercase tracking-[0.1em] text-[var(--muted)] shadow-[0_10px_24px_rgba(0,0,0,0.28)]"
        >
          Map
        </button>
      ) : null}

      {open ? (
        <>
          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div>
              <div className="font-['Barlow_Condensed'] text-[12px] font-extrabold uppercase tracking-[0.1em] text-[var(--white)]">
                Route Map
              </div>
              <div className="mt-1 text-[11px] text-[var(--muted)]">
                {selectedDay ? format(parseISO(selectedDay), 'EEEE, MMM d') : 'Select a day to see your route.'}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-6 w-6 items-center justify-center rounded-[4px] border border-[var(--border)] bg-[var(--card)] text-[var(--muted)]"
            >
              ✕
            </button>
          </div>

          <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
            <div className="font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
              Completed Stops
            </div>
            <button
              type="button"
              onClick={() => setShowCompleted((value) => !value)}
              className={`rounded-[999px] border px-3 py-1 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] ${
                showCompleted
                  ? 'border-[var(--blue)] bg-[var(--blue-dim)] text-[var(--blue)]'
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)]'
              }`}
            >
              {showCompleted ? 'Shown' : 'Hidden'}
            </button>
          </div>

          <div className="flex items-center gap-2 border-b border-[var(--border)] px-4 py-2">
            <button
              type="button"
              onClick={() => setIs3D((value) => !value)}
              className={`rounded border px-3 py-1 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] ${
                is3D
                  ? 'border-[var(--sage)] bg-[var(--sage-dim)] text-[var(--sage)]'
                  : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)]'
              }`}
            >
              ⬡ 3D
            </button>
            <button
              type="button"
              onClick={() => {
                if (!mapRef.current) return;
                mapRef.current.easeTo({ bearing: (mapRef.current.getBearing() + 90) % 360 });
              }}
              className="rounded border border-[var(--border)] bg-[var(--card)] px-3 py-1 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]"
            >
              ↻ Rotate 90°
            </button>
          </div>

          <div className="relative m-4 min-h-0 flex-1 overflow-hidden rounded-[12px] border border-[var(--border)] bg-[var(--card)]">
            {hasToken ? <div ref={containerRef} className="h-full w-full" /> : null}
            <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--bg)_30%,transparent),transparent)]" />
            {!selectedDay ? (
              <div className="pointer-events-none absolute inset-x-6 top-6 rounded-[10px] border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm px-4 py-3 text-[12px] text-[var(--muted)] backdrop-blur">
                Select a day to see your route.
              </div>
            ) : null}
            {selectedDay && !visibleAppointments.length ? (
              <div className="pointer-events-none absolute inset-x-6 top-6 rounded-[10px] border border-[var(--border)] bg-[var(--card)] backdrop-blur-sm px-4 py-3 text-[12px] text-[var(--muted)] backdrop-blur">
                No scheduled stops for this day.
              </div>
            ) : null}
            {!hasToken ? (
              <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                <div>
                  <div className="font-['Barlow_Condensed'] text-[12px] font-extrabold uppercase tracking-[0.1em] text-[var(--white)]">
                    Mapbox Token Missing
                  </div>
                  <p className="mt-2 text-[12px] text-[var(--muted)]">
                    Set `NEXT_PUBLIC_MAPBOX_TOKEN` to enable the route map.
                  </p>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mx-4 mb-4 rounded-[10px] border border-[var(--border)] bg-[var(--card)] px-4 py-3">
            <div className="mb-2 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
              Route Info
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-[var(--muted)]">Total Stops</span>
              <strong className="text-[var(--white)]">{visibleAppointments.length}</strong>
            </div>
            <div className="mt-1 flex items-center justify-between text-[12px]">
              <span className="text-[var(--muted)]">First Appointment</span>
              <strong className="text-[var(--white)]">{firstAppointmentTime}</strong>
            </div>
          </div>
        </>
      ) : null}
    </aside>
  );
}
