'use client';

import { useEffect, useRef, useState } from 'react';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import mapboxgl from 'mapbox-gl';
import type { Feature, Polygon } from 'geojson';
import type { LassoFilterState } from '@/components/dispatch/LassoFilters';
import type { DispatchAdjuster, DispatchClaim } from '@/lib/types';

interface DispatchMapProps {
  claims: DispatchClaim[];
  activityClaims: DispatchClaim[];
  adjusters: DispatchAdjuster[];
  selectedClaimIds: string[];
  lassoActive: boolean;
  lassoFilters: LassoFilterState;
  lassoStartToken: number;
  onOpenLassoFilters: () => void;
  onSelectClaim: (claimId: string) => void;
  onSelectionChange: (claimIds: string[]) => void;
  onClearSelection: () => void;
  onFinishLasso: () => void;
  onOpenAssignModal: () => void;
}

const DEFAULT_CENTER: [number, number] = [-97.1467, 31.5493];
const DEFAULT_ZOOM = 9.2;
const DRAW_MODE_FREEHAND = 'draw_freehand_polygon';
const FREEHAND_DISTANCE_THRESHOLD = 0.0012;

function pointInPolygon(point: [number, number], polygon: number[][]) {
  let inside = false;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i][0];
    const yi = polygon[i][1];
    const xj = polygon[j][0];
    const yj = polygon[j][1];

    const intersects =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / ((yj - yi) || Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
}

function getEligibleLassoClaims(claims: DispatchClaim[], polygon: number[][], filters: LassoFilterState) {
  return claims.filter(
    (claim) =>
      (claim.status === 'received' || claim.status === 'needs_attention') &&
      typeof claim.lossLng === 'number' &&
      typeof claim.lossLat === 'number' &&
      pointInPolygon([claim.lossLng, claim.lossLat], polygon) &&
      claimMatchesLassoFilters(claim, filters),
  );
}

