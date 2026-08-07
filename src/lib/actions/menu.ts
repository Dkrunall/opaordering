'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { ActionError } from '@/lib/actions/errors';
import type { DietaryType } from '@/types/database';

const GENERIC_FAILURE_MESSAGE = 'Something went wrong saving your changes. Please try again.';

async function withSafeErrors<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ActionError) throw err;
    console.error('menu action failed:', err);
    throw new ActionError(GENERIC_FAILURE_MESSAGE);
  }
}

// ── Categories ───────────────────────────────────────────────────────────

export interface CategoryInput {
  name: string;
  section: string;
  sortOrder: number;
  imageUrl: string;
}

export async function createCategory(input: CategoryInput) {
  return withSafeErrors(async () => {
    if (!input.name.trim() || !input.section.trim()) throw new ActionError('Name and section are required.');
    const supabase = await createClient();
    const { error } = await supabase.from('categories').insert({
      name: input.name.trim(),
      section: input.section.trim(),
      sort_order: input.sortOrder,
      image_url: input.imageUrl.trim() || null,
    });
    if (error) throw error;
    revalidatePath('/admin/menu');
    revalidatePath('/order');
  });
}

export async function updateCategory(id: string, input: CategoryInput) {
  return withSafeErrors(async () => {
    if (!input.name.trim() || !input.section.trim()) throw new ActionError('Name and section are required.');
    const supabase = await createClient();
    const { error } = await supabase
      .from('categories')
      .update({
        name: input.name.trim(),
        section: input.section.trim(),
        sort_order: input.sortOrder,
        image_url: input.imageUrl.trim() || null,
      })
      .eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/menu');
    revalidatePath('/order');
  });
}

export async function deleteCategory(id: string) {
  return withSafeErrors(async () => {
    const supabase = await createClient();
    // Cascades to menu_items -> menu_item_variants (on delete cascade).
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/menu');
    revalidatePath('/order');
  });
}

// ── Menu items ───────────────────────────────────────────────────────────

export interface MenuItemVariantInput {
  label: string;
  price: number;
}

export interface MenuItemInput {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  dietaryType: DietaryType | null;
  isAlcoholic: boolean;
  isAvailable: boolean;
  sortOrder: number;
  variants: MenuItemVariantInput[];
}

function validateMenuItemInput(input: MenuItemInput) {
  if (!input.name.trim()) throw new ActionError('Item name is required.');
  if (!Number.isFinite(input.price) || input.price < 0) throw new ActionError('Price must be a non-negative number.');
  for (const v of input.variants) {
    if (!v.label.trim()) throw new ActionError('Every variant needs a label.');
    if (!Number.isFinite(v.price) || v.price < 0) throw new ActionError('Every variant needs a valid price.');
  }
}

export async function createMenuItem(input: MenuItemInput) {
  return withSafeErrors(async () => {
    validateMenuItemInput(input);
    const supabase = await createClient();

    const { data: item, error } = await supabase
      .from('menu_items')
      .insert({
        category_id: input.categoryId,
        name: input.name.trim(),
        description: input.description.trim() || null,
        price: input.price,
        image_url: input.imageUrl.trim() || null,
        dietary_type: input.dietaryType,
        is_alcoholic: input.isAlcoholic,
        is_available: input.isAvailable,
        sort_order: input.sortOrder,
      })
      .select('id')
      .single();
    if (error) throw error;

    if (input.variants.length > 0) {
      const { error: variantsError } = await supabase.from('menu_item_variants').insert(
        input.variants.map((v, i) => ({
          menu_item_id: item.id,
          label: v.label.trim(),
          price: v.price,
          sort_order: i,
        }))
      );
      if (variantsError) throw variantsError;
    }

    revalidatePath('/admin/menu');
    revalidatePath('/order');
  });
}

export async function updateMenuItem(id: string, input: MenuItemInput) {
  return withSafeErrors(async () => {
    validateMenuItemInput(input);
    const supabase = await createClient();

    const { error } = await supabase
      .from('menu_items')
      .update({
        category_id: input.categoryId,
        name: input.name.trim(),
        description: input.description.trim() || null,
        price: input.price,
        image_url: input.imageUrl.trim() || null,
        dietary_type: input.dietaryType,
        is_alcoholic: input.isAlcoholic,
        is_available: input.isAvailable,
        sort_order: input.sortOrder,
      })
      .eq('id', id);
    if (error) throw error;

    // Replace-all is simplest and safe here: variants have no independent
    // identity customers reference elsewhere (order_items snapshots the
    // price at order time), so there's nothing to preserve across an edit.
    const { error: deleteError } = await supabase.from('menu_item_variants').delete().eq('menu_item_id', id);
    if (deleteError) throw deleteError;

    if (input.variants.length > 0) {
      const { error: insertError } = await supabase.from('menu_item_variants').insert(
        input.variants.map((v, i) => ({
          menu_item_id: id,
          label: v.label.trim(),
          price: v.price,
          sort_order: i,
        }))
      );
      if (insertError) throw insertError;
    }

    revalidatePath('/admin/menu');
    revalidatePath('/order');
  });
}

export async function deleteMenuItem(id: string) {
  return withSafeErrors(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from('menu_items').delete().eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/menu');
    revalidatePath('/order');
  });
}

export async function setMenuItemAvailability(id: string, isAvailable: boolean) {
  return withSafeErrors(async () => {
    const supabase = await createClient();
    const { error } = await supabase.from('menu_items').update({ is_available: isAvailable }).eq('id', id);
    if (error) throw error;
    revalidatePath('/admin/menu');
    revalidatePath('/order');
  });
}
