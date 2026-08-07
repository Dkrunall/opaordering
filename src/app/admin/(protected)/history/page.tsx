import { getOrderHistory } from '@/lib/data/orderHistory';
import { OrderHistoryRow } from '@/components/admin/OrderHistoryRow';
import { formatPrice } from '@/lib/format';

export default async function AdminHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; table?: string }>;
}) {
  const { date, table } = await searchParams;
  const tableNumber = table ? Number(table) : undefined;

  const orders = await getOrderHistory({
    date: date || undefined,
    tableNumber: tableNumber && Number.isInteger(tableNumber) && tableNumber > 0 ? tableNumber : undefined,
  });

  const totalRevenue = orders.reduce((n, o) => n + o.total, 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Order history</h1>
        <p className="text-sm text-muted">
          {orders.length} order{orders.length === 1 ? '' : 's'} · {formatPrice(totalRevenue)} total
        </p>
      </div>

      <form className="flex flex-wrap items-end gap-3 rounded-xl border border-card-border bg-card p-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Date</label>
          <input
            type="date"
            name="date"
            defaultValue={date ?? ''}
            className="rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-muted">Table number</label>
          <input
            type="number"
            name="table"
            min={1}
            defaultValue={table ?? ''}
            placeholder="All tables"
            className="w-32 rounded-lg border border-card-border bg-background px-3 py-1.5 text-sm outline-none focus:border-accent"
          />
        </div>
        <button type="submit" className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-accent-foreground">
          Filter
        </button>
        {date || table ? (
          <a href="/admin/history" className="text-sm font-medium text-muted underline underline-offset-2">
            Clear filters
          </a>
        ) : null}
      </form>

      <div className="space-y-2">
        {orders.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted">No orders found for these filters.</p>
        ) : (
          orders.map((order) => <OrderHistoryRow key={order.id} order={order} />)
        )}
      </div>
    </div>
  );
}
