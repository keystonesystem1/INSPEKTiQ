/**
 * Workflow Studio Shared Registry v1 — INSPEKTiQ Mirror
 *
 * SOURCE OF TRUTH: INSPEKTiT master at src/constants/workflowRegistry.js
 * Keep both files in sync. Do not modify section keys.
 *
 * RULES:
 *   1. Section keys are stable — do not rename
 *   2. This defines presentation units, not raw DB paths
 *   3. New sections/fields can be added without breaking old templates
 *   4. Templates must ignore unknown future fields safely
 */

import type {
  SectionConfig,
  SectionMode,
  SubsectionConfig,
  ReportTypeConfig,
  WorkflowDraft,
  ReportType,
} from '@/lib/types/workflow';

export const REGISTRY_VERSION = 1;

// ── Report Types ──

export const REPORT_TYPES = {
  initial_report: {
    key: 'initial_report' as const,
    label: 'Initial Report',
    shortLabel: 'Initial',
    description: 'First formal report generated for a claim',
  },
  interim_report: {
    key: 'interim_report' as const,
    label: 'Interim Report',
    shortLabel: 'Interim',
    description: 'Follow-up report before final resolution',
  },
  final_report: {
    key: 'final_report' as const,
    label: 'Final Report',
    shortLabel: 'Final',
    description: 'Closing report for the claim',
  },
  supplement_report: {
    key: 'supplement_report' as const,
    label: 'Supplement Report',
    shortLabel: 'Supplement',
    description: 'Supplemental report for added findings or scope',
  },
  inspection_only: {
    key: 'inspection_only' as const,
    label: 'Inspection Only',
    shortLabel: 'Insp. Only',
    description: 'Inspection documentation without full narrative claim reporting',
  },
} as const;

export const REPORT_TYPE_LIST = Object.values(REPORT_TYPES) as Array<{
  key: ReportType;
  label: string;
  shortLabel: string;
  description: string;
}>;

// ── Section Keys (stable identifiers — never rename) ──

export const SECTION_KEYS = {
  CLAIM_SUMMARY: 'claim_summary',
  ASSIGNMENT: 'assignment',
  CAUSE_OF_LOSS: 'cause_of_loss',
  RISK_DESCRIPTION: 'risk_description',
  MORTGAGE: 'mortgage',
  INITIAL_INSPECTION: 'initial_inspection',
  COVERAGE_A: 'coverage_a',
  COVERAGE_B: 'coverage_b',
  COVERAGE_C: 'coverage_c',
  CONTRACTORS: 'contractors',
  CONCLUSION: 'conclusion',
  CERTIFICATION: 'certification',
  ENCLOSURES: 'enclosures',
  PHOTOGRAPHS: 'photographs',
  SCOPE_ESTIMATE: 'scope_estimate',
  EXCLUSIONS: 'exclusions',
  CUSTOM_TEXT: 'custom_text',
} as const;

export type SectionKey = (typeof SECTION_KEYS)[keyof typeof SECTION_KEYS];

// ── Mode Keys ──

export const MODE_KEYS = {
  SUMMARY: 'summary',
  FULL: 'full',
  STRUCTURED: 'structured',
  NARRATIVE: 'narrative',
  HYBRID: 'hybrid',
  OMIT: 'omit',
  CUSTOM_TEXT: 'custom_text',
  ALWAYS_ON: 'always_on',
} as const;

// ── Section Definition Types ──

export interface SubsectionDefinition {
  key: string;
  label: string;
  supports_heading_override: boolean;
  supports_field_toggles: boolean;
}

export interface SectionDefinition {
  key: string;
  label: string;
  supports_heading_override: boolean;
  supports_modes: string[];
  supports_field_toggles: boolean;
  supports_subsections: boolean;
  v1_field_toggle_scope?: string[];
  subsections?: Record<string, SubsectionDefinition>;
  required?: boolean;
  defer_v1?: boolean;
  repeatable?: boolean;
}

// ── Section Registry ──

