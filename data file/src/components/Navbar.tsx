import { Terminal, Settings } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="text-foreground">urReadme</span>
          <span className="text-primary">.md</span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-primary underline decoration-2 underline-offset-8">Features</a>
          <a href="#pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Pricing</a>
          <a href="#docs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Docs</a>
        </div>
        <div className="flex items-center gap-2">
          <button className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:flex" aria-label="Console">
            <Terminal className="h-4 w-4" />
          </button>
          <button className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:flex" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </button>
          <button className="ml-1 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90">
            Dashboard
          </button>
        </div>
      </nav>
    </header>
  );
}