function getCoordinateDistance(a: [number, number], b: [number, number]) {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

type FreehandModeState = {
  polygon: {
    id: string;
    coordinates: [number, number][][];
    updateCoordinate: (path: string, lng: number, lat: number) => void;
    removeCoordinate: (path: string) => void;
    isValid: () => boolean;
    toGeoJSON: () => Feature<Polygon>;
  };
  currentVertexPosition: number;
  drawing: boolean;
  lastCoordinate: [number, number] | null;
  claims: DispatchClaim[];
  filters: LassoFilterState;
  maxClaims: number;
  onPreviewChange?: (count: number) => void;
};

type DrawContext = {
  newFeature: (feature: Feature<Polygon>) => FreehandModeState['polygon'];
  addFeature: (feature: FreehandModeState['polygon']) => void;
  clearSelectedFeatures: () => void;
  updateUIClasses: (classes: { mouse?: string }) => void;
  activateUIButton: (button?: string) => void;
  setActionableState: (state: { trash: boolean }) => void;
  deleteFeature: (ids: string[], options?: { silent?: boolean }) => void;
  changeMode: (mode: string, options?: Record<string, unknown>, eventOptions?: { silent?: boolean }) => void;
  getFeature: (id: string) => FreehandModeState['polygon'] | undefined;
  fire: (name: string, data: { features: Array<Feature<Polygon>> }) => void;
};

function createFreehandDrawMode() {
  return {
    onSetup(this: DrawContext, options?: Partial<FreehandModeState>) {
      const polygon = this.newFeature({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [[]],
        },
      });

      this.addFeature(polygon);
      this.clearSelectedFeatures();
      this.updateUIClasses({ mouse: 'add' });
      this.activateUIButton('polygon');
      this.setActionableState({ trash: true });

      options?.onPreviewChange?.(0);

      return {
        polygon,
        currentVertexPosition: 0,
        drawing: false,
        lastCoordinate: null,
        claims: options?.claims ?? [],
        filters: options?.filters ?? {
          lossTypes: [],
          claimCategories: [],
          requiredCertifications: [],
          carriers: [],
          maxClaims: 15,
        },
        maxClaims: options?.maxClaims ?? 15,
        onPreviewChange: options?.onPreviewChange,
      } satisfies FreehandModeState;
    },

    onMouseDown(this: DrawContext, state: FreehandModeState, event: mapboxgl.MapMouseEvent) {
      state.drawing = true;
      state.lastCoordinate = [event.lngLat.lng, event.lngLat.lat];
      state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, event.lngLat.lng, event.lngLat.lat);
      state.currentVertexPosition += 1;
      state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, event.lngLat.lng, event.lngLat.lat);
    },

    onDrag(this: DrawContext, state: FreehandModeState, event: mapboxgl.MapMouseEvent) {
      if (!state.drawing) {
        return;
      }

      const nextCoordinate: [number, number] = [event.lngLat.lng, event.lngLat.lat];
      const shouldCommit =
        !state.lastCoordinate || getCoordinateDistance(state.lastCoordinate, nextCoordinate) >= FREEHAND_DISTANCE_THRESHOLD;

      if (!shouldCommit) {
        state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, nextCoordinate[0], nextCoordinate[1]);
      } else {
        state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, nextCoordinate[0], nextCoordinate[1]);
        state.currentVertexPosition += 1;
        state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, nextCoordinate[0], nextCoordinate[1]);
        state.lastCoordinate = nextCoordinate;
      }

      const selectedCount = getEligibleLassoClaims(
        state.claims,
        state.polygon.coordinates[0] as number[][],
        state.filters,
      ).slice(0, state.maxClaims).length;
      state.onPreviewChange?.(selectedCount);
    },

    onMouseUp(this: DrawContext, state: FreehandModeState) {
      if (!state.drawing) {
        return;
      }

      state.drawing = false;
      this.changeMode('simple_select', { featureIds: [state.polygon.id] });
    },

    onMouseMove(this: DrawContext, state: FreehandModeState, event: mapboxgl.MapMouseEvent) {
      if (!state.drawing) {
        return;
      }

      state.polygon.updateCoordinate(`0.${state.currentVertexPosition}`, event.lngLat.lng, event.lngLat.lat);
    },

    onKeyUp(this: DrawContext, state: FreehandModeState, event: KeyboardEvent) {
      if (event.key === 'Escape') {
        state.onPreviewChange?.(0);
        this.deleteFeature([state.polygon.id], { silent: true });
        this.changeMode('simple_select', {}, { silent: true });
      }
    },

    onStop(this: DrawContext, state: FreehandModeState) {
      this.updateUIClasses({ mouse: 'none' });
      this.activateUIButton();

      if (this.getFeature(state.polygon.id) === undefined) {
        state.onPreviewChange?.(0);
        return;
      }

      state.polygon.removeCoordinate(`0.${state.currentVertexPosition}`);
      if (state.polygon.isValid()) {
        this.fire('draw.create', {
          features: [state.polygon.toGeoJSON()],
        });
      } else {
        state.onPreviewChange?.(0);
        this.deleteFeature([state.polygon.id], { silent: true });
        this.changeMode('simple_select', {}, { silent: true });
      }
    },

    onTrash(this: DrawContext, state: FreehandModeState) {
      state.onPreviewChange?.(0);
      this.deleteFeature([state.polygon.id], { silent: true });
      this.changeMode('simple_select');
    },

    toDisplayFeatures(
      _this: DrawContext,
      state: FreehandModeState,
      geojson: Feature<Polygon>,
      display: (feature: Feature<Polygon>) => void,
    ) {
      const isActivePolygon = geojson.properties?.id === state.polygon.id;
      geojson.properties = {
        ...(geojson.properties ?? {}),
        active: isActivePolygon ? 'true' : 'false',
      };

      if (!isActivePolygon) {
        display(geojson);
        return;
      }

      if (geojson.geometry.coordinates[0]?.length < 3) {
        return;
      }

      geojson.properties.meta = 'feature';
      display(geojson);
    },
  };
}

