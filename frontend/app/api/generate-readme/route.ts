import { NextRequest, NextResponse } from "next/server"
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
  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000"

  // Proxy to the FastAPI backend
  try {
    const response = await fetch(`${backendUrl}/generate-readme`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": githubToken ? `Bearer ${githubToken}` : "",
      },
      body: JSON.stringify({
        repo_url: repoUrl,
        stream: body.stream || false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { detail: errorData.detail || "Backend error" },
        { status: response.status },
      )
    }

    // If streaming, pipe the response
    if (body.stream && response.body) {
      return new Response(response.body, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          "X-Accel-Buffering": "no",
        },
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error("Failed to connect to backend:", err)
    // Fallback to mock data if backend is down
    if (body.stream) {
      const encoder = new TextEncoder()
      const lines = SAMPLE_README.split("\n")
      const stream = new ReadableStream({
        async start(controller) {
          for (let i = 0; i < lines.length; i++) {
            const line = lines[i] + (i < lines.length - 1 ? "\n" : "")
            controller.enqueue(encoder.encode(`data: ${line}\n\n`))
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
      repo_name: "fallback/repo",
      _mock: true,
    })
  }
}
