'use client';

import { useState } from 'react';
import { KNOWN_ALLERGENS } from '@/lib/allergens';
import { CheckIcon, CloseIcon } from '@/components/icons';

export interface LabelFilters {
  nonVegOnly: boolean;
  nonAlcoholicOnly: boolean;
  /** Items containing any of these allergens are hidden. */
  excludedAllergens: string[];
}

export const DEFAULT_LABEL_FILTERS: LabelFilters = {
  nonVegOnly: false,
  nonAlcoholicOnly: false,
  excludedAllergens: [],
};

export function isLabelFilterActive(f: LabelFilters): boolean {
  return f.nonVegOnly || f.nonAlcoholicOnly || f.excludedAllergens.length > 0;
}

function CheckboxRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex cursor-pointer select-none items-center gap-3 py-2.5">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
          checked ? 'border-amber-400 bg-amber-400' : 'border-amber-700/50'
        }`}
      >
        {checked ? <CheckIcon className="h-3 w-3 text-black" /> : null}
      </span>
      <span className="text-sm font-semibold text-amber-100">{label}</span>
    </label>
  );
}

export function LabelFilterModal({
  value,
  onApply,
  onClose,
}: {
  value: LabelFilters;
  onApply: (next: LabelFilters) => void;
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<LabelFilters>(value);

  function toggleAllergen(allergen: string) {
    setDraft((d) => ({
      ...d,
      excludedAllergens: d.excludedAllergens.includes(allergen)
        ? d.excludedAllergens.filter((a) => a !== allergen)
        : [...d.excludedAllergens, allergen],
    }));
  }

  const allAllergensExcluded = draft.excludedAllergens.length === KNOWN_ALLERGENS.length;

  function toggleAllAllergens() {
    setDraft((d) => ({ ...d, excludedAllergens: allAllergensExcluded ? [] : [...KNOWN_ALLERGENS] }));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-16 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-amber-500/30 bg-[#161310] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-amber-900/30 px-5 py-4">
          <h2 className="text-base font-black text-amber-50">Filter by Labels</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-7 w-7 items-center justify-center rounded-full text-amber-300 hover:bg-amber-500/10"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-2">
          <CheckboxRow
            label="Non Veg Only"
            checked={draft.nonVegOnly}
            onChange={() => setDraft((d) => ({ ...d, nonVegOnly: !d.nonVegOnly }))}
          />
          <CheckboxRow
            label="Non Alcoholic Drinks"
            checked={draft.nonAlcoholicOnly}
            onChange={() => setDraft((d) => ({ ...d, nonAlcoholicOnly: !d.nonAlcoholicOnly }))}
          />

          <div className="my-2 h-px bg-amber-900/30" />
          <p className="pb-1 text-[11px] font-bold uppercase tracking-wider text-amber-400/70">Hide items containing</p>

          <CheckboxRow label="Contains Allergens" checked={allAllergensExcluded} onChange={toggleAllAllergens} />
          {KNOWN_ALLERGENS.map((allergen) => (
            <CheckboxRow
              key={allergen}
              label={allergen}
              checked={draft.excludedAllergens.includes(allergen)}
              onChange={() => toggleAllergen(allergen)}
            />
          ))}
        </div>

        <div className="flex items-center gap-3 border-t border-amber-900/30 px-5 py-4">
          <button
            type="button"
            onClick={() => setDraft(DEFAULT_LABEL_FILTERS)}
            className="rounded-full border border-amber-900/40 px-4 py-2.5 text-xs font-bold text-amber-200/70 hover:border-amber-500/40 transition-all"
          >
            Clear All
          </button>
          <button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
            className="flex-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-2.5 text-xs font-black text-black shadow-md hover:brightness-110 active:scale-[0.98] transition-all"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
