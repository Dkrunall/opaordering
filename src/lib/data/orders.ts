import { createClient } from '@/lib/supabase/server';
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

// A physical table (`table_id`) is reused across completely unrelated
// dining parties over days/weeks — there's no "checkout" step in this
// schema that would let us know a party has left. So "this table's running
// total" can't just sum every order ever placed at table_number=N; that
// would silently merge in a previous customer's bill from hours or days
// earlier. Absent a real session/seating concept, we approximate "this
// dining session" as an unbroken run of orders with no gap longer than
// SESSION_GAP_MS between consecutive orders, walking back from the most
// recent order. A multi-hour idle gap is a reasonably reliable signal the
// table turned over. This is a heuristic, not a guarantee.
const SESSION_GAP_MS = 3 * 60 * 60 * 1000;

export interface TableRunningTotal {
  totalAmount: number;
  orderCount: number;
}

/** Used by the customer status screen's optional "running total" display. */
export async function getTableRunningTotal(tableNumber: number): Promise<TableRunningTotal> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('orders')
    .select('id, created_at, tables!inner(table_number), order_items(quantity, price_at_order)')
    .eq('tables.table_number', tableNumber)
    .order('created_at', { ascending: false });
  if (error) throw error;

  let totalAmount = 0;
  let orderCount = 0;
  let cursor: number | null = null;

  for (const order of data ?? []) {
    const createdAt = new Date(order.created_at).getTime();
    if (cursor !== null && cursor - createdAt > SESSION_GAP_MS) break;
    cursor = createdAt;
    orderCount += 1;
    for (const item of order.order_items ?? []) {
      totalAmount += Number(item.price_at_order) * item.quantity;
    }
  }

  return { totalAmount, orderCount };
}