function claimMatchesLassoFilters(claim: DispatchClaim, filters: LassoFilterState) {
  const activeCarriers = filters.carriers;
  const activeCertifications = filters.requiredCertifications;

  if (filters.lossTypes.length && !filters.lossTypes.some((value) => claim.lossType.includes(value))) {
    return false;
  }

  if (filters.claimCategories.length && !filters.claimCategories.includes(claim.claimCategory)) {
    return false;
  }

  if (activeCarriers.length && !activeCarriers.includes(claim.carrier)) {
    return false;
  }

  if (activeCertifications.length && !activeCertifications.includes('Any')) {
    const certLabels = activeCertifications.map((value) => (value === 'TWIA Only' ? 'TWIA Cert' : value));
    if (!certLabels.every((value) => claim.requiredCerts.includes(value))) {
      return false;
    }
  }

  if (activeCertifications.includes('TWIA Only') && !claim.requiresTwia) {
    return false;
  }

  return true;
}

function getClaimPinBackground(claim: DispatchClaim) {
  if (claim.status === 'assigned') return 'var(--bronze)';
  if (claim.status === 'needs_attention') return 'var(--red)';
  if (claim.slaDeadlineHours === null) return 'var(--sage)';
  if (claim.slaDeadlineHours < 0) return 'var(--red)';
  if (claim.slaDeadlineHours <= 24) return 'var(--orange)';
  return 'var(--sage)';
}

function getClaimSlaLabel(claim: DispatchClaim) {
  if (claim.status === 'assigned') return 'Assigned';
  if (claim.status === 'needs_attention') return 'Needs attention';
  if (claim.slaDeadlineHours === null) return 'No SLA issue';
  if (claim.slaDeadlineHours < 0) return 'SLA overdue';
  if (claim.slaDeadlineHours <= 24) return 'SLA at risk';
  return 'No SLA issue';
}

function getActivityPinStyle(claim: DispatchClaim) {
  if (claim.appointmentStatus === 'pending') {
    return {
      background: 'var(--orange)',
      opacity: '0.95',
      label: 'Appointment Pending',
    };
  }

  if (claim.appointmentStatus === 'confirmed') {
    return {
      background: 'rgba(91, 194, 115, 0.4)',
      opacity: '0.85',
      label: 'Appointment Confirmed',
    };
  }

  return {
    background: 'var(--bronze)',
    opacity: '0.95',
    label: 'Assigned - No Appointment',
  };
}

function getAdjusterBorderColor(adjuster: DispatchAdjuster) {
  if (adjuster.availability === 'available') return 'var(--sage)';
  if (adjuster.availability === 'busy') return 'var(--orange)';
  return 'var(--faint)';
}

function buildClaimTooltipHtml(claim: DispatchClaim) {
  return `
    <div style="min-width:220px;color:var(--white);font-family:Barlow,sans-serif">
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:13px;letter-spacing:0.04em;margin-bottom:6px;">${claim.insuredName}</div>
      <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:3px;font-size:12px;">
        <span style="color:var(--muted)">Address</span>
        <span style="font-weight:500;text-align:right;">${claim.lossAddress || 'Address unavailable'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:3px;font-size:12px;">
        <span style="color:var(--muted)">Carrier</span>
        <span style="font-weight:500;text-align:right;">${claim.carrier}</span>
      </div>
      <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:3px;font-size:12px;">
        <span style="color:var(--muted)">Loss Type</span>
        <span style="font-weight:500;text-align:right;">${claim.lossType}</span>
      </div>
      <div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;">
        <span style="color:var(--muted)">SLA</span>
        <span style="font-weight:500;text-align:right;">${getClaimSlaLabel(claim)}</span>
      </div>
    </div>
  `;
}

