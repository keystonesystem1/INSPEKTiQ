export type ReportType =
  | 'initial_report'
  | 'interim_report'
  | 'final_report'
  | 'supplement_report'
  | 'inspection_only';

// Selectable modes — omit handled by enabled: false, always_on handled by required flag
export type SectionMode = 'summary' | 'full' | 'structured' | 'narrative' | 'hybrid';

export interface SubsectionConfig {
  subsectionKey: string;
  enabled: boolean;
  headingOverride: string | null;
}

export interface SectionConfig {
  sectionKey: string;
  enabled: boolean;
  headingOverride: string | null;
  mode: SectionMode | null;
  fieldToggles: Record<string, boolean> | null;
  subsections: SubsectionConfig[] | null;
}

export interface ReportTypeConfig {
  enabled: boolean;
  sections: SectionConfig[];
}

// Phase 1 shell — scoring/evaluation deferred to Phase 3
export interface MatchingRuleShell {
  carrier: string | null;
  claimType: string | null;
  lossType: string | null;
  propertyType: string | null;
}

export interface WorkflowDraft {
  id: string;
  name: string;
  isDefault: boolean;
  templates: Record<ReportType, ReportTypeConfig>;
  matching: MatchingRuleShell;
}
