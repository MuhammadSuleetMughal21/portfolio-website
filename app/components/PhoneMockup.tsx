// Original phone-frame mockup. Shows a real screenshot when `src` is given,
// otherwise an abstract placeholder app screen (no fake data, no copied art).

export default function PhoneMockup({
  src,
  alt,
  accent,
  seed = 0,
  className = "",
}: Readonly<{
  src?: string;
  alt?: string;
  accent: string;
  seed?: number;
  className?: string;
}>) {
  return (
    <div
      className={`relative aspect-[9/19] w-[150px] shrink-0 rounded-[1.8rem] border border-white/10 bg-zinc-900 p-[5px] shadow-2xl sm:w-[168px] ${className}`}
    >
      {/* notch */}
      <div className="absolute left-1/2 top-[7px] z-10 h-3 w-14 -translate-x-1/2 rounded-full bg-black/80" />
      <div className="relative h-full w-full overflow-hidden rounded-[1.45rem] bg-zinc-950">
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt ?? "App screenshot"}
            className="h-full w-full object-cover"
          />
        ) : (
          <PlaceholderScreen accent={accent} seed={seed} />
        )}
      </div>
    </div>
  );
}

function PlaceholderScreen({
  accent,
  seed,
}: Readonly<{ accent: string; seed: number }>) {
  const v = ((seed % 3) + 3) % 3;
  return (
    <div className="flex h-full w-full flex-col bg-zinc-950">
      {/* header */}
      <div className={`bg-gradient-to-br ${accent} px-3 pb-4 pt-6`}>
        <div className="h-2 w-10 rounded-full bg-white/70" />
        <div className="mt-2 h-3.5 w-20 rounded bg-white/90" />
      </div>
      {/* body */}
      <div className="flex-1 space-y-2.5 p-2.5">
        {v === 0 && (
          <>
            <div className="h-16 rounded-lg bg-white/10" />
            <div className="h-2 w-5/6 rounded bg-white/15" />
            <div className="h-2 w-2/3 rounded bg-white/10" />
            <div className="h-10 rounded-lg bg-white/10" />
            <div className="h-10 rounded-lg bg-white/10" />
          </>
        )}
        {v === 1 && (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className="aspect-square rounded-lg bg-white/10" />
              <div className="aspect-square rounded-lg bg-white/10" />
              <div className="aspect-square rounded-lg bg-white/10" />
              <div className="aspect-square rounded-lg bg-white/10" />
              <div className="aspect-square rounded-lg bg-white/10" />
              <div className="aspect-square rounded-lg bg-white/10" />
            </div>
            <div className="h-2 w-3/4 rounded bg-white/15" />
          </>
        )}
        {v === 2 && (
          <>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-white/15" />
              <div className="flex-1 space-y-1">
                <div className="h-2 w-2/3 rounded bg-white/15" />
                <div className="h-2 w-1/3 rounded bg-white/10" />
              </div>
            </div>
            <div className="h-20 rounded-lg bg-white/10" />
            <div className="h-2 w-5/6 rounded bg-white/15" />
            <div className="h-2 w-1/2 rounded bg-white/10" />
          </>
        )}
      </div>
      {/* bottom bar */}
      <div className="flex items-center justify-around border-t border-white/5 px-4 py-2">
        <div className="h-2 w-2 rounded-full bg-white/40" />
        <div className="h-2 w-2 rounded-full bg-white/15" />
        <div className="h-2 w-2 rounded-full bg-white/15" />
        <div className="h-2 w-2 rounded-full bg-white/15" />
      </div>
    </div>
  );
}
