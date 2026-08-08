'use client';

import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatPrice } from '@/lib/format';
import {
  getNotificationPermission,
  isNotificationSupported,
  playReadyChime,
  showBrowserNotification,
  vibrateIfSupported,
} from '@/lib/alerts';
import { BellIcon, BellOffIcon, ClipboardIcon, PotIcon, SparkleIcon } from '@/components/icons';
import { OrderFeedbackForm } from './OrderFeedbackForm';
import { ServiceRequestButtons } from './ServiceRequestButtons';
import type { OrderView, TableRunningTotal } from '@/lib/data/orders';
import type { OrderStatus } from '@/types/database';
import type { ComponentType, SVGProps } from 'react';

const STEPS: { status: OrderStatus; label: string; icon: ComponentType<SVGProps<SVGSVGElement>> }[] = [
  { status: 'placed', label: 'Order Placed', icon: ClipboardIcon },
  { status: 'preparing', label: 'Preparing', icon: PotIcon },
  { status: 'ready', label: 'Ready', icon: BellIcon },
  { status: 'served', label: 'Served', icon: SparkleIcon },
];

function StatusStepper({ status }: { status: OrderStatus }) {
  const currentIndex = STEPS.findIndex((s) => s.status === status);

  return (
    <div className="flex items-center justify-between py-2">
      {STEPS.map((step, i) => {
        const done = i <= currentIndex;
        const isCurrent = i === currentIndex;
        return (
          <div key={step.status} className="flex flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <div className={`h-[3px] flex-1 ${i === 0 ? 'invisible' : done ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-amber-900/30'}`} />
              <div
                className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border-2 transition-all shadow-xl ${
                  done
                    ? 'border-amber-400 bg-amber-500 text-black shadow-amber-500/25 font-black'
                    : 'border-amber-900/40 bg-amber-950/20 text-amber-200/40'
                } ${isCurrent ? 'ring-4 ring-amber-400/30 scale-110 gold-glow-sm' : ''}`}
              >
                {done ? <step.icon className="h-5 w-5" /> : <span className="text-base">{i + 1}</span>}
              </div>
              <div className={`h-[3px] flex-1 ${i === STEPS.length - 1 ? 'invisible' : done ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-amber-900/30'}`} />
            </div>
            <p className={`mt-3 text-[11px] font-black text-center ${done ? 'text-amber-200' : 'text-amber-200/40'}`}>
              {step.label}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function OrderStatusView({
  initialOrder,
  hasFeedback = false,
  runningTotal,
}: {
  initialOrder: OrderView;
  hasFeedback?: boolean;
  runningTotal?: TableRunningTotal;
}) {
  const [order, setOrder] = useState(initialOrder);
  const statusRef = useRef(order.status);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | 'unsupported' | null>(null);

  // Reflects whatever the customer answered at the "Send Order to Kitchen"
  // prompt (see CartReview.tsx) — this page never asks itself, it only
  // shows the resulting state.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external browser API on mount, not a derived-state cascade
    setNotificationPermission(isNotificationSupported() ? getNotificationPermission() : 'unsupported');
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`order-status-${order.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` },
        (payload) => {
          const next = payload.new as { status: OrderStatus; served_at: string | null };
          if (next.status === 'ready' && statusRef.current !== 'ready') {
            playReadyChime();
            vibrateIfSupported([200, 100, 200]);
            showBrowserNotification(
              'Your order is ready!',
              `Table ${order.tableNumber} — head to your table, staff is on the way.`
            );
          }
          statusRef.current = next.status;
          setOrder((prev) => ({ ...prev, status: next.status, servedAt: next.served_at }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id, order.tableNumber]);

  const total = order.items.reduce((n, i) => n + i.priceAtOrder * i.quantity, 0);

  return (
    <div className="space-y-6 pb-8">
      {/* Main status tracking card */}
      <div className="overflow-hidden rounded-3xl border border-amber-500/30 bg-gradient-to-b from-[#1c1814] via-[#15120f] to-[#100e0b] p-6 shadow-2xl space-y-6 gold-glow-sm">
        <div className="flex items-center justify-between border-b border-amber-900/30 pb-4">
          <div>
            <p className="text-[10px] font-black tracking-widest text-amber-400 uppercase">Live Order Tracking</p>
            <h2 className="text-lg font-black text-amber-50">Order #{order.id.slice(0, 8)}</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 rounded-full border border-amber-400/40 bg-amber-400/15 px-3.5 py-1 text-xs font-black text-amber-300 shadow-inner">
              <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              <span>Live Sync</span>
            </div>
            {notificationPermission === 'granted' ? (
              <div
                className="flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300"
                title="You'll get a notification the moment your order is ready"
              >
                <BellIcon className="h-3 w-3" />
                <span className="hidden sm:inline">Alerts On</span>
              </div>
            ) : notificationPermission === 'denied' ? (
              <div
                className="flex items-center gap-1.5 rounded-full border border-amber-900/40 bg-black/40 px-3 py-1 text-xs font-black text-amber-200/50"
                title="Notifications blocked — enable them in your browser's site settings"
              >
                <BellOffIcon className="h-3 w-3" />
                <span className="hidden sm:inline">Alerts Off</span>
              </div>
            ) : null}
          </div>
        </div>

        <StatusStepper status={order.status} />

        {notificationPermission === 'denied' ? (
          <p className="-mt-2 flex items-center gap-1.5 text-[11px] text-amber-200/50">
            <BellOffIcon className="h-3 w-3 shrink-0" />
            Notifications are blocked for this site — enable them in your browser settings to get alerted the moment your order is ready.
          </p>
        ) : null}

        <div className="rounded-2xl border border-amber-500/30 bg-black/60 p-4 text-center shadow-inner">
          {order.status === 'served' ? (
            <div className="space-y-1">
              <p className="flex items-center justify-center gap-1.5 text-base font-black text-amber-300">
                <SparkleIcon className="h-4 w-4" />
                Order Served!
              </p>
              <p className="text-xs text-amber-200/70 font-medium">Thank you for dining with Opa! Bar &amp; Cafe. Enjoy your meal!</p>
            </div>
          ) : order.status === 'ready' ? (
            <div className="space-y-1">
              <p className="flex items-center justify-center gap-1.5 text-base font-black text-amber-400 animate-pulse">
                <BellIcon className="h-4 w-4" />
                Your Order is Ready!
              </p>
              <p className="text-xs text-amber-200/70 font-medium">Our staff is serving your items to Table {order.tableNumber}.</p>
            </div>
          ) : order.status === 'preparing' ? (
            <div className="space-y-1">
              <p className="flex items-center justify-center gap-1.5 text-base font-black text-amber-200">
                <PotIcon className="h-4 w-4" />
                Kitchen is Preparing Your Order
              </p>
              <p className="text-xs text-amber-200/70 font-medium">Hang tight! Your chef-crafted order is being freshly prepared.</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="flex items-center justify-center gap-1.5 text-base font-black text-amber-200">
                <ClipboardIcon className="h-4 w-4" />
                Order Received by Kitchen
              </p>
              <p className="text-xs text-amber-200/70 font-medium">We&rsquo;ll update this screen live as your order progresses.</p>
            </div>
          )}
        </div>
      </div>

      {/* Call Waiter / Request Bill */}
      <ServiceRequestButtons tableNumber={order.tableNumber} />

      {/* Order receipt details */}
      <div className="rounded-3xl border border-amber-500/20 bg-[#161310] p-5 space-y-4 shadow-xl">
        <div className="flex items-center justify-between border-b border-amber-900/30 pb-3">
          <h3 className="text-xs font-black tracking-widest text-amber-400 uppercase">Order Summary</h3>
          <span className="text-xs text-amber-200/70 font-bold">Table {order.tableNumber}</span>
        </div>

        <div className="space-y-3">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-start justify-between gap-3 border-b border-amber-900/20 pb-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-amber-50">
                  {item.quantity} × {item.menuItemName}
                </p>
                {item.variantLabel ? (
                  <p className="text-xs text-amber-300 font-bold">{item.variantLabel}</p>
                ) : null}
                {item.notes ? (
                  <p className="text-xs text-amber-200/70 italic">&ldquo;{item.notes}&rdquo;</p>
                ) : null}
              </div>
              <p className="shrink-0 text-sm font-black text-amber-400">
                {formatPrice(item.priceAtOrder * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2 text-base font-black text-amber-50">
          <span>Total Paid / Due</span>
          <span className="text-amber-400 text-xl font-black">{formatPrice(total)}</span>
        </div>

        {runningTotal && runningTotal.orderCount > 1 ? (
          <div className="flex items-center justify-between border-t border-amber-900/30 pt-3 text-xs">
            <span className="text-amber-200/60 font-semibold">
              Table {order.tableNumber} total so far ({runningTotal.orderCount} orders)
            </span>
            <span className="font-black text-amber-200">{formatPrice(runningTotal.totalAmount)}</span>
          </div>
        ) : null}
      </div>

      {order.status === 'served' && !hasFeedback ? <OrderFeedbackForm orderId={order.id} /> : null}
    </div>
  );
}


