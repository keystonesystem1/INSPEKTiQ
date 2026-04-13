'use server';

import { createClient } from '@/lib/supabase/server';
import { getAuthenticatedFirmUser } from '@/lib/supabase/user';
import type { WorkflowDraft } from '@/lib/types/workflow';

interface SaveWorkflowPayload {
  name: string;
  isDefault: boolean;
  templates: WorkflowDraft['templates'];
  matching: WorkflowDraft['matching'];
}

export async function saveWorkflow(
  id: string,
  payload: SaveWorkflowPayload,
): Promise<{ success: true } | { success: false; error: string }> {
  const firmUser = await getAuthenticatedFirmUser();

  if (!firmUser) {
    return { success: false, error: 'Not authenticated' };
  }

  if (!['firm_admin', 'super_admin'].includes(firmUser.role)) {
    return { success: false, error: 'Insufficient permissions' };
  }

  const supabase = await createClient();

  // Clear other defaults before setting this one. The DB partial unique index
  // (workflows_one_default_per_firm) is the authoritative constraint; this unset
  // step avoids the constraint firing in the normal (non-concurrent) case.
  if (payload.isDefault) {
    const { error: unsetError } = await supabase
      .from('workflows')
      .update({ is_default: false })
      .eq('firm_id', firmUser.firmId)
      .neq('id', id);

    if (unsetError) {
      return { success: false, error: `Failed to unset previous default: ${unsetError.message}` };
    }
  }

  const { error } = await supabase
    .from('workflows')
    .update({
      name: payload.name.trim() || 'Untitled Workflow',
      is_default: payload.isDefault,
      templates: payload.templates,
      matching: payload.matching,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('firm_id', firmUser.firmId);

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Another workflow is already set as the default. Please try again.' };
    }
    return { success: false, error: error.message };
  }

  return { success: true };
}
