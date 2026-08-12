'use client';

import Image from 'next/image';

const VIDEO_URL = 'https://d1hddaam55e99y.cloudfront.net/1076/blank-menu/menu_video_1772730647976.mp4';

/** Compact atmospheric video banner + topbar (table number, staff login). */
export function HeroVideoHeader({
  tableNumber,
  children,
}: {
  tableNumber: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative w-full bg-[#0d0b09] text-white pb-8 mb-1">
      {/* Background Video player container */}
      <div className="relative h-[70vh] min-h-[500px] w-full overflow-hidden rounded-b-[36px] sm:rounded-b-[44px] border-b border-amber-400/30 shadow-2xl">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-85"
        >
          <source src={VIDEO_URL} type="video/mp4" />
        </video>

        {/* Dark luxury overlay vignette with amber ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0b09] via-black/30 to-black/60" />
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-500/20 blur-[100px]" />
      </div>

      {/* Floating top bar, pinned to the viewport (not the video). It has
          to be `fixed` rather than `sticky` here: the video box above is
          `overflow-hidden`, which breaks `sticky` for anything nested
          inside it — once you scroll past the hero's own height, a sticky
          child has nowhere left to stick to. `fixed` sidesteps that
          entirely, and matches every other screen's header staying pinned
          for the full scroll, not just within the hero. */}
      {children ? (
        <div className="fixed inset-x-0 top-0 z-40 mx-auto max-w-lg">
          {children}
        </div>
      ) : null}

      {/* Logo positioned higher up on the hero video banner */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 translate-y-1/2 z-30">
        <div className="relative h-22 w-22 sm:h-24 sm:w-24 overflow-hidden rounded-full border-4 border-amber-400/70 bg-[#0d0b09] shadow-2xl gold-glow transition-transform duration-500 hover:scale-105">
          <Image
            src="/opa-logo.jpg"
            alt="OPA Logo"
            fill
            sizes="(min-width: 640px) 96px, 88px"
            className="object-cover"
            priority
          />
        </div>
      </div>
    </div>
  );
}
