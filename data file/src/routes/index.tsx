import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { Workspace } from "@/components/Workspace";
import { Features } from "@/components/Features";
import { CtaBanner } from "@/components/CtaBanner";
import { Footer } from "@/components/Footer";
import { SAMPLE_README } from "@/lib/sample-readme";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "urReadme.md — Precision Documentation for High-Performance Teams" },
      { name: "description", content: "Generate production-ready README files from any GitHub repository in seconds using advanced LLMs." },
      { property: "og:title", content: "urReadme.md — AI README Generator" },
      { property: "og:description", content: "Automate your documentation workflow with semantic code analysis." },
    ],
  }),
  component: Index,
});

function Index() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  const handleGenerate = () => {
    setLoading(true);
    setTimeout(() => {
      setMarkdown(SAMPLE_README);
      setLoading(false);
    }, 1200);
  };

  useEffect(() => {
    if (markdown && workspaceRef.current) {
      workspaceRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [markdown]);

  const handleReset = () => {
    setMarkdown(null);
    setUrl("");
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero url={url} setUrl={setUrl} onGenerate={handleGenerate} loading={loading} />
        {markdown !== null && (
          <div ref={workspaceRef} className="scroll-mt-20">
            <Workspace markdown={markdown} setMarkdown={setMarkdown} onReset={handleReset} />
          </div>
        )}
        <Features />
        <CtaBanner />
      </main>
      <Footer />
    </div>
  );
}
