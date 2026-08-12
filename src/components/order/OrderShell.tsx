'use client';

import Link from 'next/link';
import Image from 'next/image';
import { CartProvider, useCart } from '@/lib/cart/CartContext';
import { formatPrice } from '@/lib/format';

function CartBar({ tableNumber }: { tableNumber: number }) {
  const { totalItems, totalPrice } = useCart();
  if (totalItems === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 p-3 sm:pb-4 pointer-events-none flex justify-center">
      <Link
        href={`/order/cart?table=${tableNumber}`}
        className="pointer-events-auto w-full max-w-lg flex items-center justify-between gap-2 sm:gap-4 rounded-3xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-3.5 sm:px-5 py-3.5 text-black font-extrabold shadow-2xl shadow-amber-500/30 transition-all hover:scale-[1.01] active:scale-[0.99] border border-amber-300/40 backdrop-blur-lg gold-glow"
      >
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black text-amber-300 text-xs font-black shadow-inner">
            {totalItems}
          </span>
          <div className="flex min-w-0 flex-col">
            <span className="whitespace-nowrap text-[11px] sm:text-xs font-black uppercase tracking-wide sm:tracking-wider text-black/70">
              Order Summary
            </span>
            <span className="whitespace-nowrap text-sm font-black text-black tracking-tight">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 rounded-2xl bg-black px-3 sm:px-4 py-2 text-xs font-extrabold text-amber-300 shadow-md">
          <span className="whitespace-nowrap">Review &amp; Pay</span>
          <span className="text-base">→</span>
        </div>
      </Link>
    </div>
  );
}

export function OrderHeader({
  tableNumber,
  title,
  backHref,
  onBack,
  dietFilter = 'all',
  onDietFilterChange,
  isSearchOpen,
  onToggleSearch,
}: {
  tableNumber?: number;
  title?: string;
  backHref?: string;
  onBack?: () => void;
  dietFilter?: 'all' | 'veg' | 'non_veg';
  onDietFilterChange?: (filter: 'all' | 'veg' | 'non_veg') => void;
  isSearchOpen?: boolean;
  onToggleSearch?: () => void;
}) {
  // Sub-screen mode: a title (with back navigation) was passed, so this is
  // a drilled-into screen (subcategory grid, items list, cart, status) —
  // show back + title instead of the home dashboard's icon row.
  if (title) {
    return (
      <header className="sticky top-2 z-40 mx-3 my-2 flex items-center gap-3 rounded-3xl border border-amber-400/35 bg-[#14110e]/95 px-4 py-3 backdrop-blur-2xl shadow-2xl gold-glow-sm">
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-900/40 bg-black/40 text-amber-200 hover:border-amber-500/40 transition-all"
            aria-label="Back"
          >
            <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        ) : backHref ? (
          <Link
            href={backHref}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-amber-900/40 bg-black/40 text-amber-200 hover:border-amber-500/40 transition-all"
            aria-label="Back"
          >
            <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
        ) : null}
        <h1 className="min-w-0 flex-1 truncate text-sm font-black text-amber-50">{title}</h1>
      </header>
    );
  }

  return (
    <header className="sticky top-2 z-40 mx-3 my-2 flex items-center justify-between gap-3 rounded-3xl border border-amber-400/35 bg-[#14110e]/95 px-4 py-2.5 backdrop-blur-2xl shadow-2xl gold-glow-sm">
      {/* Left side: Veg Sliding Switch Toggle */}
      <div className="flex items-center gap-2">
        {onDietFilterChange ? (
          <button
            type="button"
            onClick={() => {
              if (dietFilter === 'veg') {
                onDietFilterChange('all');
              } else {
                onDietFilterChange('veg');
              }
            }}
            className="flex items-center gap-2 cursor-pointer select-none py-1 px-1.5 rounded-full hover:bg-amber-500/10 transition-colors"
            title={dietFilter === 'veg' ? 'Showing Veg Only' : 'Show Veg Only'}
          >
            <div
              className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors duration-300 ${
                dietFilter === 'veg' ? 'bg-emerald-500' : 'bg-neutral-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-md transition-transform duration-300 ${
                  dietFilter === 'veg' ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </div>
            <span className={`text-xs font-bold ${dietFilter === 'veg' ? 'text-emerald-400 font-black' : 'text-amber-100/90'}`}>
              Veg
            </span>
          </button>
        ) : null}
      </div>

      {/* Right side: Filter Icon | Search Icon | Profile Icon */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Filter Funnel Icon */}
        {onDietFilterChange ? (
          <button
            type="button"
            onClick={() => {
              if (dietFilter === 'all') onDietFilterChange('veg');
              else if (dietFilter === 'veg') onDietFilterChange('non_veg');
              else onDietFilterChange('all');
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
              dietFilter !== 'all'
                ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                : 'border-amber-900/40 bg-black/40 text-amber-200/70 hover:border-amber-500/40'
            }`}
            title="Filter Menu"
          >
            <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
              <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
            </svg>
          </button>
        ) : null}

        {/* Search Icon */}
        {onToggleSearch ? (
          <button
            type="button"
            onClick={onToggleSearch}
            className={`flex h-8 w-8 items-center justify-center rounded-full border transition-all ${
              isSearchOpen
                ? 'border-amber-400 bg-amber-500 text-black font-bold'
                : 'border-amber-900/40 bg-black/40 text-amber-200/70 hover:border-amber-500/40'
            }`}
            title="Search Menu"
          >
            <svg className="h-4 w-4 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
              <circle cx="11" cy="11" r="7" />
              <path strokeLinecap="round" d="M20 20l-3.5-3.5" />
            </svg>
          </button>
        ) : null}

        {/* Table Badge Pill */}
        {tableNumber ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-xs font-black text-amber-300 shadow-inner gold-glow-sm">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-pulse" />
            Table {tableNumber}
          </span>
        ) : null}
      </div>
    </header>
  );
}

/** Outer frame: cart context + page scroll area + floating cart bar. No header. */
export function OrderFrame({
  tableNumber,
  showCartBar = true,
  children,
}: {
  tableNumber: number;
  showCartBar?: boolean;
  children: React.ReactNode;
}) {
  return (
    <CartProvider tableNumber={tableNumber}>
      <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col pb-24 bg-[#0d0b09]">
        {children}
        {showCartBar ? <CartBar tableNumber={tableNumber} /> : null}
      </div>
    </CartProvider>
  );
}

/** Convenience: frame + static header, for simple pages (cart, status). */
export function OrderShell({
  tableNumber,
  title,
  backHref,
  showCartBar = true,
  children,
}: {
  tableNumber: number;
  title: string;
  backHref?: string;
  showCartBar?: boolean;
  children: React.ReactNode;
}) {
  return (
    <OrderFrame tableNumber={tableNumber} showCartBar={showCartBar}>
      <OrderHeader tableNumber={tableNumber} title={title} backHref={backHref} />
      <main className="flex-1 px-4 pt-4">{children}</main>
    </OrderFrame>
  );
}


