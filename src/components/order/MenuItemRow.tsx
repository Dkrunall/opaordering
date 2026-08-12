'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import type { MenuItem } from '@/types/menu';
import { useCart } from '@/lib/cart/CartContext';
import { formatPrice } from '@/lib/format';
import { AlcoholicBadge, DietaryBadge } from './DietaryBadge';
import { isValidImageSrc } from '@/lib/imageUrl';
import { CheckIcon } from '@/components/icons';

export function MenuItemRow({ item, categoryName }: { item: MenuItem; categoryName: string }) {
  const { addLine } = useCart();
  const [expanded, setExpanded] = useState(false);
  // Items with variants (e.g. Peg / Bottle) get their own quantity per
  // option, keyed by variant id, so a customer can order 2 Pegs and a
  // Bottle in one tap instead of repeating the whole add flow per variant.
  // Items with no variants just use a single quantity, starting at 1.
  const [variantQuantities, setVariantQuantities] = useState<Record<string, number>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [justAdded, setJustAdded] = useState(false);
  // Guards against a double-tap firing handleAdd twice before the panel
  // collapses (the button that was tapped is otherwise still on-screen
  // for one more render) — without this a fast double-tap could add the
  // same line twice instead of once.
  const isAddingRef = useRef(false);

  const hasVariants = item.variants.length > 0;
  const priceLabel = hasVariants
    ? `From ${formatPrice(Math.min(...item.variants.map((v) => v.price)))}`
    : item.isAvailable
    ? formatPrice(item.price)
    : 'Sold out';

  function variantQty(variantId: string) {
    return variantQuantities[variantId] ?? 0;
  }

  function setVariantQty(variantId: string, qty: number) {
    setVariantQuantities((prev) => ({ ...prev, [variantId]: Math.max(0, qty) }));
  }

  const totalVariantQuantity = Object.values(variantQuantities).reduce((n, q) => n + q, 0);
  const totalVariantPrice = item.variants.reduce((sum, v) => sum + variantQty(v.id) * v.price, 0);

  function resetAndCollapse() {
    setJustAdded(true);
    setVariantQuantities({});
    setQuantity(1);
    setNotes('');
    setExpanded(false);
    setTimeout(() => setJustAdded(false), 1600);
  }

  function handleAdd() {
    if (isAddingRef.current) return;
    isAddingRef.current = true;
    setTimeout(() => {
      isAddingRef.current = false;
    }, 400);
    if (hasVariants) {
      if (totalVariantQuantity === 0) return;
      for (const v of item.variants) {
        const qty = variantQty(v.id);
        if (qty === 0) continue;
        addLine({
          menuItemId: item.id,
          menuItemName: item.name,
          categoryName,
          variantId: v.id,
          variantLabel: v.label,
          unitPrice: v.price,
          quantity: qty,
          notes,
          imageUrl: item.imageUrl,
        });
      }
    } else {
      addLine({
        menuItemId: item.id,
        menuItemName: item.name,
        categoryName,
        variantId: null,
        variantLabel: null,
        unitPrice: item.price,
        quantity,
        notes,
        imageUrl: item.imageUrl,
      });
    }
    resetAndCollapse();
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
        className="flex w-full items-center justify-between gap-2.5 sm:gap-3.5 p-3.5 sm:p-4 text-left disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
          {isValidImageSrc(item.imageUrl) ? (
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 overflow-hidden rounded-2xl border border-amber-500/30 shadow-md">
              <Image
                src={item.imageUrl}
                alt={item.name}
                fill
                sizes="(min-width: 640px) 64px, 56px"
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
            <p className="text-sm font-black text-amber-400 tracking-tight pt-0.5">{priceLabel}</p>
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
          {hasVariants ? (
            <div className="space-y-2">
              <p className="text-xs font-black text-amber-300 tracking-wider uppercase">Choose Quantity:</p>
              <div className="space-y-2">
                {item.variants.map((v) => {
                  const qty = variantQty(v.id);
                  return (
                    <div
                      key={v.id}
                      className={`flex items-center justify-between gap-3 rounded-2xl border px-3.5 py-2.5 transition-all ${
                        qty > 0 ? 'border-amber-400/50 bg-amber-500/10' : 'border-amber-900/40 bg-amber-950/10'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-amber-100">{v.label}</p>
                        <p className="text-xs font-black text-amber-400">{formatPrice(v.price)}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2.5 rounded-xl border border-amber-500/30 bg-black/60 p-1 shadow-inner">
                        <button
                          type="button"
                          onClick={() => setVariantQty(v.id, qty - 1)}
                          disabled={qty === 0}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-300 hover:bg-amber-500/20 active:scale-95 text-base font-extrabold transition-all disabled:opacity-30 disabled:hover:bg-transparent"
                          aria-label={`Decrease ${v.label} quantity`}
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-black text-amber-50">{qty}</span>
                        <button
                          type="button"
                          onClick={() => setVariantQty(v.id, qty + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-amber-300 hover:bg-amber-500/20 active:scale-95 text-base font-extrabold transition-all"
                          aria-label={`Increase ${v.label} quantity`}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
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

          {hasVariants ? (
            <button
              type="button"
              onClick={handleAdd}
              disabled={totalVariantQuantity === 0}
              className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-5 py-3 text-xs font-black text-black shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100"
            >
              <span>Add to Order</span>
              <span>·</span>
              <span>{totalVariantQuantity > 0 ? formatPrice(totalVariantPrice) : `${item.variants.length} options`}</span>
            </button>
          ) : (
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
                <span>{formatPrice(item.price * quantity)}</span>
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
