const STEPS = [
  {
    title: "Choose a place",
    body: "Pick a spot on the world map that meant something — a childhood street, a favourite beach, a city they loved. It becomes their virtual memorial location.",
  },
  {
    title: "Create their memorial",
    body: "Add their name, dates, a portrait and an epitaph. Write the life story in your own words, with photos along the way.",
  },
  {
    title: "Share their story",
    body: "Invite family and friends with a link or QR code. They can leave tributes and share memories of their own.",
  },
  {
    title: "Visit anytime",
    body: "Their place on the map is always there. Return on an anniversary, a birthday, or whenever you want to feel close.",
  },
];

export function HowItWorks() {
  return (
    <section aria-labelledby="how-it-works" className="container-page py-20 sm:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow">How it works</p>
        <h2 id="how-it-works" className="mt-3 text-4xl text-ivory-50 sm:text-5xl">
          A place on the world, kept with care
        </h2>
      </div>
      <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <li key={s.title} className="relative flex flex-col gap-3">
            <span
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-gold-400/50 bg-gold-400/10 font-display text-lg text-gold-300 shadow-[0_0_20px_-6px_rgb(211_184_119/0.7)]"
              aria-hidden
            >
              {i + 1}
            </span>
            <h3 className="text-2xl text-ivory-50">
              <span className="sr-only">Step {i + 1}: </span>
              {s.title}
            </h3>
            <p className="text-sm leading-relaxed text-ivory-400">{s.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
