import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  const VIDEO_URL = 'https://d1hddaam55e99y.cloudfront.net/1076/blank-menu/menu_video_1772730647976.mp4';

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-5 py-10 text-center bg-[#080706]">
      {/* Background Ambient Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Dark luxury overlay vignette */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#080706] via-black/60 to-black/80" />

      {/* Ambient gold glow spotlights */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-500/15 blur-[130px]" />
      <div className="pointer-events-none absolute -bottom-40 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-500/10 blur-[130px]" />

      {/* Main Glass Card Container */}
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center gap-6 glass-panel p-6 sm:p-8 rounded-3xl border border-amber-400/30 shadow-2xl gold-glow">
        
        {/* Brand Circular Logo */}
        <div className="relative h-28 w-28 sm:h-32 sm:w-32 overflow-hidden rounded-full border-4 border-amber-400/60 shadow-2xl gold-glow transition-transform duration-700 hover:scale-105">
          <Image
            src="/opa-logo.jpg"
            alt="OPA Bar & Cafe"
            fill
            sizes="(min-width: 640px) 128px, 112px"
            className="object-cover"
            priority
          />
        </div>

        {/* Brand Title & Tagline */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-widest gold-text-gradient uppercase drop-shadow-md">
            OPA BAR &amp; CAFE
          </h1>
          <p className="text-xs font-bold text-amber-400/90 tracking-widest uppercase">
            Luxury Dining &amp; Cocktails
          </p>
        </div>

        {/* Informative Guidance Box */}
        <div className="w-full space-y-4 rounded-2xl border border-amber-500/25 bg-gradient-to-b from-[#1c1814]/90 to-[#100e0b]/95 p-5 backdrop-blur-xl shadow-2xl text-center gold-glow-sm">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-400/40 bg-amber-500/15 text-2xl shadow-inner animate-pulse">
              📲
            </div>
          </div>

          <div className="space-y-1.5">
            <h2 className="text-sm font-black text-amber-50 tracking-wide uppercase">
              Scan QR Code At Your Table
            </h2>
            <p className="text-xs leading-relaxed text-amber-200/70 font-medium">
              Point your camera at the QR stand on your table to open the live menu, customize items &amp; order instantly.
            </p>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-amber-900/30 text-left">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-amber-500/15">
              <span className="text-base">⚡</span>
              <span className="text-[10px] font-bold text-amber-100/90">Instant Kitchen Order</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-amber-500/15">
              <span className="text-base">🍷</span>
              <span className="text-[10px] font-bold text-amber-100/90">Craft Cocktails</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-amber-500/15">
              <span className="text-base">💳</span>
              <span className="text-[10px] font-bold text-amber-100/90">Contactless Billing</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-xl bg-black/40 border border-amber-500/15">
              <span className="text-base">🛎️</span>
              <span className="text-[10px] font-bold text-amber-100/90">1-Tap Table Service</span>
            </div>
          </div>

          {/* Direct Menu Entry Button */}
          <Link
            href="/order?table=1"
            className="w-full rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 py-3.5 px-4 text-xs font-black text-black shadow-lg shadow-amber-500/25 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-2"
          >
            <span>Explore Digital Menu</span>
            <span className="text-sm font-extrabold">→</span>
          </Link>
        </div>

      </div>
    </div>
  );
}



