'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CategoryForm } from './CategoryForm';
import type { CategoryInput } from '@/lib/actions/menu';

export function EditCategoryPanel({ categoryId, initial }: { categoryId: string; initial: CategoryInput }) {
  const [editing, setEditing] = useState(false);
  const router = useRouter();

  if (!editing) {
    return (
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{initial.name}</h1>
          <p className="text-sm text-muted">{initial.section}</p>
        </div>
        <button type="button" onClick={() => setEditing(true)} className="text-sm font-medium text-accent">
          Edit category
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-card-border bg-card p-3">
      <CategoryForm
        categoryId={categoryId}
        initial={initial}
        onDone={() => {
          setEditing(false);
          router.refresh();
        }}
      />
    </div>
  );
}
