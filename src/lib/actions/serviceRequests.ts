'use server';

import { createClient } from '@/lib/supabase/server';
import { ActionError } from '@/lib/actions/errors';
import type { ServiceRequestType } from '@/types/database';

/**
 * Raises a "Call Waiter" / "Request Bill" flag for a table. Idempotent: if
 * this table already has a pending request of the same type, this is a
 * no-op rather than stacking duplicates — every guest's device already
 * reflects the pending state live via the service_requests Realtime
 * subscription (see ServiceRequestButtons.tsx), so there's nothing gained
 * by inserting a second row.
 */
export async function createServiceRequest(tableNumber: number, type: ServiceRequestType) {
  const supabase = await createClient();

  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('id')
    .eq('table_number', tableNumber)
    .eq('is_active', true)
    .maybeSingle();
  if (tableError) throw tableError;
  if (!table) throw new ActionError('This table is not available. Please ask a staff member.');

  const { data: existing, error: existingError } = await supabase
    .from('service_requests')
    .select('id')
    .eq('table_id', table.id)
    .eq('type', type)
    .eq('status', 'pending')
    .maybeSingle();
  if (existingError) throw existingError;
  if (existing) return;

  const { error: insertError } = await supabase.from('service_requests').insert({ table_id: table.id, type });
  if (insertError) throw insertError;
}

/** Marks a request as handled. RLS restricts this to admins. */
export async function acknowledgeServiceRequest(id: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('service_requests')
    .update({ status: 'acknowledged', acknowledged_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('acknowledgeServiceRequest failed:', error);
    throw new ActionError('Could not update the request.');
  }
}
