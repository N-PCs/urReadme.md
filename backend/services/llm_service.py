"""LLM prompt construction and README generation.

Builds a dense, structured prompt from the RepoAnalysis data and sends
it to OpenAI (or compatible) to produce a comprehensive README.
"""

from __future__ import annotations

import os
from textwrap import dedent

from openai import AsyncOpenAI

from .github_service import RepoAnalysis

# ---------------------------------------------------------------------------
# Client factory
# ---------------------------------------------------------------------------

def _get_client() -> AsyncOpenAI:
    """Instantiate the OpenAI async client using env vars."""
    return AsyncOpenAI(
        api_key=os.getenv("OPENAI_API_KEY", ""),
    )


# ---------------------------------------------------------------------------
# Prompt construction
# ---------------------------------------------------------------------------

def _format_tree(tree: list[str], max_lines: int = 120) -> str:
    """Pretty-print the file tree, truncating for huge repos."""
    if len(tree) <= max_lines:
        return "\n".join(tree)
    half = max_lines // 2
    omitted = len(tree) - max_lines
    return (
        "\n".join(tree[:half])
        + f"\n\n... ({omitted} more files omitted) ...\n\n"
        + "\n".join(tree[-half:])
    )


def _format_key_files(key_files: dict[str, str]) -> str:
    """Render each key file's contents inside fenced blocks."""
    if not key_files:
        return "(No key configuration files found at the repository root.)"
    parts: list[str] = []
    for name, content in key_files.items():
        # Truncate individual file content for prompt budget
        truncated = content[:6000]
        if len(content) > 6000:
            truncated += "\n\n[...truncated...]"
        parts.append(f"### {name}\n```\n{truncated}\n```")
    return "\n\n".join(parts)


def build_prompt(analysis: RepoAnalysis) -> str:
    """Construct the full system + user prompt payload."""

    meta = analysis.meta
    topics_str = ", ".join(meta.topics) if meta.topics else "none"
    license_section = ""
    if analysis.license_name:
        license_section = f"Detected license: {analysis.license_name}"
    elif analysis.license_content:
        license_section = (
            "A LICENSE file was found but its SPDX identifier is unknown. "
            "Here are the first 500 characters:\n"
            + analysis.license_content[:500]
        )
    else:
        license_section = "No license file detected."

    user_prompt = dedent(f"""\
    Analyze the following GitHub repository and generate a comprehensive,
    production-quality README.md in Markdown.

    ═══════════════════════════════════════════════════════════
    REPOSITORY METADATA
    ═══════════════════════════════════════════════════════════
    • Name: {meta.full_name}
    • Description: {meta.description or '(none)'}
    • Primary language: {meta.language or 'unknown'}
    • Stars: {meta.stars:,}  |  Forks: {meta.forks:,}
    • Topics: {topics_str}
    • Homepage: {meta.homepage or '(none)'}
    • Default branch: {meta.default_branch}

    ═══════════════════════════════════════════════════════════
    FILE TREE (top {len(analysis.tree)} files)
    ═══════════════════════════════════════════════════════════
    {_format_tree(analysis.tree)}

    ═══════════════════════════════════════════════════════════
    KEY FILES (contents)
    ═══════════════════════════════════════════════════════════
    {_format_key_files(analysis.key_files)}

    ═══════════════════════════════════════════════════════════
    LICENSE
    ═══════════════════════════════════════════════════════════
    {license_section}
    """)

    return user_prompt


SYSTEM_PROMPT = dedent("""\
You are an expert technical writer specializing in open-source documentation.
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
   - A 2–3 paragraph overview of what the project does, who it is for,
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
   - Brief contributing guidelines (fork → branch → PR workflow).

10. **Authors**
    - Credit the repository owner. If contributor info is not available,
      use the GitHub owner as the primary author.

11. **License**
    - State the license name and link to the LICENSE file.

Rules:
- Output ONLY raw Markdown. No commentary, no "```markdown" wrapper.
- Use proper GFM: fenced code blocks with language hints, tables where
  appropriate, task lists if relevant.
- Infer technologies, frameworks, and patterns from the file tree and
  key file contents. Do not hallucinate features that are not evidenced.
- Keep the tone professional but approachable.
- Prefer concise sentences. Avoid filler.
""")


# ---------------------------------------------------------------------------
# Generation
# ---------------------------------------------------------------------------

async def generate_readme(analysis: RepoAnalysis) -> str:
    """Send the constructed prompt to the LLM and return the README text."""

    client = _get_client()
    user_prompt = build_prompt(analysis)

    response = await client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.4,
        max_tokens=4096,
    )

    return response.choices[0].message.content or ""


async def generate_readme_stream(analysis: RepoAnalysis):
    """Stream the README generation token-by-token (yields strings)."""

    client = _get_client()
    user_prompt = build_prompt(analysis)

    stream = await client.chat.completions.create(
        model=os.getenv("OPENAI_MODEL", "gpt-4o"),
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.4,
        max_tokens=4096,
        stream=True,
    )

    async for chunk in stream:
        delta = chunk.choices[0].delta
        if delta.content:
            yield delta.content
