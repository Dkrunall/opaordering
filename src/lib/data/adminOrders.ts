import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database, OrderStatus } from '@/types/database';

export interface AdminOrderItem {
  id: string;
  menuItemName: string;
  variantLabel: string | null;
  quantity: number;
  notes: string | null;
  priceAtOrder: number;
}

export interface AdminOrder {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  createdAt: string;
  servedAt: string | null;
  items: AdminOrderItem[];
}

/**
 * Shared between the dashboard's initial server-side load and its
 * client-side Realtime refetches — takes either Supabase client since both
 * are typed against the same Database.
 */
export async function fetchActiveOrders(supabase: SupabaseClient<Database>): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `id, status, created_at, served_at, tables ( table_number ),
       order_items ( id, quantity, notes, price_at_order, menu_items ( name ), menu_item_variants ( label ) )`
    )
    .neq('status', 'served')
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((o) => ({
    id: o.id,
    tableNumber: o.tables.table_number,
    status: o.status,
    createdAt: o.created_at,
    servedAt: o.served_at,
    items: (o.order_items ?? []).map((i) => ({
      id: i.id,
      menuItemName: i.menu_items?.name ?? 'Item',
      variantLabel: i.menu_item_variants?.label ?? null,
      quantity: i.quantity,
      notes: i.notes,
      priceAtOrder: Number(i.price_at_order),
    })),
  }));
}

/** Groups an already time-sorted order list by table, preserving group order
 *  (i.e. tables with the longest-waiting order come first). */
export function groupOrdersByTable(orders: AdminOrder[]): { tableNumber: number; orders: AdminOrder[] }[] {
  const order: number[] = [];
  const byTable = new Map<number, AdminOrder[]>();
  for (const o of orders) {
    if (!byTable.has(o.tableNumber)) {
      byTable.set(o.tableNumber, []);
      order.push(o.tableNumber);
    }
    byTable.get(o.tableNumber)!.push(o);
  }
  return order.map((tableNumber) => ({ tableNumber, orders: byTable.get(tableNumber)! }));
}
