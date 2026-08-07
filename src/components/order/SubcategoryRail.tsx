'use client';

import Image from 'next/image';
import type { MenuSection } from '@/types/menu';
import { PlateIcon } from '@/components/icons';

/**
 * Vertical rail of subcategory thumbnails (photo + label), mirroring
 * Zillout's own category sidebar — tapping one switches the item list next
 * to it in place, no navigation to a separate screen.
 */
export function SubcategoryRail({
  categories,
  activeCategoryId,
  onSelect,
}: {
  categories: MenuSection['categories'];
  activeCategoryId: string | null;
  onSelect: (categoryId: string) => void;
}) {
  return (
    <div className="sticky top-[4.75rem] flex max-h-[calc(100vh-6rem)] w-20 shrink-0 flex-col gap-3 overflow-y-auto no-scrollbar pb-4">
      {categories.map((cat) => {
        const isActive = cat.id === activeCategoryId;
        const image = cat.imageUrl || cat.items[0]?.imageUrl;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <div
              className={`relative h-16 w-16 overflow-hidden rounded-2xl border-2 shadow-md transition-all ${
                isActive ? 'border-amber-400 shadow-amber-500/30 scale-105' : 'border-amber-900/30 opacity-80'
              }`}
            >
              {image ? (
                <Image src={image} alt={cat.name} fill sizes="64px" className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-amber-950/40">
                  <PlateIcon className="h-6 w-6 text-amber-400/70" />
                </div>
              )}
            </div>
            <span
              className={`text-center text-[10px] leading-tight line-clamp-2 ${
                isActive ? 'font-black text-amber-300' : 'font-semibold text-amber-200/60'
              }`}
            >
              {cat.name}
            </span>
          </button>
        );
      })}
    </div>
  );
}
