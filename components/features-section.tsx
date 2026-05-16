"use client"

import { Sparkles, Code2, GitBranch, Blocks } from "lucide-react"

export function FeaturesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 lg:px-6 lg:py-24">
      <div className="grid gap-4 md:grid-cols-2">
        {/* Semantic Code Analysis - Large Card */}
        <div className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30 lg:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-foreground">
            Semantic Code Analysis
          </h3>
          <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
            Our engine parses your entire repository structure,
            understanding exports, types, and logic to build contextually
            aware documentation.
          </p>
          {/* Terminal Mock */}
          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="flex items-center gap-1.5 border-b border-border px-4 py-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-chart-4/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-accent/70" />
            </div>
            <div className="px-4 py-3 font-mono text-xs leading-relaxed text-muted-foreground">
              <p className="text-primary">
                {">"} Processing src/lib/core.ts...
              </p>
              <p>{">"} Mapping dependencies</p>
              <p>{">"} Extracting JSDoc headers</p>
              <p>{">"} Synthesizing architecture overview</p>
              <p className="mt-2 text-accent">
                Success: documentation_manifest.json generated
              </p>
            </div>
          </div>
        </div>

        {/* CI/CD Integration */}
        <div className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30 lg:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Code2 className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-auto">
            <h3 className="mb-2 text-xl font-bold text-foreground">
              CI/CD Integration
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Automatically update your README on every merge to main. Keep
              your docs in sync with your code.
            </p>
          </div>
        </div>

        {/* Custom Blueprints */}
        <div className="group rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30 lg:p-8">
          <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-secondary">
            <Blocks className="h-5 w-5 text-primary" />
          </div>
          <h3 className="mb-2 text-xl font-bold text-foreground">
            Custom Blueprints
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Define your own templates or use our industry-standard presets
            for NPM, PyPI, or Cargo.
          </p>
        </div>

        {/* Designed for Developers */}
        <div className="group flex flex-col justify-center rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/30 lg:flex-row lg:items-center lg:gap-6 lg:p-8">
          <div className="mb-4 flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-secondary lg:mb-0 lg:h-full lg:w-40 lg:shrink-0">
            <GitBranch className="h-10 w-10 text-muted-foreground/50" />
          </div>
          <div>
            <h3 className="mb-2 text-xl font-bold text-foreground">
              Designed for Developers
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              No fluff. Just the precision you need to make your projects
              stand out in the community.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
