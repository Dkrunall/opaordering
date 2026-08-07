'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionError } from '@/lib/actions/errors';

const GENERIC_FAILURE_MESSAGE = 'Something went wrong. Please try again.';

async function withSafeErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ActionError) throw err;
    console.error('tables action failed:', err);
    throw new ActionError(GENERIC_FAILURE_MESSAGE);
  }
}

/** Creates `count` new tables, numbered right after the current highest table number. */
export async function bulkCreateTables(count: number) {
  return withSafeErrors(async () => {
    if (!Number.isInteger(count) || count <= 0 || count > 500) {
      throw new ActionError('Enter a number of tables between 1 and 500.');
    }
    const supabase = await createClient();

    const { data: maxRow, error: maxError } = await supabase
      .from('tables')
      .select('table_number')
      .order('table_number', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (maxError) throw maxError;

    const start = (maxRow?.table_number ?? 0) + 1;
    const rows = Array.from({ length: count }, (_, i) => ({
      table_number: start + i,
      qr_code_url: `/order?table=${start + i}`,
      is_active: true,
    }));

    const { error } = await supabase.from('tables').insert(rows);
    if (error) throw error;

    revalidatePath('/admin/tables');
  });
}

export async function setTableActive(id: string, isActive: boolean) {
  return withSafeErrors(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from('tables').update({ is_active: isActive }).eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/tables');
  });
}

export async function deleteTable(id: string) {
  return withSafeErrors(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from('tables').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/tables');
  });
}
