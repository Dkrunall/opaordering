'use server';

import { createClient } from '@/lib/supabase/server';
import { ActionError } from '@/lib/actions/errors';
import type { OrderStatus } from '@/types/database';

/** Advances an order to the given status. RLS restricts this to admins. */
export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('orders')
    .update({ status, served_at: status === 'served' ? new Date().toISOString() : null })
    .eq('id', orderId);

  if (error) {
    console.error('updateOrderStatus failed:', error);
    throw new ActionError('Could not update order status.');
  }
}