export const SECTION_REGISTRY: Record<SectionKey, SectionDefinition> = {
  claim_summary: {
    key: 'claim_summary',
    label: 'Claim Summary',
    supports_heading_override: true,
    supports_modes: ['summary', 'full'],
    supports_field_toggles: true,
    supports_subsections: false,
    v1_field_toggle_scope: [
      'carrier_name',
      'insured_name',
      'claim_number',
      'policy_number',
      'date_of_loss',
      'loss_location',
      'adjuster_name',
    ],
  },
  assignment: {
    key: 'assignment',
    label: 'Assignment',
    supports_heading_override: true,
    supports_modes: ['summary', 'full', 'omit'],
    supports_field_toggles: true,
    supports_subsections: false,
    v1_field_toggle_scope: [
      'assigned_date',
      'contact_date',
      'inspection_date',
      'contact_person',
    ],
  },
  cause_of_loss: {
    key: 'cause_of_loss',
    label: 'Cause of Loss',
    supports_heading_override: true,
    supports_modes: ['summary', 'full', 'omit'],
    supports_field_toggles: true,
    supports_subsections: false,
    v1_field_toggle_scope: ['cause_type', 'date_of_loss', 'cause_explanation'],
  },
  risk_description: {
    key: 'risk_description',
    label: 'Risk Description & Occupancy',
    supports_heading_override: true,
    supports_modes: ['structured', 'narrative', 'hybrid', 'omit'],
    supports_field_toggles: true,
    supports_subsections: false,
    v1_field_toggle_scope: [
      'risk_location',
      'story_count',
      'occupancy_type',
      'construction_type',
      'foundation_type',
      'year_built',
      'roof_age',
      'condition',
    ],
  },
  mortgage: {
    key: 'mortgage',
    label: 'Mortgage / Title Encumbrances',
    supports_heading_override: true,
    supports_modes: ['structured', 'omit'],
    supports_field_toggles: true,
    supports_subsections: false,
    v1_field_toggle_scope: ['lien_holder'],
  },
  initial_inspection: {
    key: 'initial_inspection',
    label: 'Initial Inspection / Investigation',
    supports_heading_override: true,
    supports_modes: ['structured', 'narrative', 'hybrid', 'omit'],
    supports_field_toggles: false,
    supports_subsections: false,
  },
  coverage_a: {
    key: 'coverage_a',
    label: 'Coverage A / Dwelling',
    supports_heading_override: true,
    supports_modes: ['structured', 'omit'],
    supports_field_toggles: false,
    supports_subsections: true,
    subsections: {
      roof: {
        key: 'roof',
        label: 'Roof',
        supports_heading_override: true,
        supports_field_toggles: false,
      },
      elevations: {
        key: 'elevations',
        label: 'Elevations',
        supports_heading_override: true,
        supports_field_toggles: false,
      },
      interior: {
        key: 'interior',
        label: 'Interior',
        supports_heading_override: true,
        supports_field_toggles: false,
      },
    },
  },
  coverage_b: {
    key: 'coverage_b',
    label: 'Coverage B / Other Structures',
    supports_heading_override: true,
    supports_modes: ['structured', 'summary', 'omit'],
    supports_field_toggles: false,
    supports_subsections: false,
  },
  coverage_c: {
    key: 'coverage_c',
    label: 'Coverage C / Personal Property',
    supports_heading_override: true,
    supports_modes: ['structured', 'summary', 'omit'],
    supports_field_toggles: false,
    supports_subsections: false,
  },
  contractors: {
    key: 'contractors',
    label: 'Contractors',
    supports_heading_override: true,
    supports_modes: ['structured', 'omit'],
    supports_field_toggles: true,
    supports_subsections: false,
    v1_field_toggle_scope: [
      'contractor_presence',
      'contractor_name',
      'contractor_company',
      'contractor_phone',
      'contractor_email',
    ],
  },
  conclusion: {
    key: 'conclusion',
    label: 'Conclusion / Recommendations',
    supports_heading_override: true,
    supports_modes: ['summary', 'full', 'omit'],
    supports_field_toggles: true,
    supports_subsections: false,
    v1_field_toggle_scope: [
      'recommendation_summary',
      'closing_comments',
      'boilerplate_closing',
    ],
  },
  certification: {
    key: 'certification',
    label: 'Certification',
    supports_heading_override: false,
    supports_modes: ['always_on'],
    supports_field_toggles: false,
    supports_subsections: false,
    required: true,
  },
  enclosures: {
    key: 'enclosures',
    label: 'Enclosures',
    supports_heading_override: true,
    supports_modes: ['structured', 'omit'],
    supports_field_toggles: true,
    supports_subsections: false,
    v1_field_toggle_scope: [
      'photo_report',
      'statement_of_loss',
      'building_estimate',
      'diagrams',
    ],
  },
  photographs: {
    key: 'photographs',
    label: 'Photographs',
    supports_heading_override: true,
    supports_modes: ['summary', 'omit'],
    supports_field_toggles: false,
    supports_subsections: false,
    defer_v1: true,
  },
  scope_estimate: {
    key: 'scope_estimate',
    label: 'Scope / Estimate',
    supports_heading_override: true,
    supports_modes: ['summary', 'omit'],
    supports_field_toggles: false,
    supports_subsections: false,
    defer_v1: true,
  },
  exclusions: {
    key: 'exclusions',
    label: 'Exclusions / Limitations',
    supports_heading_override: true,
    supports_modes: ['structured', 'omit'],
    supports_field_toggles: false,
    supports_subsections: false,
    defer_v1: true,
  },
  custom_text: {
    key: 'custom_text',
    label: 'Custom Text',
    supports_heading_override: true,
    supports_modes: ['custom_text'],
    supports_field_toggles: false,
    supports_subsections: false,
    repeatable: true,
  },
};

