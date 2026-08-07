'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { MenuItem, MenuSection } from '@/types/menu';
import { OrderFrame, OrderHeader } from './OrderShell';
import { MenuItemRow } from './MenuItemRow';
import { HeroVideoHeader } from './HeroVideoHeader';
import { MainCategoryCards } from './MainCategoryCards';
import { SubcategoryRail } from './SubcategoryRail';
import { VegDietFilter } from './VegDietFilter';
import { DEFAULT_LABEL_FILTERS, LabelFilterModal, isLabelFilterActive, type LabelFilters } from './LabelFilterModal';
import type { DietFilter } from './dietFilter';
import { CloseIcon, PlateIcon, SearchIcon } from '@/components/icons';

function CategoryCard({ cat, onClick }: { cat: MenuSection['categories'][number]; onClick: () => void }) {
  const coverImage = cat.imageUrl || cat.items[0]?.imageUrl || '/opa-logo.jpg';

  return (
    <button
      type="button"
      onClick={onClick}
      className="group relative overflow-hidden rounded-3xl border border-amber-400/35 bg-[#12100e] shadow-2xl transition-all duration-500 hover:border-amber-400 hover:shadow-amber-500/30 hover:scale-[1.02] active:scale-[0.98] h-64 sm:h-72 w-full flex flex-col justify-end text-center gold-glow-sm"
    >
      {coverImage ? (
        <Image
          src={coverImage}
          alt={cat.name}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-90"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-amber-950 via-neutral-900 to-black">
          <PlateIcon className="h-10 w-10 text-amber-400/70" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent transition-opacity group-hover:opacity-85" />
      <div className="pointer-events-none absolute -bottom-10 left-1/2 -translate-x-1/2 h-32 w-32 rounded-full bg-amber-500/20 blur-2xl group-hover:bg-amber-400/40 transition-all duration-500" />
      <div className="relative z-10 w-full bg-gradient-to-t from-black via-black/90 to-black/40 backdrop-blur-md px-3 py-3.5 border-t border-white/10 space-y-1">
        <h3 className="font-black text-amber-50 text-xs sm:text-sm tracking-wider uppercase drop-shadow-lg group-hover:text-amber-300 transition-colors leading-tight truncate">
          {cat.name}
        </h3>
        <p className="text-[10px] font-black text-amber-400/90 tracking-widest uppercase flex items-center justify-center gap-1">
          <span>{cat.items.length} {cat.items.length === 1 ? 'Dish' : 'Dishes'}</span>
          <span className="text-amber-300 transition-transform group-hover:translate-x-1">→</span>
        </p>
      </div>
    </button>
  );
}

function itemMatchesFilter(item: MenuItem, filter: DietFilter): boolean {
  if (filter === 'all') return true;
  if (item.dietaryType === null) return true;
  if (filter === 'veg') return item.dietaryType === 'veg';
  return item.dietaryType === 'non_veg' || item.dietaryType === 'egg' || item.dietaryType === 'seafood';
}

function itemMatchesLabelFilters(item: MenuItem, filters: LabelFilters): boolean {
  if (filters.nonVegOnly && !(item.dietaryType === 'non_veg' || item.dietaryType === 'egg' || item.dietaryType === 'seafood')) {
    return false;
  }
  if (filters.nonAlcoholicOnly && item.isAlcoholic) return false;
  if (filters.excludedAllergens.length > 0 && item.allergens.some((a) => filters.excludedAllergens.includes(a))) {
    return false;
  }
  return true;
}

export function MenuBrowser({
  tableNumber,
  sections,
}: {
  tableNumber: number;
  sections: MenuSection[];
}) {
  // Two screens: main-category picker, and a section screen (subcategory
  // rail + that subcategory's items shown side by side, mirroring Zillout).
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  // The rail's explicit selection, if any — falls back to the section's
  // first subcategory (see activeCategory below) whenever this doesn't
  // match one still showing items, so switching sections/filters never
  // leaves the rail with nothing selected.
  const [explicitCategoryId, setExplicitCategoryId] = useState<string | null>(null);
  const [dietFilter, setDietFilter] = useState<DietFilter>('all');
  const [labelFilters, setLabelFilters] = useState<LabelFilters>(DEFAULT_LABEL_FILTERS);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [serviceMessage, setServiceMessage] = useState<string | null>(null);

  const baseFilteredSections = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return sections
      .map((section) => ({
        section: section.section,
        categories: section.categories
          .map((cat) => ({
            ...cat,
            items: cat.items.filter((item) => {
              const matchesDiet = itemMatchesFilter(item, dietFilter);
              const matchesLabels = itemMatchesLabelFilters(item, labelFilters);
              const matchesQuery = query === '' || item.name.toLowerCase().includes(query) || (item.description && item.description.toLowerCase().includes(query));
              return matchesDiet && matchesLabels && matchesQuery;
            }),
          }))
          .filter((cat) => cat.items.length > 0),
      }))
      .filter((section) => section.categories.length > 0);
  }, [sections, dietFilter, labelFilters, searchQuery]);

  // The section screen keeps every subcategory in its rail even when a
  // filter leaves some (or all) of them with zero matching items — unlike
  // the top-level picker and search results, which drop empty entries.
  // Otherwise applying a filter that empties the active category (e.g.
  // "Non Alcoholic Only" inside a section that's 100% alcoholic) would
  // make the section itself vanish from baseFilteredSections and silently
  // bounce the customer back to the picker with no explanation.
  const currentSection = useMemo(() => {
    const raw = sections.find((s) => s.section === selectedSection);
    if (!raw) return null;
    const query = searchQuery.trim().toLowerCase();
    return {
      section: raw.section,
      categories: raw.categories.map((cat) => ({
        ...cat,
        items: cat.items.filter((item) => {
          const matchesDiet = itemMatchesFilter(item, dietFilter);
          const matchesLabels = itemMatchesLabelFilters(item, labelFilters);
          const matchesQuery = query === '' || item.name.toLowerCase().includes(query) || (item.description && item.description.toLowerCase().includes(query));
          return matchesDiet && matchesLabels && matchesQuery;
        }),
      })),
    };
  }, [sections, selectedSection, dietFilter, labelFilters, searchQuery]);

  const activeCategory = useMemo(() => {
    if (!currentSection) return null;
    const explicit = currentSection.categories.find((c) => c.id === explicitCategoryId);
    return explicit ?? currentSection.categories[0] ?? null;
  }, [currentSection, explicitCategoryId]);

  function openSection(section: string, categoryId?: string) {
    setSelectedSection(section);
    setExplicitCategoryId(categoryId ?? null);
  }

  function handleServiceRequest(type: string) {
    setServiceMessage(`Requested ${type} for Table ${tableNumber}. Staff notified!`);
    setTimeout(() => {
      setServiceMessage(null);
    }, 4000);
  }

  const isSearching = searchQuery.trim().length > 0;

  // ── Section screen: subcategory rail + active subcategory's items ─────
  if (currentSection && !isSearching) {
    return (
      <OrderFrame tableNumber={tableNumber}>
        <OrderHeader tableNumber={tableNumber} title={currentSection.section} onBack={() => setSelectedSection(null)} />

        <div className="pt-3 px-4">
          <VegDietFilter
            value={dietFilter}
            onChange={setDietFilter}
            onOpenFilters={() => setIsFilterModalOpen(true)}
            filterActive={isLabelFilterActive(labelFilters)}
          />
        </div>

        <main className="flex-1 flex gap-3 px-4 pt-3 pb-6">
          <SubcategoryRail
            categories={currentSection.categories}
            activeCategoryId={activeCategory?.id ?? null}
            onSelect={setExplicitCategoryId}
          />

          <div className="min-w-0 flex-1 space-y-3">
            {!activeCategory || activeCategory.items.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-2xl border border-amber-900/30">
                <p className="text-amber-200/60 text-sm font-medium">No items match your filter.</p>
              </div>
            ) : (
              activeCategory.items.map((item) => (
                <MenuItemRow key={item.id} item={item} categoryName={activeCategory.name} />
              ))
            )}
          </div>
        </main>

        {isFilterModalOpen ? (
          <LabelFilterModal
            value={labelFilters}
            onApply={setLabelFilters}
            onClose={() => setIsFilterModalOpen(false)}
          />
        ) : null}
      </OrderFrame>
    );
  }

  // ── Top-level: pick a main category (or view search results) ───────────
  return (
    <OrderFrame tableNumber={tableNumber}>
      <HeroVideoHeader tableNumber={tableNumber}>
        <OrderHeader
          tableNumber={tableNumber}
          dietFilter={dietFilter}
          onDietFilterChange={setDietFilter}
          isSearchOpen={isSearchOpen}
          onToggleSearch={() => setIsSearchOpen((prev) => !prev)}
        />

        {isSearchOpen ? (
          <div className="mx-3 mt-1 mb-2 px-1">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search delicious dishes, starters, drinks..."
                className="w-full rounded-2xl border border-amber-400/40 bg-black/80 px-4 py-2.5 pl-10 text-xs text-amber-100 placeholder-amber-400/40 outline-none focus:border-amber-400 backdrop-blur-md shadow-2xl"
                autoFocus
              />
              <SearchIcon className="pointer-events-none absolute left-3.5 top-3 h-3.5 w-3.5 text-amber-400/60" />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500/20 text-amber-300"
                >
                  <CloseIcon className="h-2.5 w-2.5" />
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </HeroVideoHeader>

      {serviceMessage ? (
        <div className="mx-4 mt-3 rounded-2xl border border-emerald-500/40 bg-emerald-950/60 p-3.5 text-center text-xs font-extrabold text-emerald-300 shadow-xl animate-bounce">
          {serviceMessage}
        </div>
      ) : null}

      {isSearching ? (
        <>
          <div className="px-4 pt-3">
            <VegDietFilter value={dietFilter} onChange={setDietFilter} />
          </div>
          <main className="flex-1 px-4 pt-3 pb-6">
            {baseFilteredSections.length === 0 ? (
              <div className="glass-panel p-8 text-center rounded-2xl my-6 border border-amber-900/30">
                <p className="text-amber-200/60 text-sm font-medium">No items found matching &ldquo;{searchQuery}&rdquo;.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {baseFilteredSections.map((section) => (
                  <section key={section.section} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-400" />
                      <h2 className="text-xs font-extrabold tracking-widest text-amber-400/90 uppercase">
                        {section.section}
                      </h2>
                      <div className="h-[1px] flex-1 bg-gradient-to-r from-amber-900/40 to-transparent" />
                    </div>
                    <div className="grid grid-cols-2 gap-3.5">
                      {section.categories.map((cat) => (
                        <CategoryCard key={cat.id} cat={cat} onClick={() => openSection(section.section, cat.id)} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </main>
        </>
      ) : (
        <div className="px-4 pt-3 pb-6 space-y-3">
          <p className="text-[11px] font-black tracking-widest text-amber-400/80 uppercase">Browse by Category</p>
          <MainCategoryCards sections={sections} onSelect={(section) => openSection(section)} />
        </div>
      )}
    </OrderFrame>
  );
}
