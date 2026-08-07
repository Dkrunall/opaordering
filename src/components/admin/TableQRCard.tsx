'use client';

import { useEffect, useState, useTransition } from 'react';
import QRCode from 'qrcode';
import { setTableActive, deleteTable } from '@/lib/actions/tables';
import type { AdminTable } from '@/lib/data/adminTables';

export function TableQRCard({ table }: { table: AdminTable }) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let cancelled = false;
    const url = `${window.location.origin}/order?table=${table.tableNumber}`;
    QRCode.toDataURL(url, { margin: 1, width: 240 }).then((d) => {
      if (!cancelled) setDataUrl(d);
    });
    return () => {
      cancelled = true;
    };
  }, [table.tableNumber]);

  function handleToggleActive() {
    startTransition(async () => {
      try {
        await setTableActive(table.id, !table.isActive);
      } catch (err) {
        window.alert(err instanceof Error && err.message ? err.message : 'Failed to update table.');
      }
    });
  }

  function handleDelete() {
    if (!window.confirm(`Delete Table ${table.tableNumber}? This can't be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteTable(table.id);
      } catch (err) {
        window.alert(err instanceof Error && err.message ? err.message : 'Failed to delete table.');
      }
    });
  }

  return (
    <div className={`flex flex-col items-center gap-3 rounded-2xl border p-4 shadow-lg transition-all ${
      !table.isActive
        ? 'opacity-40 border-amber-900/20 bg-black/20'
        : 'border-amber-500/20 bg-[#161310] hover:border-amber-500/40'
    }`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${table.isActive ? 'bg-emerald-400' : 'bg-rose-500'}`} />
        <p className="font-extrabold text-amber-50 text-sm">Table {table.tableNumber}</p>
      </div>

      {dataUrl ? (
        <div className="p-2 rounded-xl bg-white shadow-md border border-amber-500/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={dataUrl} alt={`QR code for table ${table.tableNumber}`} className="h-28 w-28 object-contain" />
        </div>
      ) : (
        <div className="h-28 w-28 animate-pulse rounded-xl bg-amber-950/40 border border-amber-900/30" />
      )}

      <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1 text-xs font-semibold">
        {dataUrl ? (
          <a
            href={dataUrl}
            download={`opa-table-${table.tableNumber}-qr.png`}
            className="text-amber-400 hover:text-amber-300 transition-colors"
          >
            Download
          </a>
        ) : null}
        <button
          type="button"
          onClick={handleToggleActive}
          disabled={isPending}
          className="text-amber-200/70 hover:text-amber-100 transition-colors"
        >
          {table.isActive ? 'Deactivate' : 'Activate'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-rose-400 hover:text-rose-300 transition-colors"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

