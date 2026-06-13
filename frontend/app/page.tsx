"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Navbar } from "@/components/Navbar"
import { Hero } from "@/components/Hero"
import { Features } from "@/components/Features"
import { CtaBanner } from "@/components/CtaBanner"
import { Footer } from "@/components/Footer"
import { Workspace } from "@/components/Workspace"
import { getGeminiApiKey, setGeminiApiKey } from "@/lib/gemini-storage"

type View = "landing" | "workspace"

export default function Home() {
  const [view, setView] = useState<View>("landing")
  const [repoUrl, setRepoUrl] = useState("")
  const [apiKey, setApiKey] = useState("")
  const [markdown, setMarkdown] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    const stored = getGeminiApiKey()
    if (stored) setApiKey(stored)
  }, [])

  const handleApiKeyChange = useCallback((key: string) => {
    setApiKey(key)
    if (key.trim()) {
      setGeminiApiKey(key)
    }
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!repoUrl.trim()) return

    const trimmedKey = apiKey.trim()
    if (trimmedKey.length < 10) {
      setError("Please enter your Gemini API key before generating.")
      return
    }

    setGeminiApiKey(trimmedKey)
    setIsGenerating(true)
    setView("workspace")
    setMarkdown("")
    setError(null)

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    try {
      const resp = await fetch("/api/generate-readme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          repo_url: repoUrl,
          gemini_api_key: trimmedKey,
          stream: true,
        }),
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
        const reader = resp.body.getReader()
        const decoder = new TextDecoder()
        let accumulated = ""
        let buffer = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split("\n")
          buffer = lines.pop() ?? ""

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue

            const data = line.slice(6)
            if (data === "[DONE]") break
            if (data.startsWith("[ERROR]")) {
              throw new Error(data.slice(8))
            }

            try {
              accumulated += JSON.parse(data) as string
            } catch {
              accumulated += data
            }
            setMarkdown(accumulated)
          }
        }

        setIsGenerating(false)
        return
      }

      const data = await resp.json()
      setMarkdown(data.readme)
      setIsGenerating(false)
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === "AbortError") return

      const message =
        err instanceof Error ? err.message : "Failed to generate README."
      setError(message)
      setIsGenerating(false)
    }
  }, [repoUrl, apiKey])

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
              apiKey={apiKey}
              setApiKey={handleApiKeyChange}
              onGenerate={handleGenerate}
              loading={isGenerating}
            />
            {error && (
              <div className="mx-auto -mt-8 mb-4 max-w-2xl rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
            <Features />
            <CtaBanner />
          </>
        ) : (
          <Workspace
            markdown={markdown}
            setMarkdown={setMarkdown}
            onReset={handleReset}
            isGenerating={isGenerating}
            error={error}
          />
        )}
      </main>

      {view === "landing" && <Footer />}
    </div>
  )
}
