import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "2.0.0",
    backend: process.env.BACKEND_URL || "http://127.0.0.1:8000",
    github_auth: !!process.env.GITHUB_TOKEN,
  })
}
