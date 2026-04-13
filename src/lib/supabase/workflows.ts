import { createClient } from '@/lib/supabase/server';
import { REPORT_TYPES, defaultWorkflowDraft } from '@/lib/constants/workflowRegistry';
import type { WorkflowDraft, ReportType, ReportTypeConfig, SectionConfig, SubsectionConfig, MatchingRuleShell, SectionMode } from '@/lib/types/workflow';

export interface WorkflowRow {
  id: string;
  firmId: string;
  name: string;
  isDefault: boolean;
  updatedAt: string;
  reportTypeCount: number;
}

interface RawWorkflowRow {
  id: string;
  firm_id: string;
  name: string;
  is_default: boolean;
  updated_at: string;
  templates: Record<string, { enabled?: boolean }> | null;
}

const REPORT_TYPE_KEYS = Object.keys(REPORT_TYPES) as string[];

function deriveReportTypeCount(templates: RawWorkflowRow['templates']): number {
  if (!templates || typeof templates !== 'object') return 0;
  return REPORT_TYPE_KEYS.filter((key) => templates[key]?.enabled !== false).length;
}

export async function createWorkflow(firmId: string): Promise<string> {
  const draft = defaultWorkflowDraft();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workflows')
    .insert({
      firm_id: firmId,
      name: 'New Workflow',
      is_default: false,
      templates: draft.templates,
      matching: draft.matching,
    })
    .select('id')
    .single<{ id: string }>();

  if (error || !data) {
    throw new Error(`createWorkflow error: ${error?.message ?? 'unknown'}`);
  }

  return data.id;
}

export async function getWorkflows(firmId: string): Promise<WorkflowRow[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workflows')
    .select('id, firm_id, name, is_default, updated_at, templates')
    .eq('firm_id', firmId)
    .order('is_default', { ascending: false })
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`getWorkflows error: ${error.message}`);
  }

  return ((data ?? []) as RawWorkflowRow[]).map((row) => ({
    id: row.id,
    firmId: row.firm_id,
    name: row.name,
    isDefault: row.is_default,
    updatedAt: new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(
      new Date(row.updated_at),
    ),
    reportTypeCount: deriveReportTypeCount(row.templates),
  }));
}

// ── Raw shape coming out of Supabase for the full workflow row ───────────────

interface RawFullWorkflowRow {
  id: string;
  firm_id: string;
  name: string;
  is_default: boolean;
  templates: unknown;
  matching: unknown;
}

// ── Coercers — accept unknown JSONB, fall back to safe defaults ──────────────

const VALID_MODES = new Set<string>(['summary', 'full', 'structured', 'narrative', 'hybrid']);

function coerceSubsection(raw: unknown): SubsectionConfig {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    subsectionKey: typeof r.subsectionKey === 'string' ? r.subsectionKey : '',
    enabled: r.enabled !== false,
    headingOverride: typeof r.headingOverride === 'string' ? r.headingOverride : null,
  };
}

function coerceSection(raw: unknown): SectionConfig {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    sectionKey: typeof r.sectionKey === 'string' ? r.sectionKey : '',
    enabled: r.enabled !== false,
    headingOverride: typeof r.headingOverride === 'string' ? r.headingOverride : null,
    mode: typeof r.mode === 'string' && VALID_MODES.has(r.mode) ? (r.mode as SectionMode) : null,
    fieldToggles:
      r.fieldToggles && typeof r.fieldToggles === 'object' && !Array.isArray(r.fieldToggles)
        ? (r.fieldToggles as Record<string, boolean>)
        : null,
    subsections: Array.isArray(r.subsections) ? r.subsections.map(coerceSubsection) : null,
  };
}

function coerceReportTypeConfig(raw: unknown, fallback: ReportTypeConfig): ReportTypeConfig {
  if (!raw || typeof raw !== 'object') return fallback;
  const r = raw as Record<string, unknown>;
  return {
    enabled: r.enabled !== false,
    sections: Array.isArray(r.sections) ? r.sections.map(coerceSection) : fallback.sections,
  };
}

function coerceTemplates(raw: unknown, fallback: Record<ReportType, ReportTypeConfig>): Record<ReportType, ReportTypeConfig> {
  const r = raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as Record<string, unknown>) : {};
  return Object.fromEntries(
    REPORT_TYPE_KEYS.map((key) => [key, coerceReportTypeConfig(r[key], fallback[key as ReportType])]),
  ) as Record<ReportType, ReportTypeConfig>;
}

function coerceMatching(raw: unknown): MatchingRuleShell {
  const r = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    carrier: typeof r.carrier === 'string' ? r.carrier : null,
    claimType: typeof r.claimType === 'string' ? r.claimType : null,
    lossType: typeof r.lossType === 'string' ? r.lossType : null,
    propertyType: typeof r.propertyType === 'string' ? r.propertyType : null,
  };
}

function mapRowToDraft(row: RawFullWorkflowRow): WorkflowDraft {
  const fallback = defaultWorkflowDraft();
  return {
    id: row.id,
    name: row.name,
    isDefault: row.is_default,
    templates: coerceTemplates(row.templates, fallback.templates),
    matching: coerceMatching(row.matching),
  };
}

export async function getWorkflowById(id: string, firmId: string): Promise<WorkflowDraft | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('workflows')
    .select('id, firm_id, name, is_default, templates, matching')
    .eq('id', id)
    .eq('firm_id', firmId)
    .maybeSingle<RawFullWorkflowRow>();

  if (error) {
    throw new Error(`getWorkflowById error: ${error.message}`);
  }
  if (!data) return null;

  return mapRowToDraft(data);
}
