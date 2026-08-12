'use client';

import { useState, useTransition } from 'react';
import { bulkCreateTables } from '@/lib/actions/tables';
import { downloadTableQrPdf } from '@/lib/qr/generatePdf';
import { TableQRCard } from './TableQRCard';
import type { AdminTable } from '@/lib/data/adminTables';
import { DocumentIcon, TableIcon, WarningIcon } from '@/components/icons';

export function TablesManager({ tables }: { tables: AdminTable[] }) {
  const [count, setCount] = useState(10);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  function handleBulkCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      try {
        await bulkCreateTables(count);
      } catch (err) {
        setError(err instanceof Error && err.message ? err.message : 'Failed to create tables.');
      }
    });
  }

  async function handleExportPdf() {
    setIsExportingPdf(true);
    try {
      await downloadTableQrPdf(tables.filter((t) => t.isActive).map((t) => t.tableNumber));
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-amber-500/20 bg-gradient-to-b from-[#1c1814] to-[#12100d] p-5 shadow-xl">
        <form onSubmit={handleBulkCreate} className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="mb-1.5 block text-xs font-bold text-amber-200/80 uppercase tracking-wider">
              Bulk Create Tables
            </label>
            <input
              type="number"
              min={1}
              max={500}
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-28 rounded-2xl border border-amber-500/20 bg-black/40 px-3.5 py-2 text-sm font-bold text-amber-50 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/40 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-5 py-2.5 text-xs font-extrabold text-black shadow-md shadow-amber-500/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 transition-all"
          >
            {isPending ? 'Generating...' : `+ Add ${count} Table${count === 1 ? '' : 's'}`}
          </button>
        </form>

        <button
          type="button"
          onClick={handleExportPdf}
          disabled={isExportingPdf || tables.every((t) => !t.isActive)}
          className="flex items-center gap-1.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-5 py-2.5 text-xs font-extrabold text-amber-300 hover:bg-amber-500/20 active:scale-[0.98] disabled:opacity-60 transition-all shadow-md"
        >
          {isExportingPdf ? null : <DocumentIcon className="h-3.5 w-3.5" />}
          {isExportingPdf ? 'Generating PDF Document...' : 'Download Print PDF (All Active QRs)'}
        </button>
      </div>

      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-950/40 p-3 text-xs font-medium text-rose-300">
          <WarningIcon className="h-4 w-4 shrink-0" />
          {error}
        </div>
      ) : null}

      {tables.length === 0 ? (
        <div className="glass-panel mx-auto my-12 flex max-w-md flex-col items-center gap-3 rounded-2xl p-10 text-center border border-amber-900/30">
          <TableIcon className="h-9 w-9 text-amber-400/70" />
          <h2 className="text-base font-bold text-amber-50">No Tables Configured</h2>
          <p className="text-xs text-amber-200/60">Generate dining tables above to create table QR codes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {tables.map((table) => (
            <TableQRCard key={table.id} table={table} />
          ))}
        </div>
      )}
    </div>
  );
}