function buildAdjusterTooltipHtml(adjuster: DispatchAdjuster) {
  return `
    <div style="min-width:220px;color:var(--white);font-family:Barlow,sans-serif">
      <div style="font-family:'Barlow Condensed',sans-serif;font-weight:800;font-size:13px;letter-spacing:0.04em;margin-bottom:6px;">${adjuster.name}</div>
      <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:3px;font-size:12px;">
        <span style="color:var(--muted)">Location</span>
        <span style="font-weight:500;text-align:right;">${adjuster.location}</span>
      </div>
      <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:3px;font-size:12px;">
        <span style="color:var(--muted)">Capacity</span>
        <span style="font-weight:500;text-align:right;">${adjuster.activeClaims}/${adjuster.maxClaims}</span>
      </div>
      <div style="display:flex;justify-content:space-between;gap:12px;margin-bottom:3px;font-size:12px;">
        <span style="color:var(--muted)">Certs</span>
        <span style="font-weight:500;text-align:right;">${adjuster.certifications.join(', ') || 'None listed'}</span>
      </div>
      <div style="display:flex;justify-content:space-between;gap:12px;font-size:12px;">
        <span style="color:var(--muted)">Carriers</span>
        <span style="font-weight:500;text-align:right;">${adjuster.approvedCarriers.join(', ') || 'Not configured'}</span>
      </div>
    </div>
  `;
}

function createClaimPinElement(claim: DispatchClaim, selected: boolean) {
  const wrapper = document.createElement('button');
  wrapper.type = 'button';
  wrapper.style.position = 'relative';
  wrapper.style.display = 'block';
  wrapper.style.padding = '0';
  wrapper.style.border = '0';
  wrapper.style.background = 'transparent';
  wrapper.style.cursor = 'pointer';
  wrapper.style.transform = selected ? 'scale(1.15)' : 'scale(1)';
  wrapper.style.transition = 'transform 0.15s ease';

  const pin = document.createElement('div');
  pin.style.width = '26px';
  pin.style.height = '26px';
  pin.style.borderRadius = '50% 50% 50% 0';
  pin.style.transform = 'rotate(-45deg)';
  pin.style.display = 'flex';
  pin.style.alignItems = 'center';
  pin.style.justifyContent = 'center';
  pin.style.border = selected ? '2px solid var(--sage)' : '2px solid rgba(255,255,255,0.2)';
  pin.style.background = getClaimPinBackground(claim);
  pin.style.boxShadow = selected ? '0 0 0 4px rgba(91,194,115,0.22)' : 'none';

  const inner = document.createElement('span');
  inner.textContent = 'C';
  inner.style.transform = 'rotate(45deg)';
  inner.style.fontFamily = "'Barlow Condensed', sans-serif";
  inner.style.fontWeight = '800';
  inner.style.fontSize = '9px';
  inner.style.color = '#0A0A0A';
  pin.appendChild(inner);
  wrapper.appendChild(pin);

  if (selected) {
    const label = document.createElement('div');
    label.textContent = claim.claimNumber;
    label.style.position = 'absolute';
    label.style.left = '50%';
    label.style.top = '-30px';
    label.style.transform = 'translateX(-50%)';
    label.style.whiteSpace = 'nowrap';
    label.style.padding = '2px 7px';
    label.style.borderRadius = '4px';
    label.style.border = '1px solid var(--border-hi)';
    label.style.background = 'var(--card-hi)';
    label.style.fontFamily = "'Barlow Condensed', sans-serif";
    label.style.fontWeight = '700';
    label.style.fontSize = '10px';
    label.style.color = 'var(--white)';
    wrapper.appendChild(label);
  }

  return wrapper;
}

