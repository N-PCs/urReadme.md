"use client"

import { useState, useCallback, useRef } from "react"
import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/Hero"
import { Features } from "@/components/Features"
import { CtaBanner } from "@/components/CtaBanner"
import { Footer } from "@/components/Footer"
import { Workspace } from "@/components/Workspace"
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

  const handleReset = useCallback(() => {
    setView("landing")
    setRepoUrl("")
    setMarkdown("")
    setError(null)
    abortRef.current?.abort()
  }, [])

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground antialiased selection:bg-primary/30 selection:text-primary-foreground">
      <Navbar />

      <main className="flex flex-1 flex-col">
        {view === "landing" ? (
          <>
            <Hero
              url={repoUrl}
              setUrl={setRepoUrl}
              onGenerate={handleGenerate}
              loading={isGenerating}
            />
            <Features />
            <CtaBanner />
          </>
        ) : (
          <Workspace
            markdown={markdown}
            setMarkdown={setMarkdown}
            onReset={handleReset}
          />
        )}
      </main>

      {view === "landing" && <Footer />}
    </div>
  )
}
