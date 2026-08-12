'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useTransition } from 'react';
import { deleteCategory } from '@/lib/actions/menu';
import { isValidImageSrc } from '@/lib/imageUrl';
import { PlateIcon } from '@/components/icons';

export function CategoryCard({
  categoryId,
  name,
  itemCount,
  imageUrl,
}: {
  categoryId: string;
  name: string;
  itemCount: number;
  imageUrl: string | null;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    if (!window.confirm(`Delete "${name}" and all ${itemCount} item(s) in it? This can't be undone.`)) return;
    startTransition(async () => {
      try {
        await deleteCategory(categoryId);
      } catch (err) {
        window.alert(err instanceof Error && err.message ? err.message : 'Failed to delete category.');
      }
    });
  }

  return (
    <div className="group relative rounded-2xl border border-amber-500/20 bg-gradient-to-b from-[#1c1814] to-[#12100d] p-4 shadow-lg transition-all hover:border-amber-500/40">
      <Link href={`/admin/menu/${categoryId}`} className="flex items-center gap-3">
        {isValidImageSrc(imageUrl) ? (
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-amber-500/30">
            <Image src={imageUrl} alt={name} fill sizes="44px" className="object-cover" />
          </div>
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
            <PlateIcon className="h-5 w-5 text-amber-400/70" />
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate font-bold text-amber-50 group-hover:text-amber-300 transition-colors text-base">{name}</p>
          <p className="text-xs text-amber-200/60 font-medium mt-0.5">
            {itemCount} item{itemCount === 1 ? '' : 's'}
          </p>
        </div>
      </Link>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="absolute top-3 right-3 hidden text-xs font-bold text-rose-400 group-hover:block disabled:opacity-60 hover:text-rose-300 transition-colors"
      >
        Delete
      </button>
    </div>
  );
}
