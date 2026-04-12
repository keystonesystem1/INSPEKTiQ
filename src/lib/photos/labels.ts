// Ported from INSPEKTiT — generates photo descriptions, locations, and sort order
// to match what INSPEKTiT displays in its UI.

import type { ClaimPhotoDocument } from '@/lib/supabase/documents';
import type { ClaimInspectionData } from '@/lib/supabase/inspections';

// ─── Pills ────────────────────────────────────────────────────────────────────

const CLAIM_PILLS = new Set(['hail', 'wind', 'water', 'fire', 'wt'])

// ─── Helpers ──────────────────────────────────────────────────────────────────

function titleCase(text = '') {
  return text.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function escapeRegex(s = '') {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function sectionIsElevation(section: string) {
  return ['front', 'right', 'back', 'left'].includes(section)
}

function subsectionToElevationObject(subsection = '') {
  const MAP: Record<string, string> = {
    soffit: 'soffit',
    fascia: 'fascia',
    gutter: 'gutter',
    gutter_guards: 'gutter guards',
    downspout: 'downspout',
    siding: 'siding',
    trim: 'trim',
    door: 'door',
    window: 'window screen',
    ac: 'air conditioning unit',
    ancillary: 'ancillary item',
    overview: 'elevation',
  }
  return MAP[subsection] || titleCase(subsection).toLowerCase()
}

function subsectionToInteriorSurface(subsection = '') {
  if (subsection.endsWith('_ceiling')) return 'ceiling'
  if (subsection.endsWith('_walls')) return 'wall'
  if (subsection.endsWith('_floor')) return 'floor'
  if (subsection.endsWith('_fixtures')) return 'fixture'
  return 'surface'
}

const OS_AREA_SUFFIXES = [
  'fence_left_closeup', 'fence_left_overview',
  'fence_back_closeup', 'fence_back_overview',
  'fence_right_closeup', 'fence_right_overview',
  'fence_front_closeup', 'fence_front_overview',
  'left_closeup', 'left_overview',
  'back_closeup', 'back_overview',
  'right_closeup', 'right_overview',
  'front_closeup', 'front_overview',
  'roof_closeup', 'roof_overview',
  'overview',
]

function parseOtherStructureId(subsection = '') {
  for (const suf of OS_AREA_SUFFIXES) {
    const token = `_${suf}`
    if (subsection.endsWith(token)) return subsection.slice(0, -token.length)
  }
  return subsection
}

// ─── Exported label utilities ─────────────────────────────────────────────────

export function extractRoomName(label = '') {
  const surfaces = [' ceiling', ' walls', ' floor', ' fixtures', ' overview']
  let name = label
  surfaces.forEach((s) => {
    name = name.replace(new RegExp(`${s}$`, 'i'), '')
  })
  return name.trim() || 'Room'
}

export function extractStructureName(label = '') {
  const suffixes = [
    ' fence overview', ' fence close-up', ' fence closeup',
    ' fence front overview', ' fence front close-up', ' fence front closeup',
    ' fence right overview', ' fence right close-up', ' fence right closeup',
    ' fence back overview', ' fence back close-up', ' fence back closeup',
    ' fence left overview', ' fence left close-up', ' fence left closeup',
    ' overview',
    ' roof overview', ' roof close-up', ' roof closeup',
    ' front overview', ' front close-up', ' front closeup',
    ' right overview', ' right close-up', ' right closeup',
    ' back overview', ' back close-up', ' back closeup',
    ' left overview', ' left close-up', ' left closeup',
  ]
  let name = label
  suffixes.forEach((s) => {
    name = name.replace(new RegExp(`${escapeRegex(s)}$`, 'i'), '')
  })
  return name.trim() || 'Structure'
}

// ─── Photo location (section grouping) ───────────────────────────────────────

export function buildPhotoLocation(photo: ClaimPhotoDocument): string {
  const section = photo.section || ''
  const subsection = photo.subsection || ''

  if (section === 'risk') {
    return 'Dwelling'
  }

  if (section === 'interview') {
    if (subsection === 'contractor_business_card') return 'Interview > Contractor Business Card'
    return 'Interview'
  }

  if (section === 'roof') {
    if (subsection === 'roof_details') return 'Dwelling > Roof > Detail Photos'
    if (subsection.startsWith('slope_overview_')) return 'Dwelling > Roof > Slope Overviews'
    if (subsection.startsWith('test_square_')) {
      const parts = subsection.split('_')
      const slope = parts[2]
      return `Dwelling > Roof > ${slope} Slope`
    }
    return 'Dwelling > Roof'
  }

  if (sectionIsElevation(section)) {
    return `Dwelling > ${titleCase(section)} Elevation`
  }

  if (section === 'interior') {
    const roomName = extractRoomName(photo.label || '')
    if (subsection.endsWith('_ceiling')) return `Dwelling > Interior > ${roomName} > Ceiling`
    if (subsection.endsWith('_walls')) return `Dwelling > Interior > ${roomName} > Walls`
    if (subsection.endsWith('_floor')) return `Dwelling > Interior > ${roomName} > Floor`
    if (subsection.endsWith('_fixtures')) return `Dwelling > Interior > ${roomName} > Fixtures`
    return `Dwelling > Interior > ${roomName}`
  }

  if (section === 'other_structures') {
    const structureName = extractStructureName(photo.label || '')
    const sub = subsection
    if (sub.endsWith('_roof_overview') || sub.endsWith('_roof_closeup')) return `Other Structures > ${structureName} > Roof`
    if (sub.endsWith('_front_overview') || sub.endsWith('_front_closeup')) return `Other Structures > ${structureName} > Front Elevation`
    if (sub.endsWith('_right_overview') || sub.endsWith('_right_closeup')) return `Other Structures > ${structureName} > Right Elevation`
    if (sub.endsWith('_back_overview') || sub.endsWith('_back_closeup')) return `Other Structures > ${structureName} > Back Elevation`
    if (sub.endsWith('_left_overview') || sub.endsWith('_left_closeup')) return `Other Structures > ${structureName} > Left Elevation`
    if (sub.includes('_fence_')) {
      const run = sub.includes('_front') ? 'Front' : sub.includes('_right') ? 'Right' : sub.includes('_back') ? 'Back' : 'Left'
      return `Other Structures > ${structureName} > ${run} Run`
    }
    return `Other Structures > ${structureName}`
  }

  if (section === 'personal_property') return 'Personal Property'

  return 'Unassigned'
}

// ─── Photo description ────────────────────────────────────────────────────────

export interface PhotoContext {
  testSquareData: Record<string, { hailHitsPerTestSquare: number; windShingles: number }>;
  roofData: Record<string, string | null>;
  interiorRooms: Array<{
    id: string;
    ceiling?: { damaged?: string; description?: string };
    walls?: { damaged?: string; description?: string };
    floor?: { damaged?: string; description?: string };
    fixtures?: { damaged?: string; description?: string };
  }>;
  personalPropertyItems: Array<{
    id: string;
    description?: string;
    noDamage?: boolean;
    notes?: string;
  }>;
  roomIds: string[];
}

function normalizeRoofDetailPill(pill = '') {
  const normalized = String(pill || '').trim().toLowerCase()
  const aliases: Record<string, string> = {
    'material type': 'material_type', material_type: 'material_type',
    '# of layers': 'layers', layers: 'layers',
    'drip edge': 'drip_edge', drip_edge: 'drip_edge',
    felt: 'felt', pitch: 'pitch', valley: 'valley', decking: 'decking',
  }
  return aliases[normalized] || normalized.replace(/\s+/g, '_')
}

function damageLeadForOverviewPill(pill: string) {
  switch (pill) {
    case 'hail': return 'Hail damage to '
    case 'wind': return 'Wind damage to '
    case 'water': return 'Water damage to '
    case 'fire': return 'Fire damage to '
    case 'wt': return 'Wind and hail damage to '
    default: return `${titleCase(pill)} damage to `
  }
}

function formatOverviewItemList(items: string[]) {
  const u = [...new Set(items.map((x) => String(x || '').trim().toLowerCase()).filter(Boolean))].sort()
  if (u.length === 0) return ''
  if (u.length === 1) return u[0]
  if (u.length === 2) return `${u[0]} and ${u[1]}`
  return `${u.slice(0, -1).join(', ')} and ${u[u.length - 1]}`
}

function stripElevationPrefixFromLabel(label = '') {
  let s = String(label).trim()
  s = s.replace(/^(Front|Right|Back|Left)(\s+Elevation)?\s+/i, '')
  s = s.replace(/\s+qty\s+\d+$/i, '').trim()
  return s
}

function inferInteriorDamageLead(description = '') {
  const text = String(description || '').trim().toLowerCase()
  if (!text) return 'Damage to '
  if (/(water|stain|staining|leak|moisture|wet|buckl)/.test(text)) return 'Water damage to '
  if (/(smoke|soot|char|burn|fire)/.test(text)) return 'Smoke or fire damage to '
  if (/(impact|hole|puncture|dent)/.test(text)) return 'Impact damage to '
  if (/(crack|cracking|sag|sagging|drywall|plaster)/.test(text)) return 'Damage to '
  if (/(functional|not working|broken|malfunction)/.test(text)) return 'Functional damage to '
  return 'Damage to '
}

function getOverviewSiblingPhotos(photo: ClaimPhotoDocument, allPhotos: ClaimPhotoDocument[]) {
  const section = photo.section || ''
  const subsection = photo.subsection || ''

  if (sectionIsElevation(section) && subsection === 'overview') {
    return allPhotos.filter((p) => p.path !== photo.path && p.section === section && p.subsection !== 'overview')
  }
  if (
    section === 'interior' &&
    subsection &&
    !subsection.includes('_ceiling') &&
    !subsection.includes('_walls') &&
    !subsection.includes('_floor') &&
    !subsection.includes('_fixtures')
  ) {
    return allPhotos.filter(
      (p) => p.path !== photo.path && p.section === 'interior' && p.subsection.startsWith(`${subsection}_`),
    )
  }
  if (section === 'other_structures' && subsection.endsWith('_overview')) {
    const sid = parseOtherStructureId(subsection)
    return allPhotos.filter(
      (p) => p.path !== photo.path && p.section === 'other_structures' && parseOtherStructureId(p.subsection || '') === sid,
    )
  }
  return []
}

function extractOverviewItemName(sibling: ClaimPhotoDocument, overviewPhoto: ClaimPhotoDocument) {
  const ovSection = overviewPhoto.section || ''
  const sub = sibling.subsection || ''

  if (sectionIsElevation(ovSection)) {
    const fromLabel = stripElevationPrefixFromLabel(sibling.label || '')
    if (fromLabel) return fromLabel.toLowerCase()
    return subsectionToElevationObject(sub)
  }

  if (ovSection === 'interior') {
    const roomName = extractRoomName(overviewPhoto.label || '')
    const lab = (sibling.label || '').trim()
    const rest = lab.replace(new RegExp(`^${escapeRegex(roomName)}\\s+`, 'i'), '').trim()
    return (rest || subsectionToInteriorSurface(sub)).toLowerCase()
  }

  if (ovSection === 'other_structures') {
    const struct = extractStructureName(overviewPhoto.label || '')
    let rest = (sibling.label || '').replace(new RegExp(`^${escapeRegex(struct)}\\s+`, 'i'), '').trim()
    rest = rest.replace(/\s+overview$/i, '').replace(/\s+close-up$/i, '').replace(/\s+closeup$/i, '').trim()
    return (rest || 'structure').toLowerCase()
  }

  return (sibling.label || 'item').toLowerCase()
}

function buildOverviewDescriptionWithItems(
  photo: ClaimPhotoDocument,
  allPhotos: ClaimPhotoDocument[],
  context: PhotoContext,
) {
  const siblings = getOverviewSiblingPhotos(photo, allPhotos).filter((p) =>
    (p.pills || []).some((pill) => CLAIM_PILLS.has(pill)),
  )

  const byPill = new Map<string, Set<string>>()
  for (const s of siblings) {
    const item = extractOverviewItemName(s, photo)
    for (const pill of s.pills || []) {
      if (!CLAIM_PILLS.has(pill)) continue
      if (!byPill.has(pill)) byPill.set(pill, new Set())
      byPill.get(pill)!.add(item)
    }
  }

  const ovSection = photo.section || ''
  if (ovSection === 'interior') {
    const roomId = photo.subsection || ''
    const room = context.interiorRooms.find((r) => r.id === roomId)
    if (room) {
      const surfaceKeys = ['ceiling', 'walls', 'floor', 'fixtures'] as const
      const damagedSurfaces = surfaceKeys.filter((k) => room[k]?.damaged === 'Yes')
      if (damagedSurfaces.length > 0 && byPill.size === 0) {
        const details = damagedSurfaces.map((k) => {
          const desc = room[k]?.description
          const item = k === 'walls' ? 'wall' : k === 'fixtures' ? 'fixture' : k
          if (desc) return `${inferInteriorDamageLead(desc)}${item}`.trim()
          return `Damage to ${item}`
        })
        return `Overview — ${details.join('; ')}.`
      }
    }
  }

  if (byPill.size === 0 && siblings.length === 0) return 'Overview — No claim related damage observed.'

  const order = ['hail', 'wind', 'water', 'fire', 'wt']
  const sentences: string[] = []
  for (const pill of order) {
    if (!byPill.has(pill)) continue
    const items = formatOverviewItemList([...byPill.get(pill)!])
    if (items) sentences.push(`${damageLeadForOverviewPill(pill)}${items}.`)
  }
  for (const pill of byPill.keys()) {
    if (order.includes(pill)) continue
    const items = formatOverviewItemList([...byPill.get(pill)!])
    if (items) sentences.push(`${damageLeadForOverviewPill(pill)}${items}.`)
  }

  if (sentences.length === 0) return 'Overview — No claim related damage observed.'
  return `Overview — ${sentences.join(' ')}`
}

export function buildPhotoDescription(
  photo: ClaimPhotoDocument,
  allPhotos: ClaimPhotoDocument[],
  context: PhotoContext,
): string {
  const section = photo.section || ''
  const subsection = photo.subsection || ''
  const label = photo.label || ''
  const pills = Array.isArray(photo.pills) ? photo.pills : []

  if (section === 'personal_property' && subsection) {
    const item = context.personalPropertyItems.find((it) => it.id === subsection)
    const itemDesc = item?.description || label || 'Item'
    if (item?.noDamage) return `${itemDesc} - no damage observed.`
    if (item?.notes) return `${itemDesc} - ${item.notes}`
    return `${itemDesc}.`
  }

  const isElevationOverview = sectionIsElevation(section) && subsection === 'overview'
  const isInteriorOverview =
    section === 'interior' &&
    subsection &&
    !subsection.includes('_ceiling') &&
    !subsection.includes('_walls') &&
    !subsection.includes('_floor') &&
    !subsection.includes('_fixtures')
  const isOtherStructuresOverview = section === 'other_structures' && subsection.endsWith('_overview')

  if (isElevationOverview || isInteriorOverview || isOtherStructuresOverview) {
    return buildOverviewDescriptionWithItems(photo, allPhotos, context)
  }

  if (section === 'other_structures' && subsection.includes('_fence_') && !subsection.endsWith('_overview')) {
    const run = subsection.includes('_front') ? 'Front' : subsection.includes('_right') ? 'Right' : subsection.includes('_back') ? 'Back' : 'Left'
    const hasClaimDamage = pills.some((p) => CLAIM_PILLS.has(p))
    if (hasClaimDamage) {
      const dmg = pills.find((p) => CLAIM_PILLS.has(p))!
      const dmgText = dmg === 'hail' ? 'hail' : dmg === 'wind' ? 'wind' : dmg === 'wt' ? 'wind and hail' : dmg === 'water' ? 'water' : dmg === 'fire' ? 'fire' : dmg
      return `${run} run close-up shows ${dmgText} damage.`
    }
    return `${run} run close-up — no damage observed.`
  }

  if (subsection === 'risk_shot') return 'Risk shot.'
  if (subsection === 'address_verification') return 'Address verification.'
  if (subsection === 'contractor_business_card') return 'Contractor business card.'

  if (subsection.startsWith('slope_overview_')) {
    const slope = subsection.replace('slope_overview_', '')
    const sq = context.testSquareData[slope] || {}
    const hail = sq.hailHitsPerTestSquare ?? 0
    const wind = sq.windShingles ?? 0
    if (hail > 0 && wind > 0) return `Slope overview — ${hail} hail hits per test square and ${wind} wind damaged shingles.`
    if (hail > 0) return `Slope overview — ${hail} hail hits per test square.`
    if (wind > 0) return `Slope overview — ${wind} wind damaged shingles.`
    return 'Slope overview — No claim related damage observed.'
  }

  if (subsection === 'roof_details') {
    const roofData = context.roofData
    const PILL_TO_ROOF_FIELD: Record<string, string | null | undefined> = {
      material_type: roofData.materialType,
      layers: roofData.layers ? `${roofData.layers} layer${roofData.layers === '1' ? '' : 's'}` : null,
      drip_edge: roofData.dripEdge === 'Yes' ? 'drip edge present' : null,
      felt: roofData.feltType,
      pitch: roofData.pitch ? `${roofData.pitch} pitch` : null,
      valley: roofData.valleyStyle,
      valley_metal: roofData.valleyMetal && roofData.valleyMetal !== 'None' ? roofData.valleyMetal : null,
      decking: roofData.deckingType,
    }
    const activePills = pills.map(normalizeRoofDetailPill).filter(Boolean)
    const values = activePills.filter((p) => p !== 'general').map((p) => PILL_TO_ROOF_FIELD[p]).filter(Boolean) as string[]
    if (values.length > 0) return `Shows ${values.join(', ')}.`
    return 'Roof detail photo.'
  }

  if (subsection.includes('test_square_')) {
    const slopeParts = subsection.split('_')
    const slope = slopeParts[2] || ''
    const sq = context.testSquareData[slope] || {}
    const hail = sq.hailHitsPerTestSquare ?? 0
    const wind = sq.windShingles ?? 0

    if (subsection.endsWith('_overview')) {
      if (hail > 0 && wind > 0) return `Test square overview — ${hail} hail hits per test square and ${wind} wind damaged shingles.`
      if (hail > 0) return `Test square overview — ${hail} hail hits per test square.`
      if (wind > 0) return `Test square overview — ${wind} wind damaged shingles.`
      return 'Test square overview — No claim related damage observed.'
    }
    if (subsection.endsWith('_details')) {
      if (hail > 0 && wind > 0) return `Test square detail — ${hail} hail hits per test square and ${wind} wind damaged shingles.`
      if (hail > 0) return `Test square detail — ${hail} hail hits per test square.`
      if (wind > 0) return `Test square detail — ${wind} wind damaged shingles.`
      return 'Test square detail — No claim related damage observed.'
    }
    if (subsection.endsWith('_hail_hits')) {
      return hail > 0 ? `Hail hit on shingle — ${hail} hail hits per test square.` : 'Hail hit on shingle.'
    }
    if (subsection.endsWith('_wind_damage')) {
      return wind > 0 ? `Wind damaged shingle — ${wind} wind damaged shingles per test square.` : 'Wind damage to shingle.'
    }
    if (subsection.endsWith('_non_claim')) return 'No claim related damage to shingle.'
  }

  if (subsection.startsWith('ancillary_')) {
    const item = subsection.replace('ancillary_', '').replace(/_/g, ' ').toLowerCase()
    if (pills.includes('hail')) return `Hail damage to ${item}.`
    if (pills.includes('wind')) return `Wind damage to ${item}.`
    if (pills.includes('wt')) return `Weather related damage to ${item}.`
    if (pills.includes('water')) return `Water damage to ${item}.`
    if (pills.includes('fire')) return `Fire damage to ${item}.`
    if (pills.includes('mech')) return `Mechanical damage to ${item}.`
    if (pills.includes('prior')) return `Prior damage to ${item}.`
    return `No damage to ${item}.`
  }

  if (sectionIsElevation(section) && subsection !== 'overview') {
    const target = subsectionToElevationObject(subsection)
    if (pills.includes('hail')) return `Hail damage to ${target}.`
    if (pills.includes('wind')) return `Wind damage to ${target}.`
    if (pills.includes('wt')) return `Weather related damage to ${target}.`
    if (pills.includes('water')) return `Water damage to ${target}.`
    if (pills.includes('fire')) return `Fire damage to ${target}.`
    if (pills.includes('mech')) return `Mechanical damage to ${target}.`
    if (pills.includes('prior')) return `Prior damage to ${target}.`
    return `No claim related damage to ${target}.`
  }

  if (section === 'interior' && /_(ceiling|walls|floor|fixtures)$/.test(subsection)) {
    const surfaceKey = (subsection.match(/_(ceiling|walls|floor|fixtures)$/)?.[1] || '') as 'ceiling' | 'walls' | 'floor' | 'fixtures'
    const roomId = subsection.replace(`_${surfaceKey}`, '')
    const room = context.interiorRooms.find((r) => r.id === roomId)
    const surface = room?.[surfaceKey]
    const surfaceName = surfaceKey.charAt(0).toUpperCase() + surfaceKey.slice(1)
    const roomName = extractRoomName(label)

    if (surface?.damaged === 'Yes' && surface?.description) {
      return `${roomName} ${surfaceName.toLowerCase()} — ${surface.description}`
    }
    if (surface?.damaged === 'Yes') {
      return `Damage to ${surfaceName.toLowerCase()} noted.`
    }
    if (!pills.some((p) => CLAIM_PILLS.has(p))) {
      const canonical = new RegExp(`^${escapeRegex(roomName)}\\s+${escapeRegex(surfaceName)}$`, 'i')
      if (canonical.test(label.trim())) {
        return 'No claim related damage observed.'
      }
    }
  }

  if (label && label.length > 0) return `${label}.`

  const hasClaimPill = pills.some((p) => CLAIM_PILLS.has(p))
  if (hasClaimPill) {
    const claimPills = pills.filter((p) => CLAIM_PILLS.has(p))
    const damage = claimPills
      .map((p) =>
        p === 'hail' ? 'Hail' : p === 'wind' ? 'Wind' : p === 'water' ? 'Water' : p === 'fire' ? 'Fire' : p === 'wt' ? 'Wind and hail' : p,
      )
      .join(' and ')
    return `${damage} damage noted.`
  }

  return 'No claim related damage observed.'
}

// ─── Photo sort order ─────────────────────────────────────────────────────────

export function getPhotoSortOrder(section: string, subsection = '', context: Pick<PhotoContext, 'roomIds'>): number {
  const key = `${section}::${subsection}`
  const sub = subsection || ''

  const ORDER: Record<string, number> = {
    'risk::risk_shot': 10, 'risk::address_verification': 20,
    'interview::contractor_business_card': 30,
    'roof::roof_details': 100,
    'roof::slope_overview_Front': 110, 'roof::slope_overview_Right': 120,
    'roof::slope_overview_Back': 130, 'roof::slope_overview_Left': 140,
    'roof::test_square_Front_overview': 150, 'roof::test_square_Front_details': 151,
    'roof::test_square_Front_hail_hits': 152, 'roof::test_square_Front_wind_damage': 153,
    'roof::test_square_Front_non_claim': 154,
    'roof::test_square_Right_overview': 160, 'roof::test_square_Right_details': 161,
    'roof::test_square_Right_hail_hits': 162, 'roof::test_square_Right_wind_damage': 163,
    'roof::test_square_Right_non_claim': 164,
    'roof::test_square_Back_overview': 170, 'roof::test_square_Back_details': 171,
    'roof::test_square_Back_hail_hits': 172, 'roof::test_square_Back_wind_damage': 173,
    'roof::test_square_Back_non_claim': 174,
    'roof::test_square_Left_overview': 180, 'roof::test_square_Left_details': 181,
    'roof::test_square_Left_hail_hits': 182, 'roof::test_square_Left_wind_damage': 183,
    'roof::test_square_Left_non_claim': 184,
    'roof::ancillary_pipe_jack': 190, 'roof::ancillary_vents': 191,
    'roof::ancillary_flashing': 192, 'roof::ancillary_chimney': 193,
    'roof::ancillary_skylight': 194, 'roof::ancillary_solar_panels': 195,
    'roof::ancillary_satellite_dish': 196, 'roof::ancillary_antenna': 197,
    'roof::ancillary_hvac_curb_unit': 198, 'roof::ancillary_attic_hatch': 199,
    'roof::ancillary_snow_guards': 200, 'roof::ancillary_snow_melt_wire': 201,
    'roof::ancillary_weather_head': 202, 'roof::ancillary_custom': 203,
    'roof::ancillary_other': 204,
    'front::overview': 300, 'front::soffit': 301, 'front::fascia': 302,
    'front::gutter': 303, 'front::gutter_guards': 304, 'front::downspout': 305,
    'front::paint': 306, 'front::siding': 307, 'front::trim': 308,
    'front::door': 309, 'front::window': 310, 'front::ac': 311,
    'front::ancillary': 312, 'front::dryer_vent': 313, 'front::soffit_vent': 314,
    'front::gable_vent': 315, 'front::shutters': 316, 'front::window_screens': 317,
    'front::storm_door': 318, 'front::exterior_light': 319, 'front::hose_bib': 320,
    'front::meter_box': 321, 'front::garage_door': 322, 'front::garage_door_trim': 323,
    'front::low_voltage_box': 324, 'front::elec_disconnect': 325, 'front::elec_panel': 326,
    'front::weather_head': 327, 'front::window_wells': 328, 'front::decorative_trim': 329,
    'front::foundation_vent': 330, 'front::custom': 331,
    'right::overview': 400, 'right::soffit': 401, 'right::fascia': 402,
    'right::gutter': 403, 'right::gutter_guards': 404, 'right::downspout': 405,
    'right::paint': 406, 'right::siding': 407, 'right::trim': 408,
    'right::door': 409, 'right::window': 410, 'right::ac': 411,
    'right::ancillary': 412, 'right::dryer_vent': 413, 'right::soffit_vent': 414,
    'right::gable_vent': 415, 'right::shutters': 416, 'right::window_screens': 417,
    'right::storm_door': 418, 'right::exterior_light': 419, 'right::hose_bib': 420,
    'right::meter_box': 421, 'right::garage_door': 422, 'right::garage_door_trim': 423,
    'right::low_voltage_box': 424, 'right::elec_disconnect': 425, 'right::elec_panel': 426,
    'right::weather_head': 427, 'right::window_wells': 428, 'right::decorative_trim': 429,
    'right::foundation_vent': 430, 'right::custom': 431,
    'back::overview': 500, 'back::soffit': 501, 'back::fascia': 502,
    'back::gutter': 503, 'back::gutter_guards': 504, 'back::downspout': 505,
    'back::paint': 506, 'back::siding': 507, 'back::trim': 508,
    'back::door': 509, 'back::window': 510, 'back::ac': 511,
    'back::ancillary': 512, 'back::dryer_vent': 513, 'back::soffit_vent': 514,
    'back::gable_vent': 515, 'back::shutters': 516, 'back::window_screens': 517,
    'back::storm_door': 518, 'back::exterior_light': 519, 'back::hose_bib': 520,
    'back::meter_box': 521, 'back::garage_door': 522, 'back::garage_door_trim': 523,
    'back::low_voltage_box': 524, 'back::elec_disconnect': 525, 'back::elec_panel': 526,
    'back::weather_head': 527, 'back::window_wells': 528, 'back::decorative_trim': 529,
    'back::foundation_vent': 530, 'back::custom': 531,
    'left::overview': 600, 'left::soffit': 601, 'left::fascia': 602,
    'left::gutter': 603, 'left::gutter_guards': 604, 'left::downspout': 605,
    'left::paint': 606, 'left::siding': 607, 'left::trim': 608,
    'left::door': 609, 'left::window': 610, 'left::ac': 611,
    'left::ancillary': 612, 'left::dryer_vent': 613, 'left::soffit_vent': 614,
    'left::gable_vent': 615, 'left::shutters': 616, 'left::window_screens': 617,
    'left::storm_door': 618, 'left::exterior_light': 619, 'left::hose_bib': 620,
    'left::meter_box': 621, 'left::garage_door': 622, 'left::garage_door_trim': 623,
    'left::low_voltage_box': 624, 'left::elec_disconnect': 625, 'left::elec_panel': 626,
    'left::weather_head': 627, 'left::window_wells': 628, 'left::decorative_trim': 629,
    'left::foundation_vent': 630, 'left::custom': 631,
  }

  const mapped = ORDER[key]
  if (mapped != null) return mapped

  if (section === 'other_structures') {
    if (sub.endsWith('_roof_closeup')) return 1020
    if (sub.endsWith('_roof_overview')) return 1010
    if (sub.endsWith('_front_closeup') || sub.endsWith('_front_overview')) return 1030
    if (sub.endsWith('_right_closeup') || sub.endsWith('_right_overview')) return 1040
    if (sub.endsWith('_back_closeup') || sub.endsWith('_back_overview')) return 1050
    if (sub.endsWith('_left_closeup') || sub.endsWith('_left_overview')) return 1060
    if (sub.includes('_fence_')) return 1070
    if (sub.endsWith('_overview')) return 1000
    return 1080
  }

  if (section === 'interior') {
    const roomIds = context.roomIds || []
    let roomId = sub
    let surfaceOffset = 0
    if (sub.endsWith('_ceiling')) { roomId = sub.replace(/_ceiling$/, ''); surfaceOffset = 1 }
    else if (sub.endsWith('_walls')) { roomId = sub.replace(/_walls$/, ''); surfaceOffset = 2 }
    else if (sub.endsWith('_floor')) { roomId = sub.replace(/_floor$/, ''); surfaceOffset = 3 }
    else if (sub.endsWith('_fixtures')) { roomId = sub.replace(/_fixtures$/, ''); surfaceOffset = 4 }
    const roomIndex = roomIds.indexOf(roomId)
    const roomBase = roomIndex >= 0 ? roomIndex : roomIds.length
    return 1100 + roomBase * 10 + surfaceOffset
  }

  if (section === 'personal_property') return 1200

  return 999999
}

// ─── Context extraction from inspection.data ──────────────────────────────────

function readRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function buildPhotoContext(inspectionData: Record<string, unknown> | null | undefined): PhotoContext {
  const data = readRecord(inspectionData)
  const inspektit = readRecord(data.inspektit)
  const dwelling = readRecord(inspektit.dwelling)
  const roof = readRecord(dwelling.roof)
  const interior = readRecord(dwelling.interior)
  const personalProperty = readRecord(inspektit.personalProperty)

  // testSquareData keyed by slope name (e.g. "Front", "Right", "Back", "Left")
  const testSquareData: PhotoContext['testSquareData'] = {}
  for (const item of readArray(roof.testSquares)) {
    const sq = readRecord(item)
    const slope = readString(sq.slopeName) || readString(sq.slope)
    if (slope) {
      testSquareData[slope] = {
        hailHitsPerTestSquare: Number(sq.hailHitsPerTestSquare ?? sq.hailHitsPerSquare ?? sq.hailHits ?? 0),
        windShingles: Number(sq.windShingles ?? sq.windDamage ?? 0),
      }
    }
  }

  const roofData: PhotoContext['roofData'] = {
    materialType: readString(roof.materialType) || null,
    layers: readString(roof.layers) || (roof.layers != null ? String(roof.layers) : null),
    dripEdge: readString(roof.dripEdge) || null,
    feltType: readString(roof.feltType) || null,
    pitch: readString(roof.pitch) || null,
    valleyStyle: readString(roof.valleyStyle) || null,
    valleyMetal: readString(roof.valleyMetal) || null,
    deckingType: readString(roof.deckingType) || null,
  }

  const interiorRooms: PhotoContext['interiorRooms'] = readArray(interior.rooms)
    .map((item) => {
      const room = readRecord(item)
      const id = readString(room.id)
      if (!id) return null
      const mapSurface = (key: string) => {
        const surface = room[key]
        if (!surface || typeof surface !== 'object') return undefined
        const s = surface as Record<string, unknown>
        return { damaged: readString(s.damaged) || undefined, description: readString(s.description) || undefined }
      }
      return {
        id,
        ceiling: mapSurface('ceiling'),
        walls: mapSurface('walls'),
        floor: mapSurface('floor'),
        fixtures: mapSurface('fixtures'),
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  const roomIds = interiorRooms.map((r) => r.id)

  const personalPropertyItems: PhotoContext['personalPropertyItems'] = readArray(personalProperty.items)
    .map((item) => {
      const it = readRecord(item)
      const id = readString(it.id)
      if (!id) return null
      return {
        id,
        description: readString(it.description) || readString(it.itemDescription) || undefined,
        noDamage: Boolean(it.noDamage),
        notes: readString(it.notes) || undefined,
      }
    })
    .filter((it): it is NonNullable<typeof it> => it !== null)

  return { testSquareData, roofData, interiorRooms, personalPropertyItems, roomIds }
}
