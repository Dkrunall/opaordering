'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { MenuItem } from '@/types/menu';
import { useCart } from '@/lib/cart/CartContext';
import { formatPrice } from '@/lib/format';
import { AlcoholicBadge, DietaryBadge } from './DietaryBadge';
import { CheckIcon } from '@/components/icons';

export function MenuItemRow({ item, categoryName }: { item: MenuItem; categoryName: string }) {
  const { addLine } = useCart();
  const [expanded, setExpanded] = useState(false);
  const [variantId, setVariantId] = useState<string | null>(item.variants[0]?.id ?? null);
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [justAdded, setJustAdded] = useState(false);

  const selectedVariant = item.variants.find((v) => v.id === variantId) ?? null;
  const unitPrice = selectedVariant ? selectedVariant.price : item.price;
  const priceLabel =
    item.variants.length > 0 && !selectedVariant
      ? `From ${formatPrice(Math.min(...item.variants.map((v) => v.price)))}`
      : formatPrice(unitPrice);

  function handleAdd() {
    addLine({
      menuItemId: item.id,
      menuItemName: item.name,
      categoryName,
      variantId: selectedVariant?.id ?? null,
      variantLabel: selectedVariant?.label ?? null,
      unitPrice,
      quantity,
      notes,
      imageUrl: item.imageUrl,
    });
    setJustAdded(true);
    setQuantity(1);
    setNotes('');
    setExpanded(false);
    setTimeout(() => setJustAdded(false), 1600);
  }

  return (
    <div
      className={`overflow-hidden rounded-3xl border transition-all duration-300 ${
        expanded
          ? 'border-amber-400/60 bg-gradient-to-b from-[#211b15] to-[#161310] shadow-2xl gold-glow-sm ring-1 ring-amber-400/30'
          : 'border-amber-900/30 bg-[#161310]/95 hover:border-amber-500/40 hover:bg-[#1a1612]'
      } ${!item.isAvailable ? 'opacity-50' : ''}`}
    >
      <button
        type="button"
        disabled={!item.isAvailable}
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-3.5 p-4 text-left disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3.5 min-w-0 flex-1">
          {item.imageUrl ? (
            <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-amber-500/30 shadow-md">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                unoptimized
              />
            </div>
          ) : null}
          
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {item.dietaryType ? <DietaryBadge type={item.dietaryType} /> : null}
              {item.isAlcoholic ? <AlcoholicBadge /> : null}
            </div>
            <p className="font-black text-amber-50 text-base leading-snug tracking-tight">{item.name}</p>
            {item.description ? (
              <p className="line-clamp-2 text-xs text-amber-200/70 leading-relaxed font-medium">{item.description}</p>
            ) : null}
            <p className="text-sm font-black text-amber-400 tracking-tight pt-0.5">
              {item.isAvailable ? priceLabel : 'Sold out'}
            </p>
          </div>
        </div>

        {item.isAvailable ? (
          <span
            className={`flex shrink-0 items-center gap-1 rounded-2xl px-4 py-2 text-xs font-black transition-all shadow-md ${
              justAdded
                ? 'bg-emerald-400 text-black shadow-emerald-500/30 scale-105'
                : expanded
                ? 'border border-amber-400/50 bg-amber-500/20 text-amber-300'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 text-black hover:brightness-110 active:scale-95'
            }`}
          >
            {expanded ? 'Close' : justAdded ? (
              <>
                <CheckIcon className="h-3.5 w-3.5" />
                Added
              </>
            ) : (
              '+ Add'
            )}
          </span>
        ) : null}
      </button>

      {expanded && item.isAvailable ? (
        <div className="space-y-4 border-t border-amber-900/30 bg-black/40 p-4 animate-fadeIn">
          {item.variants.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs font-black text-amber-300 tracking-wider uppercase">Select Option:</p>
              <div className="flex flex-wrap gap-2">
                {item.variants.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVariantId(v.id)}
                    className={`rounded-2xl border px-4 py-2 text-xs font-black transition-all ${
                      variantId === v.id
                        ? 'border-amber-400 bg-amber-500 text-black shadow-md'
                        : 'border-amber-900/40 bg-amber-950/20 text-amber-200/80 hover:border-amber-500/40'
                    }`}
                  >
                    {v.label} · {formatPrice(v.price)}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-amber-300/80 uppercase">Special Instructions</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder='E.g. "Less spicy", "No onion", "Extra ice"...'
              rows={2}
              className="w-full resize-none rounded-2xl border border-amber-500/30 bg-black/60 px-4 py-2.5 text-xs text-amber-100 placeholder-amber-400/35 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all"
            />
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-black/60 p-1 shadow-inner">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-amber-300 hover:bg-amber-500/20 active:scale-95 text-base font-extrabold transition-all"
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="w-5 text-center text-sm font-black text-amber-50">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => q + 1)}
                className="flex h-8 w-8 items-center justify-center rounded-xl text-amber-300 hover:bg-amber-500/20 active:scale-95 text-base font-extrabold transition-all"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>

            <button
              type="button"
              onClick={handleAdd}
              className="flex-1 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 py-3 text-xs font-black text-black shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <span>Add to Order</span>
              <span>·</span>
              <span>{formatPrice(unitPrice * quantity)}</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}


