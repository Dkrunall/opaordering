import Link from 'next/link';
import Image from 'next/image';
import { HomeTableSelector } from '@/components/order/HomeTableSelector';

export default function Home() {
  const VIDEO_URL = 'https://d1hddaam55e99y.cloudfront.net/1076/blank-menu/menu_video_1772730647976.mp4';

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 py-12 text-center bg-black">
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover opacity-40"
      >
        <source src={VIDEO_URL} type="video/mp4" />
      </video>

      {/* Dark overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0f0d0b] via-black/60 to-black/80" />

      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px]" />
      
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center gap-6 glass-panel p-8 sm:p-10 rounded-3xl border border-amber-500/20 shadow-2xl gold-glow">
        <div className="relative h-36 w-36 overflow-hidden rounded-full border-2 border-amber-400/40 shadow-xl gold-glow">
          <Image
            src="/opa-logo.jpg"
            alt="OPA Bar & Cafe Logo"
            fill
            className="object-cover transition-transform duration-700 hover:scale-105"
            priority
          />
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-wider gold-text-gradient uppercase">
            OPA BAR &amp; CAFE
          </h1>
          <p className="text-xs leading-relaxed text-amber-100/80 font-medium max-w-xs mx-auto">
            Scan the QR code on your table or select your table number below to order.
          </p>
        </div>

        <div className="w-full space-y-4 pt-1">
          <HomeTableSelector />

          <div className="pt-2 border-t border-amber-900/30 w-full flex items-center justify-center">
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors py-1 px-3 rounded-lg hover:bg-amber-500/10"
            >
              <span>Staff &amp; Admin Portal</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}



