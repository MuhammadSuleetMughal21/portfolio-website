const roles = [
  {
    period: "May 2025 – Present",
    type: "Full Time",
    company: "Tafsol Technologies",
    title: "Mobile Application Developer",
    points: [
      "Shipped 12 cross-platform iOS & Android apps across travel, health, logistics and AI.",
      "Integrated AI features — chatbots, voice-to-text and a Bitmoji-based virtual try-on — into live apps.",
      "Managed app state with Redux, integrated REST APIs via Axios, and led end-to-end App Store & Google Play delivery.",
    ],
  },
  {
    period: "May 2024 – April 2025",
    type: "Full Time",
    company: "Decotechs",
    title: "MERN Stack & Mobile Application Developer",
    points: [
      "Built health and e-commerce mobile apps for iOS & Android with React Native and Redux.",
      "Developed React web interfaces and RESTful backends with Node.js, Express and MongoDB.",
      "Managed end-to-end builds, store publishing and ongoing delivery updates.",
    ],
  },
  {
    period: "July 2023 – Feb 2024",
    type: "Full Time",
    company: "Moziky",
    title: "Associate Software Engineer",
    points: [
      "Developed cross-platform iOS & Android apps with React Native inside an agile team.",
      "Integrated Firebase Authentication and Firestore, with MobX for efficient state management.",
    ],
  },
];

export default function Experience() {
  return (
    <section id="experience" className="py-24 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.3em] text-fg-muted">
          Where I&apos;ve been
        </p>
        <h2 className="mt-3 font-display text-6xl font-bold leading-none outline-heading sm:text-8xl">
          EXPERIENCE
        </h2>

        <div className="mt-14 border-t border-border">
          {roles.map((r) => (
            <div
              key={r.company}
              data-animate
              className="grid gap-6 border-b border-border py-10 md:grid-cols-[220px_1fr]"
            >
              <div>
                <p className="font-semibold text-fg">{r.period}</p>
                <span className="mt-2 inline-block rounded-full border border-border px-3 py-1 font-mono text-[11px] uppercase tracking-wider text-fg-muted">
                  {r.type}
                </span>
                <p className="mt-3 text-sm text-fg-muted">{r.company}</p>
              </div>
              <div>
                <h3 className="font-display text-2xl font-bold">{r.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {r.points.map((p) => (
                    <li key={p} className="flex gap-3 text-fg-muted">
                      <span className="mt-2 h-px w-4 shrink-0 bg-brand" />
                      <span className="leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
