'use server';

import { redirect, unstable_rethrow } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ActionError } from '@/lib/actions/errors';

export interface PlaceOrderLine {
  menuItemId: string;
  variantId: string | null;
  quantity: number;
  notes: string;
}

const GENERIC_FAILURE_MESSAGE = 'Something went wrong placing your order. Please try again.';

/**
 * Places an order for a table. Prices are always re-derived from the
 * database here — the client-submitted cart is used only for item ids,
 * variant ids, quantities and notes, never for price. This closes the
 * obvious tampering hole of a customer editing cart state in the browser.
 *
 * Server Actions forward a thrown Error's `message` to the client verbatim,
 * so anything unexpected (a raw Postgres/PostgREST error, say) is caught
 * and swapped for a generic message here rather than leaking internals —
 * only our own ActionError messages are meant to reach the customer.
 */
export async function placeOrder(tableNumber: number, lines: PlaceOrderLine[]) {
  try {
    await placeOrderUnsafe(tableNumber, lines);
  } catch (err) {
    unstable_rethrow(err); // let redirect() on success propagate untouched
    if (err instanceof ActionError) throw err;
    console.error('placeOrder failed:', err);
    throw new ActionError(GENERIC_FAILURE_MESSAGE);
  }
}

async function placeOrderUnsafe(tableNumber: number, lines: PlaceOrderLine[]) {
  if (lines.length === 0) throw new ActionError('Your cart is empty.');

  const supabase = await createClient();

  const { data: table, error: tableError } = await supabase
    .from('tables')
    .select('id')
    .eq('table_number', tableNumber)
    .eq('is_active', true)
    .maybeSingle();
  if (tableError) throw tableError;
  if (!table) throw new ActionError('This table is not available. Please ask a staff member.');

  const menuItemIds = [...new Set(lines.map((l) => l.menuItemId))];
  const variantIds = [...new Set(lines.map((l) => l.variantId).filter((id): id is string => !!id))];

  const { data: menuItems, error: itemsError } = await supabase
    .from('menu_items')
    .select('id, price, is_available')
    .in('id', menuItemIds);
  if (itemsError) throw itemsError;

  const { data: variants, error: variantsError } = variantIds.length
    ? await supabase.from('menu_item_variants').select('id, menu_item_id, price').in('id', variantIds)
    : { data: [], error: null };
  if (variantsError) throw variantsError;

  const itemById = new Map((menuItems ?? []).map((i) => [i.id, i]));
  const variantById = new Map((variants ?? []).map((v) => [v.id, v]));

  const orderItemsToInsert: {
    menu_item_id: string;
    variant_id: string | null;
    quantity: number;
    notes: string | null;
    price_at_order: number;
  }[] = [];

  for (const line of lines) {
    const item = itemById.get(line.menuItemId);
    if (!item || !item.is_available) {
      throw new ActionError('One of the items in your cart is no longer available. Please review your cart.');
    }
    let price = Number(item.price);
    if (line.variantId) {
      const variant = variantById.get(line.variantId);
      if (!variant || variant.menu_item_id !== line.menuItemId) {
        throw new ActionError('One of the items in your cart is no longer available. Please review your cart.');
      }
      price = Number(variant.price);
    }
    if (!Number.isInteger(line.quantity) || line.quantity <= 0 || line.quantity > 50) {
      throw new ActionError('Invalid quantity in cart.');
    }
    orderItemsToInsert.push({
      menu_item_id: line.menuItemId,
      variant_id: line.variantId,
      quantity: line.quantity,
      notes: line.notes.trim() || null,
      price_at_order: price,
    });
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({ table_id: table.id })
    .select('id')
    .single();
  if (orderError) throw orderError;

  const { error: insertItemsError } = await supabase
    .from('order_items')
    .insert(orderItemsToInsert.map((i) => ({ ...i, order_id: order.id })));
  if (insertItemsError) throw insertItemsError;

  // Empty the table's shared cart now that it's become a real order — every
  // phone still on the menu/cart screens for this table sees it clear live
  // via their cart_items realtime subscription (see CartContext).
  await supabase.from('cart_items').delete().eq('table_id', table.id);

  redirect(`/order/status?table=${tableNumber}&order=${order.id}`);
}