function createActivityPinElement(claim: DispatchClaim) {
  const style = getActivityPinStyle(claim);
  const wrapper = document.createElement('div');
  wrapper.style.pointerEvents = 'none';
  wrapper.style.opacity = style.opacity;

  const pin = document.createElement('div');
  pin.style.width = '24px';
  pin.style.height = '24px';
  pin.style.borderRadius = '50% 50% 50% 0';
  pin.style.transform = 'rotate(-45deg)';
  pin.style.display = 'flex';
  pin.style.alignItems = 'center';
  pin.style.justifyContent = 'center';
  pin.style.border = '2px solid rgba(255,255,255,0.18)';
  pin.style.background = style.background;
  pin.style.filter = 'saturate(0.92)';

  const inner = document.createElement('span');
  inner.textContent = '•';
  inner.style.transform = 'rotate(45deg)';
  inner.style.fontFamily = "'Barlow Condensed', sans-serif";
  inner.style.fontWeight = '900';
  inner.style.fontSize = '12px';
  inner.style.color = '#0A0A0A';
  pin.appendChild(inner);
  wrapper.appendChild(pin);

  return wrapper;
}

function createAdjusterPinElement(adjuster: DispatchAdjuster) {
  const wrapper = document.createElement('button');
  wrapper.type = 'button';
  wrapper.style.position = 'relative';
  wrapper.style.display = 'block';
  wrapper.style.padding = '0';
  wrapper.style.border = '0';
  wrapper.style.background = 'transparent';
  wrapper.style.cursor = 'pointer';

  const pin = document.createElement('div');
  pin.style.width = '34px';
  pin.style.height = '34px';
  pin.style.borderRadius = '999px';
  pin.style.display = 'flex';
  pin.style.alignItems = 'center';
  pin.style.justifyContent = 'center';
  pin.style.border = `2px solid ${getAdjusterBorderColor(adjuster)}`;
  pin.style.background = 'rgba(12, 19, 28, 0.92)';
  pin.style.color = getAdjusterBorderColor(adjuster);
  pin.style.fontFamily = "'Barlow Condensed', sans-serif";
  pin.style.fontWeight = '800';
  pin.style.fontSize = '11px';
  pin.textContent = adjuster.initials;

  const label = document.createElement('div');
  label.textContent = adjuster.name;
  label.style.position = 'absolute';
  label.style.left = '50%';
  label.style.top = '38px';
  label.style.transform = 'translateX(-50%)';
  label.style.whiteSpace = 'nowrap';
  label.style.padding = '2px 8px';
  label.style.borderRadius = '4px';
  label.style.border = '1px solid var(--border-hi)';
  label.style.background = 'var(--card-hi)';
  label.style.fontFamily = "'Barlow Condensed', sans-serif";
  label.style.fontWeight = '700';
  label.style.fontSize = '10px';
  label.style.color = 'var(--white)';

  wrapper.appendChild(pin);
  wrapper.appendChild(label);
  return wrapper;
}

