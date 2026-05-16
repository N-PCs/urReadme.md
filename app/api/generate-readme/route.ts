import { NextRequest, NextResponse } from "next/server"
import {
  analyzeRepo,
  GitHubError,
} from "@/lib/github-service"
import {
  generateReadme,
  generateReadmeStream,
} from "@/lib/llm-service"
import { SAMPLE_README } from "@/lib/sample-readme"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  let body: { repo_url?: string; stream?: boolean }

  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { detail: "Invalid JSON body." },
      { status: 400 },
    )
  }

  const repoUrl = body.repo_url?.trim()
  if (!repoUrl) {
    return NextResponse.json(
      { detail: "Missing required field: repo_url" },
      { status: 422 },
    )
  }

  const githubToken = process.env.GITHUB_TOKEN
  const openaiKey = process.env.OPENAI_API_KEY

  // ------ Analyze the repository ------
  let analysis
  try {
    analysis = await analyzeRepo(repoUrl, githubToken)
  } catch (err) {
    if (err instanceof GitHubError) {
      return NextResponse.json(
        { detail: err.message },
        { status: err.statusCode },
      )
    }
    return NextResponse.json(
      { detail: `Failed to analyze repository: ${err}` },
      { status: 500 },
    )
  }

  // ------ Check for OpenAI key, fallback to mock ------
  if (!openaiKey) {
    // No API key configured — return mock data with repo metadata
    if (body.stream) {
      const encoder = new TextEncoder()
      const lines = SAMPLE_README.split("\n")
      const stream = new ReadableStream({
        async start(controller) {
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i] + (i < lines.length - 1 ? "\n" : "")
            controller.enqueue(
              encoder.encode(`data: ${line}\n\n`),
            )
            // Simulate typing delay
            await new Promise((r) => setTimeout(r, 30))
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        },
      })
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      })
    }

    return NextResponse.json({
      readme: SAMPLE_README,
      repo_name: analysis.meta.fullName,
      language: analysis.meta.language,
      stars: analysis.meta.stars,
      license: analysis.licenseName,
      _mock: true,
    })
  }

  // ------ Stream mode ------
  if (body.stream) {
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const token of generateReadmeStream(
            analysis,
            openaiKey,
            process.env.OPENAI_MODEL || "gpt-4o",
          )) {
            controller.enqueue(
              encoder.encode(`data: ${token}\n\n`),
            )
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        } catch (err) {
          controller.enqueue(
            encoder.encode(`data: [ERROR] ${err}\n\n`),
          )
        }
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    })
  }

  // ------ Non-streaming mode ------
  try {
    const readme = await generateReadme(
      analysis,
      openaiKey,
      process.env.OPENAI_MODEL || "gpt-4o",
    )
    return NextResponse.json({
      readme,
      repo_name: analysis.meta.fullName,
      language: analysis.meta.language,
      stars: analysis.meta.stars,
      license: analysis.licenseName,
    })
  } catch (err) {
    return NextResponse.json(
      { detail: `LLM generation failed: ${err}` },
      { status: 500 },
    )
  }
}
