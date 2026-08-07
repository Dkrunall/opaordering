import type { DietaryType } from '@/types/database';

const DOT: Record<DietaryType, string> = {
  veg: 'bg-emerald-500 border-emerald-400',
  egg: 'bg-amber-400 border-amber-300',
  non_veg: 'bg-rose-500 border-rose-400',
  seafood: 'bg-cyan-400 border-cyan-300',
};

const LABEL: Record<DietaryType, string> = {
  veg: 'Veg',
  egg: 'Egg',
  non_veg: 'Non-Veg',
  seafood: 'Seafood',
};

/** The small square veg/non-veg style indicator used on menus. */
export function DietaryBadge({ type }: { type: DietaryType | null }) {
  if (!type) return null;
  return (
    <span
      title={LABEL[type]}
      className="inline-flex items-center gap-1.5 rounded-md border border-amber-900/30 bg-amber-950/30 px-2 py-0.5 text-[11px] font-semibold text-amber-200/80"
    >
      <span className={`h-2 w-2 shrink-0 rounded-sm border ${DOT[type]}`} />
      {LABEL[type]}
    </span>
  );
}

export function AlcoholicBadge() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-purple-500/30 bg-purple-950/30 px-2 py-0.5 text-[11px] font-semibold text-purple-300">
      <span className="h-2 w-2 shrink-0 rounded-full bg-purple-400" />
      18+ Cocktail / Alcohol
    </span>
  );
}

