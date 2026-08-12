import { createClient } from '@/lib/supabase/server';
import { groupIntoSittings } from '@/lib/sittings';
import type { OrderStatus } from '@/types/database';

export interface OrderItemView {
  id: string;
  menuItemName: string;
  variantLabel: string | null;
  quantity: number;
  notes: string | null;
  priceAtOrder: number;
}

export interface OrderView {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  createdAt: string;
  servedAt: string | null;
  items: OrderItemView[];
}

/** Used by the customer status screen — looked up by order id + table number together
 *  so a stray/guessed order id for the wrong table doesn't resolve. */
export async function getOrderForTable(orderId: string, tableNumber: number): Promise<OrderView | null> {
  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('id, status, created_at, served_at, tables!inner(table_number)')
    .eq('id', orderId)
    .eq('tables.table_number', tableNumber)
    .maybeSingle();
  if (orderError) throw orderError;
  if (!order) return null;

  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('id, quantity, notes, price_at_order, menu_items(name), menu_item_variants(label)')
    .eq('order_id', orderId);
  if (itemsError) throw itemsError;

  return {
    id: order.id,
    tableNumber: order.tables.table_number,
    status: order.status,
    createdAt: order.created_at,
    servedAt: order.served_at,
    items: (items ?? []).map((i) => ({
      id: i.id,
      menuItemName: i.menu_items?.name ?? 'Item',
      variantLabel: i.menu_item_variants?.label ?? null,
      quantity: i.quantity,
      notes: i.notes,
      priceAtOrder: Number(i.price_at_order),
    })),
  };
}

export interface TableRunningTotal {
  totalAmount: number;
  orderCount: number;
}

/** Used by the customer status screen's optional "running total" display —
 *  scoped to the table's current sitting only (see lib/sittings.ts), not
 *  every order ever placed at this table number. */
export async function getTableRunningTotal(tableNumber: number): Promise<TableRunningTotal> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, tables!inner(table_number), order_items(quantity, price_at_order)')
    .eq('tables.table_number', tableNumber);
  if (error) throw error;

  const sittings = groupIntoSittings(data ?? [], (o) => new Date(o.created_at).getTime());
  const currentSitting = sittings[sittings.length - 1] ?? [];

  let totalAmount = 0;
  for (const order of currentSitting) {
    for (const item of order.order_items ?? []) {
      totalAmount += Number(item.price_at_order) * item.quantity;
    }
  }

  return { totalAmount, orderCount: currentSitting.length };
}
