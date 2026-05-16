import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 px-4 py-8 sm:flex-row sm:items-center lg:px-6">
        <div>
          <p className="text-sm font-bold text-foreground">urReadme.md</p>
          <p className="mt-1 text-xs text-muted-foreground">
            &copy; 2024 urReadme.md &mdash; Built for developers.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          {["Changelog", "Status", "Privacy", "GitHub"].map((item) => (
            <Link
              key={item}
              href="#"
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              {item}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  )
}
