'use client';

import Image from 'next/image';
import type { MenuSection } from '@/types/menu';
import {
  BottleIcon,
  CakeSliceIcon,
  CocktailIcon,
  CoffeeCupIcon,
  CupStrawIcon,
  ForkKnifeIcon,
  MocktailIcon,
  PlateIcon,
} from '@/components/icons';
import { isValidImageSrc } from '@/lib/imageUrl';
import type { ComponentType, SVGProps } from 'react';

const SECTION_ICON: Record<string, ComponentType<SVGProps<SVGSVGElement>>> = {
  Food: ForkKnifeIcon,
  Bar: BottleIcon,
  'Signature Cocktails': CocktailIcon,
  'Signature Mocktails': MocktailIcon,
  Barista: CoffeeCupIcon,
  Beverages: CupStrawIcon,
  Desserts: CakeSliceIcon,
};

/** First available photo within a section, for the card background —
 *  prefers a category's own representative photo over an individual
 *  dish/drink's, since most items don't have one but many categories do. */
function representativeImage(section: MenuSection): string | null {
  for (const cat of section.categories) {
    if (isValidImageSrc(cat.imageUrl)) return cat.imageUrl;
  }
  for (const cat of section.categories) {
    for (const item of cat.items) {
      if (isValidImageSrc(item.imageUrl)) return item.imageUrl;
    }
  }
  return null;
}

function totalItemCount(section: MenuSection): number {
  return section.categories.reduce((n, cat) => n + cat.items.length, 0);
}

/**
 * Horizontal strip of full-bleed photo cards, one per main category —
 * mirrors a restaurant app's "browse by category" hero row: a real dish
 * photo fills the card, with the category name overlaid at the bottom.
 * Tapping one drills into that category's subcategories.
 */
export function MainCategoryCards({
  sections,
  onSelect,
}: {
  sections: MenuSection[];
  onSelect: (section: string) => void;
}) {
  return (
    <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 pl-4 pr-4 -mx-4 snap-x snap-mandatory">
      {sections.map((section) => {
        const image = representativeImage(section);
        const itemCount = totalItemCount(section);
        const SectionIcon = SECTION_ICON[section.section] ?? PlateIcon;
        return (
          <button
            key={section.section}
            type="button"
            onClick={() => onSelect(section.section)}
            className="group relative h-64 w-44 shrink-0 snap-start overflow-hidden rounded-3xl border border-amber-400/35 bg-[#12100e] shadow-2xl transition-all duration-500 hover:border-amber-400 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.97] gold-glow-sm"
          >
            {image ? (
              <Image
                src={image}
                alt={section.section}
                fill
                sizes="176px"
                className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-110"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-950 via-neutral-900 to-black">
                <SectionIcon className="h-12 w-12 text-amber-400/70" />
              </div>
            )}

            {/* Dark vignette so the label stays legible over any photo */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-transparent transition-opacity group-hover:opacity-85" />

            {/* Ambient gold glow accent on hover */}
            <div className="pointer-events-none absolute -bottom-10 left-1/2 h-32 w-32 -translate-x-1/2 rounded-full bg-amber-500/20 blur-2xl transition-all duration-500 group-hover:bg-amber-400/40" />

            {/* Frosted glass label bar */}
            <div className="relative z-10 flex h-full flex-col justify-end">
              <div className="space-y-1 border-t border-white/10 bg-gradient-to-t from-black via-black/90 to-black/40 px-3 py-3.5 backdrop-blur-md">
                <h3 className="truncate text-center text-sm font-black uppercase leading-tight tracking-wider text-amber-50 drop-shadow-lg transition-colors group-hover:text-amber-300">
                  {section.section}
                </h3>
                <p className="flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-400/90">
                  <span>{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</span>
                  <span className="text-amber-300 transition-transform group-hover:translate-x-1">→</span>
                </p>
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
