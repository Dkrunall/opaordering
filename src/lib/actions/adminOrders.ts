'use server';

import { createClient } from '@/lib/supabase/server';
import { ActionError } from '@/lib/actions/errors';
import { NEXT_STATUS } from '@/lib/orderStatus';
import type { OrderStatus } from '@/types/database';

/** Advances a single order item to the given status. RLS restricts this to
 *  admins. The parent order's own `status` is recomputed automatically by
 *  a DB trigger (see 0011_order_item_status.sql) — this never writes to
 *  `orders` directly. */
export async function updateOrderItemStatus(orderItemId: string, status: OrderStatus) {
  const supabase = await createClient();

  const { error } = await supabase.from('order_items').update({ status }).eq('id', orderItemId);

  if (error) {
    console.error('updateOrderItemStatus failed:', error);
    throw new ActionError('Could not update item status.');
  }
}

const STATUS_RANK: Record<OrderStatus, number> = { placed: 0, preparing: 1, ready: 2, served: 3 };

/**
 * Bulk convenience action behind the order card's single "Mark {next}"
 * button: advances every item currently sitting at the order's
 * least-advanced status to the next stage, leaving items that are already
 * further along untouched. Kept item-driven (rather than writing
 * `orders.status` directly) so it can never fight the trigger that derives
 * the order's status from its items.
 */
export async function advanceOrderItems(orderId: string) {
  const supabase = await createClient();

  const { data: items, error: fetchError } = await supabase
    .from('order_items')
    .select('status')
    .eq('order_id', orderId);
  if (fetchError) {
    console.error('advanceOrderItems failed:', fetchError);
    throw new ActionError('Could not update order status.');
  }
  if (!items || items.length === 0) return;

  const current = items.reduce<OrderStatus>(
    (min, i) => (STATUS_RANK[i.status] < STATUS_RANK[min] ? i.status : min),
    items[0].status
  );
  const next = NEXT_STATUS[current];
  if (!next) return;

  const { error } = await supabase
    .from('order_items')
    .update({ status: next })
    .eq('order_id', orderId)
    .eq('status', current);

  if (error) {
    console.error('advanceOrderItems failed:', error);
    throw new ActionError('Could not update order status.');
  }
}
