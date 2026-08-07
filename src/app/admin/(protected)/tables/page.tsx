import { getAllTables } from '@/lib/data/adminTables';
import { TablesManager } from '@/components/admin/TablesManager';

export default async function AdminTablesPage() {
  const tables = await getAllTables();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Tables &amp; QR codes</h1>
        <p className="text-sm text-muted">
          Each QR code links to <code>/order?table=N</code> on whichever domain you&rsquo;re viewing this page from.
        </p>
      </div>
      <TablesManager tables={tables} />
    </div>
  );
}
