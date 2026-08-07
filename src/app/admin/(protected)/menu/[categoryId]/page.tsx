import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCategoryById } from '@/lib/data/menu';
import { MenuItemAdminRow } from '@/components/admin/MenuItemAdminRow';
import { AddItemPanel } from '@/components/admin/AddItemPanel';
import { EditCategoryPanel } from '@/components/admin/EditCategoryPanel';

export default async function AdminCategoryPage({
  params,
}: {
  params: Promise<{ categoryId: string }>;
}) {
  const { categoryId } = await params;
  const category = await getCategoryById(categoryId);
  if (!category) notFound();

  const nextSortOrder = category.items.length > 0 ? Math.max(...category.items.map((i) => i.sortOrder)) + 1 : 0;

  return (
    <div className="space-y-4">
      <Link href="/admin/menu" className="text-sm text-muted">
        ← All categories
      </Link>

      <EditCategoryPanel
        categoryId={category.id}
        initial={{
          name: category.name,
          section: category.section,
          sortOrder: category.sortOrder,
          imageUrl: category.imageUrl ?? '',
        }}
      />

      <div className="space-y-2">
        {category.items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">No items in this category yet.</p>
        ) : (
          category.items.map((item) => <MenuItemAdminRow key={item.id} item={item} categoryId={category.id} />)
        )}
      </div>

      <AddItemPanel categoryId={category.id} nextSortOrder={nextSortOrder} />
    </div>
  );
}
