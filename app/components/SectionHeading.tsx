export default function SectionHeading({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <span className="inline-block rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand">
        {eyebrow}
      </span>
      <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-lg leading-relaxed text-fg-muted">{subtitle}</p>
      )}
    </div>
  );
}
