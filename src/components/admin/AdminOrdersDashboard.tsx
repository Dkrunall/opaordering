'use client';

import { useCallback, useEffect, useOptimistic, useRef, useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import { fetchActiveOrders, groupOrdersByTable, type AdminOrder } from '@/lib/data/adminOrders';
import { updateOrderStatus } from '@/lib/actions/adminOrders';
import { NEXT_STATUS, ORDER_STATUS_LABEL } from '@/lib/orderStatus';
import { formatPrice } from '@/lib/format';
import {
  getNotificationPermission,
  isNotificationSupported,
  playNewOrderChime,
  playStaleOrderChime,
  primeAudio,
  requestNotificationPermission,
  showBrowserNotification,
} from '@/lib/alerts';
import { BellIcon, BellOffIcon, WarningIcon } from '@/components/icons';

const STALE_THRESHOLD_MS = 8 * 60 * 1000;
const STALE_REALERT_MS = 60 * 1000;
const STALE_CHECK_INTERVAL_MS = 15 * 1000;

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m ago`;
}

const STATUS_STYLE: Record<string, string> = {
  placed: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  preparing: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  ready: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
};

function OrderCard({ order, soundOn }: { order: AdminOrder; soundOn: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [localStatus, setLocalStatus] = useOptimistic(order.status);
  const nextStatus = NEXT_STATUS[localStatus];
  const total = order.items.reduce((n, i) => n + i.priceAtOrder * i.quantity, 0);

  const [now, setNow] = useState(() => Date.now());
  const lastStaleAlertRef = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), STALE_CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  const waitingMs = now - new Date(order.createdAt).getTime();
  const isStale = localStatus === 'placed' && waitingMs > STALE_THRESHOLD_MS;

  useEffect(() => {
    if (!isStale) return;
    if (now - lastStaleAlertRef.current < STALE_REALERT_MS) return;
    lastStaleAlertRef.current = now;
    if (soundOn) playStaleOrderChime();
  }, [isStale, now, soundOn]);

  function handleAdvance() {
    if (!nextStatus) return;
    startTransition(async () => {
      setLocalStatus(nextStatus);
      try {
        await updateOrderStatus(order.id, nextStatus);
      } catch {
        // localStatus reverts automatically on failure
      }
    });
  }

  return (
    <div
      className={`overflow-hidden rounded-2xl border p-4 transition-all shadow-lg ${
        isStale
          ? 'border-rose-500 bg-rose-950/20 ring-2 ring-rose-500/40 animate-pulse'
          : 'border-amber-900/30 bg-[#171411] hover:border-amber-500/30'
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <span className={`rounded-lg border px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${STATUS_STYLE[localStatus] ?? ''}`}>
          {ORDER_STATUS_LABEL[localStatus]}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-semibold text-amber-200/30">#{order.id.slice(0, 6)}</span>
          <span className={`flex items-center gap-1 text-xs font-semibold ${isStale ? 'text-rose-400' : 'text-amber-200/50'}`}>
            {isStale ? <WarningIcon className="h-3.5 w-3.5" /> : null}
            {timeAgo(order.createdAt)}
          </span>
        </div>
      </div>

      <ul className="mb-4 space-y-2 border-y border-amber-900/20 py-2.5">
        {order.items.map((item) => (
          <li key={item.id} className="text-xs">
            <div className="flex items-start justify-between">
              <span className="font-bold text-amber-50">
                <span className="text-amber-400 font-extrabold">{item.quantity}×</span> {item.menuItemName}
              </span>
              {item.variantLabel ? (
                <span className="text-[10px] font-semibold text-amber-300 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  {item.variantLabel}
                </span>
              ) : null}
            </div>
            {item.notes ? (
              <p className="mt-1 pl-3 text-[11px] text-amber-200/60 italic border-l-2 border-amber-500/40">
                &ldquo;{item.notes}&rdquo;
              </p>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between gap-2 pt-0.5">
        <span className="text-sm font-extrabold text-amber-400">{formatPrice(total)}</span>
        {nextStatus ? (
          <button
            type="button"
            onClick={handleAdvance}
            disabled={isPending}
            className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-3.5 py-1.5 text-xs font-extrabold text-black shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all"
          >
            {isPending ? 'Updating...' : `Mark ${ORDER_STATUS_LABEL[nextStatus]}`}
          </button>
        ) : null}
      </div>
    </div>
  );
}

type NotificationState = NotificationPermission | 'unsupported' | null;

function AlertsControl({ soundOn, onToggleSound }: { soundOn: boolean; onToggleSound: (on: boolean) => void }) {
  const [permission, setPermission] = useState<NotificationState>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- syncing from an external browser API on mount, not a derived-state cascade
    setPermission(isNotificationSupported() ? getNotificationPermission() : 'unsupported');
  }, []);

  async function handleEnableNotifications() {
    primeAudio();
    const result = await requestNotificationPermission();
    setPermission(result);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
      <button
        type="button"
        onClick={() => {
          primeAudio();
          onToggleSound(!soundOn);
        }}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 transition-all ${
          soundOn
            ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
            : 'border-amber-900/30 bg-black/30 text-amber-200/40'
        }`}
      >
        {soundOn ? <BellIcon className="h-3.5 w-3.5" /> : <BellOffIcon className="h-3.5 w-3.5" />}
        {soundOn ? 'Chime Alerts Enabled' : 'Chimes Muted'}
      </button>

      {permission !== null && permission !== 'unsupported' && permission !== 'granted' ? (
        <button
          type="button"
          onClick={handleEnableNotifications}
          className="rounded-xl border border-amber-500/30 bg-black/40 px-3 py-1.5 text-amber-300 hover:bg-amber-500/10 transition-colors"
        >
          Enable Desktop Alerts
        </button>
      ) : null}
      {permission === 'denied' ? (
        <span className="text-[11px] text-amber-200/50">Desktop notifications blocked in browser</span>
      ) : null}
    </div>
  );
}

export function AdminOrdersDashboard({ initialOrders }: { initialOrders: AdminOrder[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [soundOn, setSoundOn] = useState(true);
  const knownOrderIdsRef = useRef<Set<string> | null>(null);
  const soundOnRef = useRef(soundOn);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  const refetch = useCallback(async () => {
    const supabase = createClient();
    try {
      const next = await fetchActiveOrders(supabase);

      if (knownOrderIdsRef.current) {
        const newlyPlaced = next.filter((o) => o.status === 'placed' && !knownOrderIdsRef.current!.has(o.id));
        if (newlyPlaced.length > 0) {
          if (soundOnRef.current) playNewOrderChime();
          for (const order of newlyPlaced) {
            showBrowserNotification(
              `New order — Table ${order.tableNumber}`,
              order.items.map((i) => `${i.quantity}× ${i.menuItemName}`).join(', ')
            );
          }
        }
      }
      knownOrderIdsRef.current = new Set(next.map((o) => o.id));
      setOrders(next);
    } catch (err) {
      console.error('Failed to refresh orders:', err);
    }
  }, []);

  useEffect(() => {
    knownOrderIdsRef.current = new Set(initialOrders.map((o) => o.id));
  }, []);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const groups = groupOrdersByTable(orders);
  const placedCount = orders.filter((o) => o.status === 'placed').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;

  return (
    <div className="space-y-6">
      <div className="space-y-4 border-b border-amber-900/30 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-amber-50">Live Orders Board</h1>
            <p className="text-xs text-amber-200/60">Real-time table orders from the dining area</p>
          </div>
          <AlertsControl soundOn={soundOn} onToggleSound={setSoundOn} />
        </div>

        {groups.length > 0 ? (
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              {groups.length} table{groups.length === 1 ? '' : 's'} active
            </span>
            <span className="flex items-center gap-1.5 rounded-full border border-amber-900/30 bg-black/30 px-3 py-1 text-xs font-bold text-amber-200/70">
              {orders.length} order{orders.length === 1 ? '' : 's'} in progress
            </span>
            {placedCount > 0 ? (
              <span className="flex items-center gap-1.5 rounded-full border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-300">
                {placedCount} awaiting kitchen
              </span>
            ) : null}
            {readyCount > 0 ? (
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
                {readyCount} ready to serve
              </span>
            ) : null}
          </div>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <div className="glass-panel mx-auto my-12 flex max-w-md flex-col items-center gap-3 rounded-2xl p-10 text-center border border-amber-900/30">
          <BellIcon className="h-9 w-9 text-amber-400/70" />
          <h2 className="text-base font-bold text-amber-50">No Active Orders</h2>
          <p className="text-xs text-amber-200/60">
            Incoming table orders will appear here automatically with live alerts.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div key={group.tableNumber} className="rounded-3xl border border-amber-500/20 bg-gradient-to-b from-[#1c1814] to-[#12100d] p-4 space-y-3 shadow-xl transition-colors hover:border-amber-500/35">
              <div className="flex items-center justify-between border-b border-amber-900/30 pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
                  <h2 className="text-base font-black text-amber-300">
                    Table {group.tableNumber}
                  </h2>
                </div>
                <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-200">
                  {group.orders.length} order{group.orders.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="space-y-3">
                {group.orders.map((order) => (
                  <OrderCard key={order.id} order={order} soundOn={soundOn} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

