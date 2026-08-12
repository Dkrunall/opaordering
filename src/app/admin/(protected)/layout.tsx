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
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-amber-500/30 shadow-md">
                <Image
                  src="/opa-logo.jpg"
                  alt="OPA Logo"
                  fill
                  sizes="40px"
                  className="object-cover"
                />
              </div>
              <p className="min-w-0 truncate text-[10px] font-extrabold tracking-widest text-amber-400/90 uppercase">
                OPA Bar &amp; Cafe · Admin
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-3">
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

          {/* Own scrollable row rather than squeezed in next to the brand —
              on a phone-width screen the 4 links plus logo/title/sign-out
              never fit on one line; a horizontally-scrollable strip keeps
              every link reachable with a swipe instead of some being
              clipped off-screen (the page itself won't scroll sideways,
              see `overflow-x: hidden` on body). */}
          <nav className="-mx-4 mt-2 flex items-center gap-1 overflow-x-auto no-scrollbar px-4 sm:-mx-6 sm:px-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-bold text-amber-100/80 hover:bg-amber-500/10 hover:text-amber-300 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}

