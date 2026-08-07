import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { getCurrentAdmin } from '@/lib/data/admin';
import { signOut } from '@/lib/actions/auth';

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect('/admin/login');

  const navLinks = [
    { href: '/admin/dashboard', label: 'Live Dashboard' },
    ...(admin.role === 'manager'
      ? [
          { href: '/admin/menu', label: 'Menu Manager' },
          { href: '/admin/tables', label: 'Tables & QR' },
          { href: '/admin/history', label: 'Order History' },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-[#0f0d0b]">
      <header className="sticky top-0 z-30 border-b border-amber-900/30 glass-nav shadow-lg">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-4">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-500/30 shadow-md">
              <Image
                src="/opa-logo.jpg"
                alt="OPA Logo"
                fill
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[10px] font-extrabold tracking-widest text-amber-400/90 uppercase">
                OPA Bar &amp; Cafe · Admin
              </p>
              <nav className="mt-0.5 flex items-center gap-1">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="rounded-lg px-3 py-1 text-xs font-bold text-amber-100/80 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex flex-col items-end text-xs">
              <span className="font-bold text-amber-100">{admin.email}</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-amber-400">
                {admin.role}
              </span>
            </div>
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3.5 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/20 active:scale-95 transition-all"
              >
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

