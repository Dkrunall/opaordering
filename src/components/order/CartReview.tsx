'use client';

import { useState, useTransition } from 'react';
import { unstable_rethrow } from 'next/navigation';
import Link from 'next/link';
import { useCart } from '@/lib/cart/CartContext';
import { formatPrice } from '@/lib/format';
import { placeOrder } from '@/lib/actions/orders';
import { primeAudio, requestNotificationPermission } from '@/lib/alerts';
import { CartIcon, PencilIcon, PlateIcon, UsersIcon, WarningIcon } from '@/components/icons';

function GuestNameEditor({ guestName, onRename }: { guestName: string; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(guestName);

  if (editing) {
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onRename(draft);
          setEditing(false);
        }}
        className="flex items-center gap-1.5"
      >
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={() => {
            onRename(draft);
            setEditing(false);
          }}
          maxLength={40}
          className="w-28 rounded-lg border border-amber-500/40 bg-black/60 px-2 py-1 text-xs font-bold text-amber-100 outline-none focus:border-amber-400"
        />
      </form>
    );
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(guestName);
        setEditing(true);
      }}
      className="flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 transition-colors"
    >
      {guestName}
      <PencilIcon className="h-3 w-3 opacity-70" />
    </button>
  );
}

export function CartReview({ tableNumber }: { tableNumber: number }) {
  const { lines, updateQuantity, removeLine, totalPrice, guestId, guestName, setGuestName } = useCart();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const guestCount = new Set(lines.map((l) => l.guestId)).size;

  function handlePlaceOrder() {
    setError(null);
    // Ask for notification permission as part of this click — a real user
    // gesture — instead of hiding it behind a separate settings toggle, so
    // customers are actually alerted when their order is ready even if
    // they've switched away from this tab. Also unlocks the Web Audio
    // context here for the same reason (see lib/alerts.ts).
    primeAudio();
    void requestNotificationPermission();
    startTransition(async () => {
      try {
        // placeOrder reads the table's cart straight from the DB itself
        // (not from `lines` here) so a line another guest added after this
        // device's last sync isn't dropped — see lib/actions/orders.ts.
        await placeOrder(tableNumber);
      } catch (err) {
        unstable_rethrow(err);
        setError(err instanceof Error && err.message ? err.message : 'Something went wrong placing your order. Please try again.');
      }
    });
  }

  if (lines.length === 0) {
    return (
      <div className="glass-panel mx-auto my-8 flex max-w-md flex-col items-center gap-4 rounded-3xl p-8 text-center border border-amber-500/30 gold-glow-sm">
        <CartIcon className="h-10 w-10 text-amber-400 animate-bounce" />
        <div className="space-y-1">
          <h2 className="text-lg font-black text-amber-50">Your Cart is Empty</h2>
          <p className="text-xs text-amber-200/70 max-w-xs mx-auto leading-relaxed">
            Browse our Opa digital menu and add your favorite dishes to place a table order.
          </p>
        </div>
        <Link
          href={`/order?table=${tableNumber}`}
          className="mt-2 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 px-6 py-2.5 text-xs font-black text-black shadow-lg hover:brightness-110 active:scale-95 transition-all"
        >
          Browse Digital Menu →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-8">
      {/* Table confirmation header banner */}
      <div className="flex items-center justify-between rounded-3xl border border-amber-500/30 bg-gradient-to-r from-[#1c1814] to-[#12100d] p-4 shadow-xl gold-glow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-300 border border-amber-500/30">
            <PlateIcon className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-xs font-black text-amber-50 uppercase tracking-wide">OPA Table Order</p>
            <p className="text-xs text-amber-200/70">Items will be served directly to Table {tableNumber}</p>
          </div>
        </div>
        <span className="rounded-full border border-amber-400/50 bg-amber-400/15 px-3.5 py-1 text-xs font-black text-amber-300 shadow-inner">
          Table {tableNumber}
        </span>
      </div>

      {/* Shared-cart identity: this is a group order — everyone at the table
          sees this same list live, so make who's who legible. */}
      <div className="flex items-center justify-between rounded-2xl border border-amber-900/30 bg-black/30 px-4 py-2.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-amber-200/70">
          <UsersIcon className="h-3.5 w-3.5" />
          {guestCount > 1 ? `${guestCount} people ordering at this table` : 'Shared table cart'}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-amber-200/70">
          <span>You&rsquo;re</span>
          <GuestNameEditor guestName={guestName} onRename={setGuestName} />
        </div>
      </div>

      {/* Cart items list */}
      <div className="space-y-3">
        {lines.map((line) => (
          <div key={line.id} className="overflow-hidden rounded-3xl border border-amber-500/25 bg-[#161310] p-4 shadow-xl transition-all hover:border-amber-500/40">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-1">
                {line.guestId !== guestId ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-amber-400/80">
                    <UsersIcon className="h-3 w-3" />
                    Added by {line.guestName}
                  </span>
                ) : null}
                <p className="font-black text-amber-50 text-base">{line.menuItemName}</p>
                {line.variantLabel ? (
                  <span className="inline-block rounded-xl bg-amber-500/15 border border-amber-500/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                    {line.variantLabel}
                  </span>
                ) : null}
                {line.notes ? (
                  <p className="text-xs text-amber-200/70 italic bg-black/40 p-2.5 rounded-xl border border-amber-900/30">
                    &ldquo;{line.notes}&rdquo;
                  </p>
                ) : null}
              </div>
              <p className="shrink-0 font-black text-amber-400 text-base">
                {formatPrice(line.unitPrice * line.quantity)}
              </p>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-amber-900/30 pt-3">
              <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-black/60 p-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => updateQuantity(line.id, line.quantity - 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-xl text-amber-300 hover:bg-amber-500/20 text-sm font-black transition-colors"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-5 text-center text-xs font-black text-amber-50">{line.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(line.id, line.quantity + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-xl text-amber-300 hover:bg-amber-500/20 text-sm font-black transition-colors"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => removeLine(line.id)}
                className="text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors py-1 px-3 rounded-xl hover:bg-rose-500/10"
              >
                Remove Item
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bill breakdown summary */}
      <div className="rounded-3xl border border-amber-500/30 bg-[#161310] p-5 space-y-3 shadow-xl">
        <div className="flex items-center justify-between text-xs text-amber-200/80">
          <span>Subtotal ({lines.reduce((acc, l) => acc + l.quantity, 0)} items)</span>
          <span className="font-bold text-amber-100">{formatPrice(totalPrice)}</span>
        </div>
        <div className="flex items-center justify-between text-xs text-amber-200/80">
          <span>Taxes &amp; Service Charge</span>
          <span className="font-bold text-amber-100">Included</span>
        </div>
        <div className="h-[1px] bg-amber-900/40 my-1" />
        <div className="flex items-center justify-between text-base font-black text-amber-50 pt-1">
          <span>Total Payable</span>
          <span className="text-amber-400 text-xl font-black">{formatPrice(totalPrice)}</span>
        </div>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-950/60 p-4 text-xs font-bold text-rose-300 shadow-xl">
          <WarningIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      <button
        type="button"
        onClick={handlePlaceOrder}
        disabled={isPending}
        className="w-full rounded-3xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-4 text-center font-black text-black shadow-2xl shadow-amber-500/30 transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60 text-base flex items-center justify-center gap-2 gold-glow"
      >
        {isPending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 rounded-full border-2 border-black border-t-transparent animate-spin" />
            Sending Order to Kitchen...
          </span>
        ) : (
          <>
            <span>Send Order to Kitchen</span>
            <span>·</span>
            <span>{formatPrice(totalPrice)}</span>
          </>
        )}
      </button>
    </div>
  );
}


