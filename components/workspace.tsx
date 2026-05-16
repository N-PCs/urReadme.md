"use client"

import { useEffect, useState } from "react"
import { FileText, History, Circle } from "lucide-react"

interface GenerationBarProps {
  isGenerating: boolean
  progress: number
  statusText: string
}

function GenerationBar({ isGenerating, progress, statusText }: GenerationBarProps) {
  if (!isGenerating && progress >= 100) return null

  return (
    <div className="flex items-center gap-4 border-b border-border bg-background px-4 py-2.5 lg:px-6">
      <span className="shrink-0 text-xs font-bold uppercase tracking-widest text-primary">
        {progress >= 100 ? "Complete" : "Generating"}
      </span>
      <div className="flex-1">
        <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {Math.round(progress)}%
      </span>
      <div className="hidden items-center gap-2 sm:flex">
        <Circle className="h-2 w-2 fill-accent text-accent animate-progress-pulse" />
        <span className="text-xs text-muted-foreground">
          AI Agent: {statusText}
        </span>
      </div>
    </div>
  )
}

interface WorkspaceProps {
  markdown: string
  onMarkdownChange: (md: string) => void
  isGenerating: boolean
  error?: string | null
}

const STATUS_MESSAGES = [
  "Scanning repository...",
  "Mapping dependencies...",
  "Extracting JSDoc headers...",
  "Analyzing logic...",
  "Synthesizing overview...",
  "Generating README...",
  "Finalizing output...",
]

export function Workspace({ markdown, onMarkdownChange, isGenerating, error }: WorkspaceProps) {
  const [progress, setProgress] = useState(0)
  const [statusText, setStatusText] = useState(STATUS_MESSAGES[0])
  const [activeTab, setActiveTab] = useState<"raw" | "edit">("raw")
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isGenerating) return
    setProgress(0)
    let current = 0
    const interval = setInterval(() => {
      current += Math.random() * 8 + 2
      if (current > 95) current = 95
      setProgress(current)
      const idx = Math.min(
        Math.floor((current / 100) * STATUS_MESSAGES.length),
        STATUS_MESSAGES.length - 1
      )
      setStatusText(STATUS_MESSAGES[idx])
    }, 400)
    return () => clearInterval(interval)
  }, [isGenerating])

  useEffect(() => {
    if (!isGenerating && progress > 0 && progress < 100) {
      setProgress(100)
      setStatusText("Complete!")
    }
  }, [isGenerating, progress])

  const lines = markdown.split("\n")

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Generation Progress Bar */}
      <GenerationBar
        isGenerating={isGenerating}
        progress={progress}
        statusText={statusText}
      />

      {/* File bar */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2 lg:px-6">
        <div className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">README.md</span>
        </div>
        <button className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground">
          <History className="h-3.5 w-3.5" />
          History
        </button>
      </div>

      {/* Tabs + Copy */}
      <div className="flex items-center justify-between border-b border-border px-4 lg:px-6">
        <div className="flex">
          {(["raw", "edit"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`border-b-2 px-4 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab === "raw" ? "Raw Markdown" : "Edit Mode"}
            </button>
          ))}
        </div>
        <button
          onClick={handleCopy}
          className="rounded-md bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Content Area */}
      {error && (
        <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive lg:px-6">
          {error}
        </div>
      )}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: Code Editor */}
        <div className="custom-scrollbar flex flex-1 overflow-auto border-r border-border bg-background">
          {activeTab === "raw" ? (
            <div className="flex min-w-0 flex-1">
              {/* Line Numbers */}
              <div className="sticky left-0 shrink-0 select-none border-r border-border bg-background px-3 py-4 text-right">
                {lines.map((_, i) => (
                  <div
                    key={i}
                    className="line-number font-mono text-xs leading-6 text-muted-foreground/50"
                  >
                    {i + 1}
                  </div>
                ))}
              </div>
              {/* Code Content */}
              <pre className="flex-1 overflow-x-auto p-4">
                <code className="font-mono text-xs leading-6">
                  {lines.map((line, i) => (
                    <div key={i} className="whitespace-pre">
                      {renderMarkdownLine(line)}
                    </div>
                  ))}
                </code>
              </pre>
            </div>
          ) : (
            <textarea
              value={markdown}
              onChange={(e) => onMarkdownChange(e.target.value)}
              className="custom-scrollbar w-full resize-none bg-background p-4 font-mono text-xs leading-6 text-foreground focus:outline-none"
              spellCheck={false}
            />
          )}
        </div>

        {/* Right: Live Preview (desktop only) */}
        <div className="custom-scrollbar hidden w-1/2 overflow-auto bg-card p-6 lg:block lg:p-8">
          <MarkdownPreview content={markdown} />
        </div>
      </div>
    </div>
  )
}

/** Simple syntax highlighting for markdown in the raw view */
function renderMarkdownLine(line: string) {
  if (line.startsWith("# "))
    return <span className="font-bold text-accent">{line}</span>
  if (line.startsWith("## "))
    return <span className="font-bold text-accent">{line}</span>
  if (line.startsWith("### "))
    return <span className="font-semibold text-accent">{line}</span>
  if (line.startsWith("> "))
    return <span className="text-muted-foreground italic">{line}</span>
  if (line.startsWith("- **"))
    return <span className="text-foreground/90">{line}</span>
  if (line.startsWith("```"))
    return <span className="text-primary">{line}</span>
  if (line.startsWith("Success:") || line.startsWith("✅") || line.startsWith("🚧") || line.startsWith("📋"))
    return <span className="text-accent">{line}</span>
  if (line.startsWith("|"))
    return <span className="text-muted-foreground">{line}</span>
  return <span className="text-foreground/70">{line}</span>
}

/** Markdown preview using react-markdown */
function MarkdownPreview({ content }: { content: string }) {
  const [ReactMarkdown, setReactMarkdown] = useState<React.ComponentType<{ children: string; remarkPlugins?: unknown[] }> | null>(null)
  const [remarkGfm, setRemarkGfm] = useState<unknown[] | null>(null)

  useEffect(() => {
    Promise.all([
      import("react-markdown"),
      import("remark-gfm"),
    ]).then(([md, gfm]) => {
      setReactMarkdown(() => md.default)
      setRemarkGfm(() => [gfm.default])
    })
  }, [])

  if (!ReactMarkdown || !remarkGfm) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-sm text-muted-foreground">Loading preview...</div>
      </div>
    )
  }

  return (
    <div className="markdown-preview">
      <ReactMarkdown remarkPlugins={remarkGfm}>{content}</ReactMarkdown>
    </div>
  )
}
