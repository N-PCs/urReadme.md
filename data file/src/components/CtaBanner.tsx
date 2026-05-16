export function CtaBanner() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card px-6 py-14 text-center">
        <div className="hero-glow pointer-events-none absolute inset-0" />
        <h2 className="relative font-display text-3xl font-bold sm:text-4xl">
          Stop writing documentation.<br />Start generating it.
        </h2>
        <button className="relative mt-7 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-90">
          Get Started for Free
        </button>
      </div>
    </section>
  );
}
