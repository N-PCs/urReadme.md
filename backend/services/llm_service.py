"""Gemini-powered README generation service."""

from __future__ import annotations

import logging
from typing import AsyncIterator

import google.generativeai as genai
from google.api_core import exceptions as google_exceptions

from .github_service import RepoAnalysis

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-1.5-flash"


def _build_prompt(analysis: RepoAnalysis) -> str:
    """Build a dense prompt from repository analysis data."""
    meta = analysis.meta
    key_files = list(analysis.key_files.keys())
    tree_preview = "\n".join(f"  - {path}" for path in analysis.tree[:40])
    if len(analysis.tree) > 40:
        tree_preview += f"\n  - ... ({len(analysis.tree) - 40} more files)"

    key_file_snippets = ""
    for name, content in list(analysis.key_files.items())[:6]:
        snippet = content[:2000]
        key_file_snippets += f"\n### {name}\n```\n{snippet}\n```\n"

    return f"""You are an expert technical writer. Generate a comprehensive, production-ready README.md for this GitHub repository.

Repository: {meta.full_name}
Owner: {meta.owner}
Description: {meta.description or "No description provided"}
Primary language: {meta.language or "Unknown"}
Stars: {meta.stars}
Forks: {meta.forks}
Topics: {", ".join(meta.topics) if meta.topics else "None"}
License: {analysis.license_name or "Not detected"}
Default branch: {meta.default_branch}

File tree (sample):
{tree_preview}

Key configuration files found: {", ".join(key_files) if key_files else "None"}

Key file contents:
{key_file_snippets or "No key files available."}

Requirements:
- Output ONLY valid Markdown (no code fences wrapping the entire README).
- Include: title, badge-style metadata line, introduction, features, tech stack, project structure (ASCII tree), prerequisites, installation/setup, usage, contributing (brief), authors, license.
- Infer setup commands from detected files (package.json → npm, requirements.txt → pip, etc.).
- Use the actual repo name, owner, and detected license.
- Be specific to this repository — avoid generic filler.
- Use clear headings and emoji sparingly for section headers.
- Keep it professional and developer-friendly."""


def _extract_text(response) -> str:
    """Extract text from a Gemini response, raising on blocked/empty output."""
    if not response.candidates:
        raise ValueError("Gemini returned no candidates. The response may have been blocked.")

    candidate = response.candidates[0]
    if not candidate.content or not candidate.content.parts:
        raise ValueError("Gemini returned an empty response.")

    return "".join(part.text for part in candidate.content.parts if part.text)


def _handle_gemini_error(exc: Exception) -> None:
    """Translate Gemini API errors into user-friendly messages."""
    if isinstance(exc, google_exceptions.InvalidArgument):
        raise ValueError("Invalid Gemini API key. Please check your key and try again.") from exc
    if isinstance(exc, google_exceptions.PermissionDenied):
        raise ValueError("Gemini API key denied. Ensure your key is valid and has API access enabled.") from exc
    if isinstance(exc, google_exceptions.ResourceExhausted):
        raise ValueError("Gemini API rate limit exceeded. Please wait and try again.") from exc
    if isinstance(exc, google_exceptions.Unauthenticated):
        raise ValueError("Gemini API authentication failed. Please verify your API key.") from exc
    raise exc


def generate_readme(analysis: RepoAnalysis, api_key: str) -> str:
    """Generate a full README.md using the Gemini API."""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)
    prompt = _build_prompt(analysis)

    try:
        response = model.generate_content(prompt)
        return _extract_text(response).strip()
    except Exception as exc:
        logger.error("Gemini generation failed: %s", exc)
        _handle_gemini_error(exc)
        raise


async def generate_readme_stream(analysis: RepoAnalysis, api_key: str) -> AsyncIterator[str]:
    """Stream README generation chunks from Gemini."""
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(GEMINI_MODEL)
    prompt = _build_prompt(analysis)

    try:
        response = model.generate_content(prompt, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as exc:
        logger.error("Gemini streaming failed: %s", exc)
        _handle_gemini_error(exc)
        raise
