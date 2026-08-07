import { createClient } from '@/lib/supabase/server';
import type { OrderStatus } from '@/types/database';

export interface OrderHistoryItem {
  id: string;
  menuItemName: string;
  variantLabel: string | null;
  quantity: number;
  notes: string | null;
  priceAtOrder: number;
}

export interface OrderHistoryEntry {
  id: string;
  tableNumber: number;
  status: OrderStatus;
  createdAt: string;
  servedAt: string | null;
  items: OrderHistoryItem[];
  total: number;
}

export interface OrderHistoryFilter {
  /** 'YYYY-MM-DD' in the server's local date, or undefined for all dates. */
  date?: string;
  tableNumber?: number;
}

export async function getOrderHistory(filter: OrderHistoryFilter): Promise<OrderHistoryEntry[]> {
  const supabase = await createClient();

  let query = supabase
    .from('orders')
    .select(
      `id, status, created_at, served_at, tables!inner ( table_number ),
       order_items ( id, quantity, notes, price_at_order, menu_items ( name ), menu_item_variants ( label ) )`
    )
    .order('created_at', { ascending: false });

  if (filter.date) {
    const start = new Date(`${filter.date}T00:00:00.000Z`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    query = query.gte('created_at', start.toISOString()).lt('created_at', end.toISOString());
  }
  if (filter.tableNumber) {
    query = query.eq('tables.table_number', filter.tableNumber);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((o) => {
    const items: OrderHistoryItem[] = (o.order_items ?? []).map((i) => ({
      id: i.id,
      menuItemName: i.menu_items?.name ?? 'Item',
      variantLabel: i.menu_item_variants?.label ?? null,
      quantity: i.quantity,
      notes: i.notes,
      priceAtOrder: Number(i.price_at_order),
    }));
    return {
      id: o.id,
      tableNumber: o.tables.table_number,
      status: o.status,
      createdAt: o.created_at,
      servedAt: o.served_at,
      items,
      total: items.reduce((n, i) => n + i.priceAtOrder * i.quantity, 0),
    };
  });
}
