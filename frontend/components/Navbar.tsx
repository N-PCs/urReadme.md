"use client"

import { Terminal, Settings, LogOut, Github } from "lucide-react";
import { signIn, signOut, useSession } from "next-auth/react";

export function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <a href="/" className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">
          <span className="text-foreground">urReadme</span><span className="text-primary">.md</span>
        </a>
        <div className="hidden items-center gap-8 md:flex">
          <a href="#features" className="text-sm font-medium text-primary underline decoration-2 underline-offset-8">Features</a>
          <a href="#docs" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Docs</a>
        </div>
        <div className="flex items-center gap-2">
          {session ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-border bg-card/60 px-2 py-1 pr-3">
                <img 
                  src={session.user?.image || ""} 
                  alt={session.user?.name || "User"} 
                  className="h-6 w-6 rounded-full"
                />
                <span className="text-xs font-medium">{session.user?.name}</span>
              </div>
              <button 
                onClick={() => signOut()}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-destructive/10 hover:text-destructive"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => signIn("github")}
              className="inline-flex items-center gap-2 rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
            >
              <Github className="h-4 w-4" />
              Sign In
            </button>
          )}
          <button className="hidden h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition hover:bg-secondary hover:text-foreground sm:flex" aria-label="Settings">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </nav>
    </header>
  );
}
