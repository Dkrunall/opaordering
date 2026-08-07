import { createClient } from '@/lib/supabase/server';
import { fetchActiveOrders } from '@/lib/data/adminOrders';
import { AdminOrdersDashboard } from '@/components/admin/AdminOrdersDashboard';

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const initialOrders = await fetchActiveOrders(supabase);

  return <AdminOrdersDashboard initialOrders={initialOrders} />;
}