// ── Default Section Order (matches INSPEKTiT master) ──

export const DEFAULT_SECTION_ORDER: readonly SectionKey[] = [
  'claim_summary',
  'enclosures',
  'assignment',
  'cause_of_loss',
  'risk_description',
  'mortgage',
  'initial_inspection',
  'coverage_a',
  'coverage_b',
  'coverage_c',
  'contractors',
  'conclusion',
  'certification',
] as const;

// ── Helpers ──

const SELECTABLE_MODE_SET = new Set<string>(['summary', 'full', 'structured', 'narrative', 'hybrid']);

export function getSection(key: string): SectionDefinition | null {
  return (SECTION_REGISTRY as Record<string, SectionDefinition>)[key] ?? null;
}

export function isValidSectionKey(key: string): key is SectionKey {
  return key in SECTION_REGISTRY;
}

export function getSelectableModes(sectionKey: string): SectionMode[] {
  const def = getSection(sectionKey);
  if (!def) return [];
  return def.supports_modes.filter((m) => SELECTABLE_MODE_SET.has(m)) as SectionMode[];
}

export function getDefaultMode(sectionKey: string): SectionMode | null {
  const modes = getSelectableModes(sectionKey);
  return modes[0] ?? null;
}

export function getActiveSectionKeys(): SectionKey[] {
  return Object.values(SECTION_REGISTRY)
    .filter((s) => !s.defer_v1)
    .map((s) => s.key as SectionKey);
}

// ── Default config builders ──

function defaultSectionConfigs(): SectionConfig[] {
  return DEFAULT_SECTION_ORDER.map<SectionConfig>((key) => {
    const def = SECTION_REGISTRY[key];
    return {
      sectionKey: key,
      enabled: true,
      headingOverride: null,
      mode: getDefaultMode(key),
      fieldToggles:
        def.supports_field_toggles && def.v1_field_toggle_scope
          ? Object.fromEntries(def.v1_field_toggle_scope.map((f) => [f, true]))
          : null,
      subsections:
        def.supports_subsections && def.subsections
          ? Object.values(def.subsections).map<SubsectionConfig>((sub) => ({
              subsectionKey: sub.key,
              enabled: true,
              headingOverride: null,
            }))
          : null,
    };
  });
}

export function defaultWorkflowDraft(): WorkflowDraft {
  const templates = Object.fromEntries(
    Object.keys(REPORT_TYPES).map((key) => [
      key,
      { enabled: true, sections: defaultSectionConfigs() } as ReportTypeConfig,
    ]),
  ) as Record<ReportType, ReportTypeConfig>;

  return {
    id: 'new',
    name: '',
    isDefault: false,
    templates,
    matching: {
      carrier: null,
      claimType: null,
      lossType: null,
      propertyType: null,
    },
  };
}
