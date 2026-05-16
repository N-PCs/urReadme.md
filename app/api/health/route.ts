import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    status: "ok",
    version: "2.0.0",
    services: {
      github: !!process.env.GITHUB_TOKEN,
      openai: !!process.env.OPENAI_API_KEY,
    },
  })
}
