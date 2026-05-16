/**
 * LLM prompt construction and README generation.
 *
 * Builds a dense, structured prompt from the RepoAnalysis data and sends
 * it to OpenAI (or compatible) to produce a comprehensive README.
 */

import type { RepoAnalysis } from "./github-service"

// ---------------------------------------------------------------------------
// Prompt helpers
// ---------------------------------------------------------------------------

function formatTree(tree: string[], maxLines = 120): string {
  if (tree.length <= maxLines) return tree.join("\n")
  const half = Math.floor(maxLines / 2)
  const omitted = tree.length - maxLines
  return (
    tree.slice(0, half).join("\n") +
    `\n\n... (${omitted} more files omitted) ...\n\n` +
    tree.slice(-half).join("\n")
  )
}

function formatKeyFiles(keyFiles: Record<string, string>): string {
  const entries = Object.entries(keyFiles)
  if (entries.length === 0)
    return "(No key configuration files found at the repository root.)"

  return entries
    .map(([name, content]) => {
      const truncated =
        content.length > 6000
          ? content.slice(0, 6000) + "\n\n[...truncated...]"
          : content
      return `### ${name}\n\`\`\`\n${truncated}\n\`\`\``
    })
    .join("\n\n")
}

// ---------------------------------------------------------------------------
// System prompt
// ---------------------------------------------------------------------------

const SYSTEM_PROMPT = `You are an expert technical writer specializing in open-source documentation.
Given structured data about a GitHub repository (metadata, file tree, key file
contents, and license information), generate a **comprehensive, well-organized
README.md** in valid GitHub-Flavored Markdown.

The README **must** contain ALL of the following sections in this order:

1. **Title & Badges**
   - Project name as an H1.
   - A short tagline / one-liner description.
   - Shields.io badges for: build status (if CI config is found), license,
     language/version, and stars.

2. **Introduction**
   - A 2-3 paragraph overview of what the project does, who it is for,
     and what problems it solves.

3. **Why This Project? (Theory / Motivation)**
   - Explain the "why" behind the project — the gap it fills, the theory
     or principles it builds on, and how it differs from alternatives.

4. **Features**
   - A bullet list of the project's key capabilities.

5. **Project Structure**
   - An ASCII-style directory tree showing the most important files and
     folders (max ~25 entries). Annotate each entry briefly.

6. **Getting Started / How to Run Locally**
   - Prerequisites (runtime version, tools).
   - Step-by-step installation commands.
   - How to start the development server or run the main entry point.
   - Example usage or first command to try.

7. **Configuration** (if applicable)
   - Describe any configuration files, environment variables, or flags.

8. **API Reference / Usage** (if applicable)
   - Summarize key exports, CLI commands, or API endpoints.

9. **Contributing**
   - Brief contributing guidelines (fork -> branch -> PR workflow).

10. **Authors**
    - Credit the repository owner. If contributor info is not available,
      use the GitHub owner as the primary author.

11. **License**
    - State the license name and link to the LICENSE file.

Rules:
- Output ONLY raw Markdown. No commentary, no "\`\`\`markdown" wrapper.
- Use proper GFM: fenced code blocks with language hints, tables where
  appropriate, task lists if relevant.
- Infer technologies, frameworks, and patterns from the file tree and
  key file contents. Do not hallucinate features that are not evidenced.
- Keep the tone professional but approachable.
- Prefer concise sentences. Avoid filler.`

// ---------------------------------------------------------------------------
// Build the user message
// ---------------------------------------------------------------------------

export function buildPrompt(analysis: RepoAnalysis): string {
  const { meta } = analysis
  const topicsStr = meta.topics.length > 0 ? meta.topics.join(", ") : "none"

  let licenseSection: string
  if (analysis.licenseName) {
    licenseSection = `Detected license: ${analysis.licenseName}`
  } else if (analysis.licenseContent) {
    licenseSection =
      "A LICENSE file was found but its SPDX identifier is unknown. " +
      "Here are the first 500 characters:\n" +
      analysis.licenseContent.slice(0, 500)
  } else {
    licenseSection = "No license file detected."
  }

  return `Analyze the following GitHub repository and generate a comprehensive,
production-quality README.md in Markdown.

${"=".repeat(60)}
REPOSITORY METADATA
${"=".repeat(60)}
- Name: ${meta.fullName}
- Description: ${meta.description ?? "(none)"}
- Primary language: ${meta.language ?? "unknown"}
- Stars: ${meta.stars.toLocaleString()}  |  Forks: ${meta.forks.toLocaleString()}
- Topics: ${topicsStr}
- Homepage: ${meta.homepage ?? "(none)"}
- Default branch: ${meta.defaultBranch}

${"=".repeat(60)}
FILE TREE (top ${analysis.tree.length} files)
${"=".repeat(60)}
${formatTree(analysis.tree)}

${"=".repeat(60)}
KEY FILES (contents)
${"=".repeat(60)}
${formatKeyFiles(analysis.keyFiles)}

${"=".repeat(60)}
LICENSE
${"=".repeat(60)}
${licenseSection}`
}

// ---------------------------------------------------------------------------
// Generation (streaming)
// ---------------------------------------------------------------------------

export async function* generateReadmeStream(
  analysis: RepoAnalysis,
  apiKey: string,
  model = "gpt-4o",
): AsyncGenerator<string> {
  const userPrompt = buildPrompt(analysis)

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 4096,
      stream: true,
    }),
  })

  if (!resp.ok) {
    const error = await resp.text()
    throw new Error(`OpenAI API error (${resp.status}): ${error}`)
  }

  const reader = resp.body?.getReader()
  if (!reader) throw new Error("No response body from OpenAI")

  const decoder = new TextDecoder()
  let buffer = ""

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split("\n")
    buffer = lines.pop() ?? ""

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith("data: ")) continue
      const data = trimmed.slice(6)
      if (data === "[DONE]") return
      try {
        const parsed = JSON.parse(data)
        const content = parsed.choices?.[0]?.delta?.content
        if (content) yield content
      } catch {
        // Skip malformed JSON chunks
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Generation (non-streaming)
// ---------------------------------------------------------------------------

export async function generateReadme(
  analysis: RepoAnalysis,
  apiKey: string,
  model = "gpt-4o",
): Promise<string> {
  const userPrompt = buildPrompt(analysis)

  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 4096,
    }),
  })

  if (!resp.ok) {
    const error = await resp.text()
    throw new Error(`OpenAI API error (${resp.status}): ${error}`)
  }

  const data = await resp.json()
  return data.choices?.[0]?.message?.content ?? ""
}
