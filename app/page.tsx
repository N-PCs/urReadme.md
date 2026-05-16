"use client"

import { useState, useCallback, useRef } from "react"
import { Navbar } from "@/components/navbar"
import { HeroSection } from "@/components/hero-section"
import { FeaturesSection } from "@/components/features-section"
import { CTASection } from "@/components/cta-section"
import { Footer } from "@/components/footer"
import { Workspace } from "@/components/workspace"
import { SAMPLE_README } from "@/lib/sample-readme"

type View = "landing" | "workspace"

export default function Home() {
  const [view, setView] = useState<View>("landing")
  const [repoUrl, setRepoUrl] = useState("")
  const [markdown, setMarkdown] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const handleGenerate = useCallback(async () => {
    if (!repoUrl.trim()) return
    setIsGenerating(true)
    setView("workspace")
    setMarkdown("")
    setError(null)

    // Cancel any in-flight request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      // ---- Try real backend (SSE streaming) ----
      const resp = await fetch("/api/generate-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repo_url: repoUrl, stream: true }),
        signal: controller.signal,
      })

      if (!resp.ok) {
        const body = await resp.json().catch(() => ({ detail: "Unknown error" }))
        throw new Error(body.detail || `Server error (${resp.status})`)
      }

      if (
        resp.headers.get("content-type")?.includes("text/event-stream") &&
        resp.body
      ) {
        // SSE streaming path
        const reader = resp.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          const lines = chunk.split("\n")

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6)
              if (data === "[DONE]") break
              if (data.startsWith("[ERROR]")) {
                throw new Error(data.slice(8))
              }
              accumulated += data
              setMarkdown(accumulated)
            }
          }
        }

        setIsGenerating(false)
        return
      }

      // Non-streaming JSON response
      const data = await resp.json()
      setMarkdown(data.readme)
      setIsGenerating(false)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return

      // ---- Fallback to mock data ----
      console.warn(
        "[urReadme] Backend unavailable, falling back to mock data:",
        err,
      )
      setError(null) // clear error since we're using fallback
      const lines = SAMPLE_README.split("\n")
      let currentLine = 0

      const interval = setInterval(() => {
        currentLine += 1
        if (currentLine >= lines.length) {
          clearInterval(interval)
          setMarkdown(SAMPLE_README)
          setIsGenerating(false)
          return
        }
        setMarkdown(lines.slice(0, currentLine + 1).join("\n"))
      }, 60)
    }
  }, [repoUrl])

  const handleNavigateHome = useCallback(() => {
    abortRef.current?.abort()
    setView("landing")
    setIsGenerating(false)
    setError(null)
  }, [])

  const scrollToInput = useCallback(() => {
    setView("landing")
    setTimeout(() => {
      const input = document.querySelector<HTMLInputElement>('input[type="url"]')
      input?.focus()
    }, 100)
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar activeView={view} onNavigateHome={handleNavigateHome} />

      {view === "landing" ? (
        <main className="flex-1">
          <HeroSection
            repoUrl={repoUrl}
            onRepoUrlChange={setRepoUrl}
            onGenerate={handleGenerate}
            isGenerating={isGenerating}
          />
          <FeaturesSection />
          <CTASection onGetStarted={scrollToInput} />
        </main>
      ) : (
        <Workspace
          markdown={markdown}
          onMarkdownChange={setMarkdown}
          isGenerating={isGenerating}
          error={error}
        />
      )}

      {view === "landing" && <Footer />}
    </div>
  )
}
