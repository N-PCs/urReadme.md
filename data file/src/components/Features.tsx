import { Wand2, GitMerge, Blocks, Code2 } from "lucide-react";

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card
          icon={<Wand2 className="h-5 w-5 text-primary" />}
          title="Semantic Code Analysis"
          desc="Our engine parses your entire repository structure, understanding exports, types, and logic to build contextually aware documentation."
        >
          <pre className="overflow-x-auto rounded-lg border border-border bg-[var(--code-bg)] p-4 font-mono text-[12px] leading-relaxed text-muted-foreground">
            <div className="flex gap-1.5 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.75_0.15_85)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-success" />
            </div>
            <span className="text-success"># Processing src/lib/core.ts...</span>{"\n"}
            {"> Mapping dependencies\n"}
            {"> Extracting JSDoc headers\n"}
            {"> Synthesizing architecture overview\n"}
            <span className="text-primary">Success:</span> documentation_manifest.json generated
          </pre>
        </Card>
        <Card
          icon={<GitMerge className="h-5 w-5 text-success" />}
          title="CI/CD Integration"
          desc="Automatically update your README on every merge to main. Keep your docs in sync with your code."
        >
          <div className="rounded-lg border border-border bg-[var(--code-bg)] p-5">
            <div className="space-y-2 text-xs font-mono text-muted-foreground">
              <Line dot="success" label="push: main" value="✓ synced" />
              <Line dot="primary" label="webhook: trigger" value="200 OK" />
              <Line dot="success" label="readme: regenerated" value="2.4s" />
            </div>
          </div>
        </Card>
        <Card
          icon={<Blocks className="h-5 w-5 text-primary" />}
          title="Custom Blueprints"
          desc="Define your own templates or use our industry-standard presets for NPM, PyPI, or Cargo."
        />
        <Card
          icon={<Code2 className="h-5 w-5 text-primary" />}
          title="Designed for Developers"
          desc="No fluff. Just the precision you need to make your projects stand out in the community."
        />
      </div>
    </section>
  );
}

function Card({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40">
      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-accent/60">{icon}</div>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
      {children && <div className="mt-5">{children}</div>}
    </div>
  );
}

function Line({ dot, label, value }: { dot: "success" | "primary"; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <span className={`h-1.5 w-1.5 rounded-full ${dot === "success" ? "bg-success" : "bg-primary"}`} />
        {label}
      </span>
      <span className="text-foreground/70">{value}</span>
    </div>
  );
}
