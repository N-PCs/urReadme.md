import { Zap, Shield, GitBranch, Loader2, Link2 } from "lucide-react";

interface HeroProps {
  url: string;
  setUrl: (v: string) => void;
  onGenerate: () => void;
  loading: boolean;
}

export function Hero({ url, setUrl, onGenerate, loading }: HeroProps) {
  return (
    <section className="relative overflow-hidden">
      <div className="hero-glow pointer-events-none absolute inset-0" />
      <div className="relative mx-auto max-w-4xl px-4 pb-16 pt-20 text-center sm:pt-28">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
          VERSION 2.0 NOW LIVE
        </span>

        <h1 className="mt-6 font-display text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
          Precision Documentation
          <br />
          for <span className="text-primary">High-Performance</span> Teams
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-base text-muted-foreground sm:text-lg">
          Automate your documentation workflow. Generate production-ready READMEs from your codebase in seconds using advanced LLMs.
        </p>

        <form
          onSubmit={(e) => { e.preventDefault(); onGenerate(); }}
          className="mx-auto mt-10 flex max-w-2xl flex-col gap-2 rounded-xl border border-border bg-card/70 p-2 shadow-2xl shadow-primary/5 backdrop-blur sm:flex-row sm:items-center"
        >
          <div className="flex flex-1 items-center gap-2 px-3">
            <Link2 className="h-4 w-4 shrink-0 text-muted-foreground" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="github.com/username/repository"
              className="w-full bg-transparent py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition hover:opacity-90 disabled:opacity-70"
          >
            {loading ? (<><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>) : "Generate"}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-medium text-muted-foreground">
          <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-primary" /> Powered by GPT-4o</span>
          <span className="flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5 text-primary" /> Public Repo Support</span>
          <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> Privacy First</span>
        </div>
      </div>
    </section>
  );
}
