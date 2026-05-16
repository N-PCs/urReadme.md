import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, FileText, Pencil, Eye, Download, RefreshCw } from "lucide-react";

interface WorkspaceProps {
  markdown: string;
  setMarkdown: (v: string) => void;
  onReset: () => void;
}

type Tab = "raw" | "edit";

export function Workspace({ markdown, setMarkdown, onReset }: WorkspaceProps) {
  const [tab, setTab] = useState<Tab>("raw");
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const download = () => {
    const blob = new Blob([markdown], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "README.md";
    a.click();
  };

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Your README</h2>
          <p className="text-sm text-muted-foreground">Generated successfully — edit, copy, or download.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={download} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary">
            <Download className="h-4 w-4" /> Download
          </button>
          <button onClick={onReset} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition hover:bg-secondary">
            <RefreshCw className="h-4 w-4" /> New
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Left: Editor */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border bg-background/40 px-2">
            <div className="flex">
              <TabBtn active={tab === "raw"} onClick={() => setTab("raw")} icon={<FileText className="h-3.5 w-3.5" />}>Raw Markdown</TabBtn>
              <TabBtn active={tab === "edit"} onClick={() => setTab("edit")} icon={<Pencil className="h-3.5 w-3.5" />}>Edit Mode</TabBtn>
            </div>
            <button onClick={copy} className="mr-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground">
              {copied ? <><Check className="h-3.5 w-3.5 text-success" /> Copied</> : <><Copy className="h-3.5 w-3.5" /> Copy</>}
            </button>
          </div>
          {tab === "raw" ? (
            <textarea
              readOnly
              value={markdown}
              className="h-[560px] w-full resize-none bg-[var(--code-bg)] p-4 font-mono text-[12.5px] leading-relaxed text-foreground focus:outline-none"
            />
          ) : (
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              spellCheck={false}
              className="h-[560px] w-full resize-none bg-[var(--code-bg)] p-4 font-mono text-[12.5px] leading-relaxed text-foreground focus:outline-none"
            />
          )}
        </div>

        {/* Right: Preview */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center gap-2 border-b border-border bg-background/40 px-4 py-2.5">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live Preview</span>
          </div>
          <div className="md-preview h-[560px] overflow-y-auto p-6">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
          </div>
        </div>
      </div>
    </section>
  );
}

function TabBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center gap-1.5 px-4 py-3 text-xs font-semibold transition ${active ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
    >
      {icon} {children}
      {active && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-primary" />}
    </button>
  );
}
