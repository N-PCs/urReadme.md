"use client"

interface CTASectionProps {
  onGetStarted: () => void
}

export function CTASection({ onGetStarted }: CTASectionProps) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6">
      <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card px-6 py-16 text-center lg:py-20">
        <h2 className="max-w-lg text-balance text-3xl font-bold leading-tight tracking-tight text-foreground md:text-4xl">
          Stop writing documentation.{" "}
          <br className="hidden sm:block" />
          <span className="text-primary">Start generating it.</span>
        </h2>
        <button
          onClick={onGetStarted}
          className="mt-8 rounded-xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Get Started for Free
        </button>
      </div>
    </section>
  )
}
