export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-4 px-4 py-8 sm:flex-row sm:items-center sm:px-6">
        <div>
          <div className="font-display text-sm font-bold">urReadme<span className="text-primary">.md</span></div>
          <div className="text-xs text-muted-foreground">© 2024 urReadme.md — Built for developers.</div>
        </div>
        <div className="flex gap-6 text-xs text-muted-foreground">
          <a href="#" className="hover:text-foreground">Changelog</a>
          <a href="#" className="hover:text-foreground">Status</a>
          <a href="#" className="hover:text-foreground">Privacy</a>
          <a href="#" className="hover:text-foreground">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
