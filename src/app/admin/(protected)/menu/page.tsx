import { getMenuSections } from '@/lib/data/menu';
import { requireManagerOrRedirect } from '@/lib/actions/requireManager';
import { CategoryCard } from '@/components/admin/CategoryCard';
import { CategoryForm } from '@/components/admin/CategoryForm';

export default async function AdminMenuPage() {
  await requireManagerOrRedirect();
  const sections = await getMenuSections();
  const totalItems = sections.reduce(
    (n, s) => n + s.categories.reduce((m, c) => m + c.items.length, 0),
    0
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-bold">Menu</h1>
        <p className="text-sm text-muted">
          {sections.reduce((n, s) => n + s.categories.length, 0)} categories · {totalItems} items
        </p>
      </div>

      <div className="rounded-xl border border-card-border bg-card p-4">
        <h2 className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">Add category</h2>
        <CategoryForm />
      </div>

      {sections.map((section) => (
        <div key={section.section}>
          <h2 className="mb-3 text-sm font-bold tracking-wide text-muted uppercase">{section.section}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {section.categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                categoryId={cat.id}
                name={cat.name}
                itemCount={cat.items.length}
                imageUrl={cat.imageUrl}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
