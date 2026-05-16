"use client"

import Link from "next/link"
import { Monitor, Settings } from "lucide-react"

interface NavbarProps {
  activeView: "landing" | "workspace"
  onNavigateHome: () => void
}

export function Navbar({ activeView, onNavigateHome }: NavbarProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo */}
        <button
          onClick={onNavigateHome}
          className="flex items-center gap-1 text-foreground transition-opacity hover:opacity-80"
        >
          <span className="text-base font-bold tracking-tight">urReadme.md</span>
        </button>

        {/* Center Nav Links */}
        <div className="hidden items-center gap-6 md:flex">
          {["Features", "Pricing", "Docs"].map((item) => (
            <Link
              key={item}
              href="#"
              className={`text-sm transition-colors ${
                item === "Features"
                  ? "text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {item}
            </Link>
          ))}
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          <button
            className="hidden rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
            aria-label="Preview"
          >
            <Monitor className="h-4 w-4" />
          </button>
          <button
            className="hidden rounded-md p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground sm:inline-flex"
            aria-label="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90">
            Dashboard
          </button>
        </div>
      </nav>
    </header>
  )
}