export function DispatchMap({
  claims,
  activityClaims,
  adjusters,
  selectedClaimIds,
  lassoActive,
  lassoFilters,
  lassoStartToken,
  onOpenLassoFilters,
  onSelectClaim,
  onSelectionChange,
  onClearSelection,
  onFinishLasso,
  onOpenAssignModal,
}: DispatchMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const drawRef = useRef<MapboxDraw | null>(null);
  const markerRefs = useRef<mapboxgl.Marker[]>([]);
  const hoverPopupRef = useRef<mapboxgl.Popup | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [showClaims, setShowClaims] = useState(true);
  const [showAdjusters, setShowAdjusters] = useState(true);
  const [showAdjusterActivity, setShowAdjusterActivity] = useState(false);
  const [lassoPreviewCount, setLassoPreviewCount] = useState(0);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? '';
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    const draw = new MapboxDraw({
      displayControlsDefault: false,
      controls: {},
      defaultMode: 'simple_select',
      modes: {
        ...MapboxDraw.modes,
        [DRAW_MODE_FREEHAND]: createFreehandDrawMode() as never,
      },
    });
    drawRef.current = draw;
    map.addControl(draw);

    const handleDrawCreate = (event: { features: Array<Feature> }) => {
      const feature = event.features[0] as Feature<Polygon> | undefined;
      const polygon = feature?.geometry.coordinates[0];
      if (!polygon) {
        onSelectionChange([]);
        onFinishLasso();
        return;
      }

      const selected = getEligibleLassoClaims(claims, polygon as number[][], lassoFilters)
        .slice(0, lassoFilters.maxClaims)
        .map((claim) => claim.id);

      onSelectionChange(selected);
      setLassoPreviewCount(selected.length);
      draw.deleteAll();
      draw.changeMode('simple_select');
      onFinishLasso();
    };

    const handleDrawDelete = () => {
      setLassoPreviewCount(0);
      onFinishLasso();
    };

    map.on('draw.create', handleDrawCreate);
    map.on('draw.delete', handleDrawDelete);

    map.on('load', () => {
      setMapReady(true);
    });

    mapRef.current = map;
    hoverPopupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: 'dispatch-popup',
      offset: 16,
    });

    return () => {
      hoverPopupRef.current?.remove();
      hoverPopupRef.current = null;
      markerRefs.current.forEach((marker) => marker.remove());
      markerRefs.current = [];
      map.off('draw.create', handleDrawCreate);
      map.off('draw.delete', handleDrawDelete);
      map.removeControl(draw);
      drawRef.current = null;
      map.remove();
      mapRef.current = null;
      setMapReady(false);
    };
  }, [claims, lassoFilters, lassoFilters.maxClaims, onFinishLasso, onSelectionChange]);

  useEffect(() => {
    if (!mapRef.current || !drawRef.current || !mapReady) {
      return;
    }

    if (!lassoStartToken) {
      return;
    }

    setLassoPreviewCount(0);
    drawRef.current.deleteAll();
    drawRef.current.changeMode(DRAW_MODE_FREEHAND, {
      claims,
      filters: lassoFilters,
      maxClaims: lassoFilters.maxClaims,
      onPreviewChange: setLassoPreviewCount,
    });
  }, [claims, lassoFilters, lassoStartToken, mapReady]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      return;
    }

    const map = mapRef.current;
    markerRefs.current.forEach((marker) => marker.remove());
    markerRefs.current = [];

    const bounds = new mapboxgl.LngLatBounds();
    let hasBounds = false;

    if (showClaims) {
      for (const claim of claims) {
        if (typeof claim.lossLng !== 'number' || typeof claim.lossLat !== 'number') {
          continue;
        }

        const element = createClaimPinElement(claim, selectedClaimIds.includes(claim.id));
        const marker = new mapboxgl.Marker({ element, anchor: 'bottom' })
          .setLngLat([claim.lossLng, claim.lossLat])
          .addTo(map);

        element.addEventListener('mouseenter', () => {
          hoverPopupRef.current
            ?.setLngLat([claim.lossLng as number, claim.lossLat as number])
            .setHTML(buildClaimTooltipHtml(claim))
            .addTo(map);
        });
        element.addEventListener('mouseleave', () => {
          hoverPopupRef.current?.remove();
        });
        element.addEventListener('click', () => {
          if (claim.status === 'assigned') {
            return;
          }
          onSelectClaim(claim.id);
        });

        markerRefs.current.push(marker);
        bounds.extend([claim.lossLng, claim.lossLat]);
        hasBounds = true;
      }
    }

    if (showAdjusterActivity) {
      for (const claim of activityClaims) {
        if (typeof claim.lossLng !== 'number' || typeof claim.lossLat !== 'number') {
          continue;
        }

        const element = createActivityPinElement(claim);
        const marker = new mapboxgl.Marker({ element, anchor: 'bottom' })
          .setLngLat([claim.lossLng, claim.lossLat])
          .addTo(map);

        markerRefs.current.push(marker);
        bounds.extend([claim.lossLng, claim.lossLat]);
        hasBounds = true;
      }
    }

    if (showAdjusters) {
      for (const adjuster of adjusters) {
        if (typeof adjuster.homeLng !== 'number' || typeof adjuster.homeLat !== 'number') {
          continue;
        }

        const element = createAdjusterPinElement(adjuster);
        const marker = new mapboxgl.Marker({ element, anchor: 'center' })
          .setLngLat([adjuster.homeLng, adjuster.homeLat])
          .addTo(map);

        element.addEventListener('mouseenter', () => {
          hoverPopupRef.current
            ?.setLngLat([adjuster.homeLng as number, adjuster.homeLat as number])
            .setHTML(buildAdjusterTooltipHtml(adjuster))
            .addTo(map);
        });
        element.addEventListener('mouseleave', () => {
          hoverPopupRef.current?.remove();
        });
        element.addEventListener('click', () => {
          hoverPopupRef.current
            ?.setLngLat([adjuster.homeLng as number, adjuster.homeLat as number])
            .setHTML(buildAdjusterTooltipHtml(adjuster))
            .addTo(map);
        });

        markerRefs.current.push(marker);
        bounds.extend([adjuster.homeLng, adjuster.homeLat]);
        hasBounds = true;
      }
    }

    if (hasBounds) {
      map.fitBounds(bounds, {
        padding: { top: 80, right: 80, bottom: 80, left: 80 },
        maxZoom: 11.5,
      });
    } else {
      map.easeTo({ center: DEFAULT_CENTER, zoom: DEFAULT_ZOOM });
    }
  }, [activityClaims, adjusters, claims, mapReady, onSelectClaim, selectedClaimIds, showAdjusterActivity, showAdjusters, showClaims]);

  useEffect(() => {
    if (!mapRef.current || !selectedClaimIds.length) {
      return;
    }

    const selectedClaim = claims.find((claim) => claim.id === selectedClaimIds[0]);
    if (!selectedClaim || typeof selectedClaim.lossLng !== 'number' || typeof selectedClaim.lossLat !== 'number') {
      return;
    }

    mapRef.current.flyTo({
      center: [selectedClaim.lossLng, selectedClaim.lossLat],
      zoom: Math.max(mapRef.current.getZoom(), 11),
      essential: true,
    });
  }, [claims, selectedClaimIds]);

  const selectedCount = selectedClaimIds.length;
  const lassoIndicatorCount = lassoActive ? lassoPreviewCount : selectedCount;

  return (
    <section className="relative min-h-0 overflow-hidden bg-[#080f18]">
      <div ref={containerRef} className="absolute inset-0" />

      <div className="absolute left-3 top-3 z-20 grid gap-1">
        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <button
            type="button"
            onClick={onOpenLassoFilters}
            className={`flex w-full items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-left font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] ${lassoActive ? 'bg-[var(--sage-dim)] text-[var(--sage)]' : 'text-[var(--muted)]'}`}
          >
            <span>◎</span>
            <span>Lasso Select</span>
          </button>
          <button
            type="button"
            onClick={() => setShowClaims((value) => !value)}
            className={`flex w-full items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-left font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] ${showClaims ? 'text-[var(--sage)]' : 'text-[var(--muted)]'}`}
          >
            <span>●</span>
            <span>Show Claims</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAdjusters((value) => !value)}
            className={`flex w-full items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-left font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] ${showAdjusters ? 'text-[var(--sage)]' : 'text-[var(--muted)]'}`}
          >
            <span>●</span>
            <span>Show Adjusters</span>
          </button>
          <button
            type="button"
            onClick={() => setShowAdjusterActivity((value) => !value)}
            className={`flex w-full items-center gap-2 px-3 py-2 text-left font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] ${showAdjusterActivity ? 'text-[var(--sage)]' : 'text-[var(--muted)]'}`}
          >
            <span>●</span>
            <span>Show Adjuster Activity</span>
          </button>
        </div>

        <div className="overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)]">
          <button
            type="button"
            onClick={() => mapRef.current?.zoomIn()}
            className="flex w-full items-center gap-2 border-b border-[var(--border)] px-3 py-2 text-left font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]"
          >
            <span>⊕</span>
            <span>Zoom In</span>
          </button>
          <button
            type="button"
            onClick={() => mapRef.current?.zoomOut()}
            className="flex w-full items-center gap-2 px-3 py-2 text-left font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]"
          >
            <span>⊖</span>
            <span>Zoom Out</span>
          </button>
        </div>
        {selectedCount ? (
          <button
            type="button"
            onClick={onClearSelection}
            className="rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-left font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--muted)]"
          >
            ✕ Clear Selection
          </button>
        ) : null}
      </div>

      {lassoActive ? (
        <div className="absolute right-3 top-3 z-20 rounded-md border border-[rgba(91,194,115,0.3)] bg-[var(--sage-dim)] px-3 py-1.5 font-['Barlow_Condensed'] text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--sage)] animate-pulse">
          ● LASSO ACTIVE
        </div>
      ) : null}

      {(lassoActive || selectedCount) ? (
        <div className="absolute left-1/2 top-3 z-20 -translate-x-1/2 rounded-lg border border-[var(--sage)] bg-[var(--card-hi)] px-5 py-2 text-center">
          <div className="font-['Barlow_Condensed'] text-2xl font-black text-[var(--sage)]">
            {lassoIndicatorCount}
          </div>
          <div className="font-['Barlow_Condensed'] text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--muted)]">
            {lassoActive ? 'Claims In Lasso' : 'Claims Selected'}
          </div>
        </div>
      ) : null}

      <div className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3">
        {[
          ['var(--sage)', 'New - Unassigned'],
          ['var(--orange)', 'SLA At Risk'],
          ['var(--red)', 'SLA Overdue / Needs Attention'],
          ['var(--blue)', 'Adjuster Location'],
        ].map(([color, label]) => (
          <div key={label} className="mb-1 flex items-center gap-2 text-[11px] text-[var(--muted)] last:mb-0">
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            <span>{label}</span>
          </div>
        ))}
        {showAdjusterActivity ? (
          <>
            <div className="my-2 border-t border-[var(--border)]" />
            {[
              ['var(--bronze)', 'Assigned - No Appointment'],
              ['var(--orange)', 'Appointment Pending'],
              ['rgba(91, 194, 115, 0.4)', 'Appointment Confirmed'],
            ].map(([color, label]) => (
              <div key={label} className="mb-1 flex items-center gap-2 text-[11px] text-[var(--muted)] last:mb-0">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                <span>{label}</span>
              </div>
            ))}
          </>
        ) : null}
      </div>

      {selectedCount ? (
        <div className="absolute bottom-3 right-3 z-20">
          <button
            type="button"
            onClick={onOpenAssignModal}
            className="rounded-lg bg-[var(--sage)] px-5 py-3 font-['Barlow_Condensed'] text-xs font-extrabold uppercase tracking-[0.1em] text-[#06120C] shadow-[0_0_26px_rgba(91,194,115,0.45)]"
          >
            ✓ Assign {selectedCount} Claim{selectedCount > 1 ? 's' : ''} →
          </button>
        </div>
      ) : null}

      {!process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-[rgba(8,15,24,0.72)] px-8 text-center">
          <div className="max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] px-6 py-5">
            <div className="font-['Barlow_Condensed'] text-[12px] font-extrabold uppercase tracking-[0.16em] text-[var(--muted)]">
              Mapbox Token Missing
            </div>
            <p className="mt-2 text-[13px] leading-6 text-[var(--muted)]">
              Add <code>NEXT_PUBLIC_MAPBOX_TOKEN</code> to render the dispatch map.
            </p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
