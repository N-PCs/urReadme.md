"use client"

import { Link, Zap, Globe, Shield } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"

interface HeroSectionProps {
  repoUrl: string
  onRepoUrlChange: (url: string) => void
  onGenerate: () => void
  isGenerating: boolean
}

export function HeroSection({
  repoUrl,
  onRepoUrlChange,
  onGenerate,
  isGenerating,
}: HeroSectionProps) {
  return (
    <section className="relative flex flex-col items-center px-4 pb-16 pt-20 text-center lg:pb-24 lg:pt-28">
      {/* Version Badge */}
      <div className="mb-6 flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5">
        <span className="h-2 w-2 rounded-full bg-accent" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Version 2.0 Now Live
        </span>
      </div>

      {/* Heading */}
      <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
        Precision Documentation{" "}
        <br className="hidden sm:block" />
        for{" "}
        <span className="text-primary">High-Performance</span>{" "}
        <br className="hidden sm:block" />
        Teams
      </h1>

      {/* Subtitle */}
      <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground md:text-lg">
        Automate your documentation workflow. Generate production-ready
        READMEs from your codebase in seconds using advanced LLMs.
      </p>

      {/* Input Bar */}
      <div className="mt-10 flex w-full max-w-xl items-center gap-0 rounded-xl border border-border bg-input p-1.5">
        <div className="flex flex-1 items-center gap-2 px-3">
          <Link className="h-4 w-4 shrink-0 text-muted-foreground" />
          <input
            type="url"
            value={repoUrl}
            onChange={(e) => onRepoUrlChange(e.target.value)}
            placeholder="github.com/username/repository"
            className="w-full bg-transparent py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter" && repoUrl.trim()) onGenerate()
            }}
          />
        </div>
        <button
          onClick={onGenerate}
          disabled={isGenerating || !repoUrl.trim()}
          className="flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-accent-foreground transition-all hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Spinner className="h-4 w-4" />
              <span>Generating...</span>
            </>
          ) : (
            "Generate"
          )}
        </button>
      </div>

      {/* Trust Badges */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-6">
        {[
          { icon: Zap, label: "Powered by GPT-4o" },
          { icon: Globe, label: "Public Repo Support" },
          { icon: Shield, label: "Privacy First" },
        ].map(({ icon: Icon, label }) => (
          <div
            key={label}
            className="flex items-center gap-2 text-xs text-muted-foreground"
          >
            <Icon className="h-3.5 w-3.5" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
