import { NextRequest, NextResponse } from "next/server"

export const maxDuration = 60

export async function POST(req: NextRequest) {
  let body: { repo_url?: string; stream?: boolean; gemini_api_key?: string }

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

  const geminiApiKey = body.gemini_api_key?.trim()
  if (!geminiApiKey || geminiApiKey.length < 10) {
    return NextResponse.json(
      { detail: "Gemini API key is required. Please enter your key to use this site." },
      { status: 401 },
    )
  }

  const githubToken = process.env.GITHUB_TOKEN
  const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000"

  try {
    const response = await fetch(`${backendUrl}/generate-readme`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": githubToken ? `Bearer ${githubToken}` : "",
      },
      body: JSON.stringify({
        repo_url: repoUrl,
        gemini_api_key: geminiApiKey,
        stream: body.stream || false,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      return NextResponse.json(
        { detail: errorData.detail || "Backend error" },
        { status: response.status },
      )
    }

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
    return NextResponse.json(
      { detail: "Could not reach the backend server. Make sure it is running." },
      { status: 503 },
    )
  }
}
