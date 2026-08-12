import { createClient } from '@/lib/supabase/server';
import { fetchOrderHistory } from '@/lib/data/orderHistory';
import { OrderHistoryList } from '@/components/admin/OrderHistoryList';

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; table?: string }>;
}) {
  const { date, table } = await searchParams;
  const tableNumber = table ? Number(table) : undefined;
  const filter = {
    date: date || undefined,
    tableNumber: tableNumber && Number.isInteger(tableNumber) && tableNumber > 0 ? tableNumber : undefined,
  };

  const supabase = await createClient();
  const orders = await fetchOrderHistory(supabase, filter);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-amber-50">Order History</h1>
        <p className="text-xs text-amber-200/60">Every table order, updated live as new ones come in</p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-2xl border border-amber-900/30 bg-[#161310] p-4 shadow-lg">
        <div>
          <label className="mb-1 block text-xs font-bold text-amber-300/80 uppercase">Date</label>
          <input
            type="date"
            name="date"
            defaultValue={date ?? ''}
            className="rounded-xl border border-amber-500/30 bg-black/60 px-3 py-1.5 text-sm text-amber-100 outline-none focus:border-amber-400"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold text-amber-300/80 uppercase">Table number</label>
          <input
            type="number"
            name="table"
            min={1}
            defaultValue={table ?? ''}
            placeholder="All tables"
            className="w-32 rounded-xl border border-amber-500/30 bg-black/60 px-3 py-1.5 text-sm text-amber-100 placeholder-amber-400/35 outline-none focus:border-amber-400"
          />
        </div>
        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-amber-400 to-amber-500 px-4 py-1.5 text-sm font-black text-black shadow-md hover:brightness-110 active:scale-95 transition-all"
        >
          Filter
        </button>
        {date || table ? (
          <a href="/admin/history" className="text-sm font-bold text-amber-300/70 underline underline-offset-2 hover:text-amber-300">
            Clear filters
          </a>
        ) : null}
      </form>

      <OrderHistoryList initialOrders={orders} filter={filter} />
    </div>
  );
}
