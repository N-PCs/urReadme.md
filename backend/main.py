"""urReadme.md — FastAPI backend.

Provides the ``/generate-readme`` endpoint that accepts a GitHub repo URL,
fetches repository data via the GitHub API, constructs an LLM prompt, and
returns a generated README in Markdown.

Routes are defined *without* the ``/api`` prefix because Vercel Services
strips the ``routePrefix`` before forwarding to this service.
"""

from __future__ import annotations

import os
import json
import traceback

import fastapi
import fastapi.middleware.cors
from fastapi import Request
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel, Field

from services.github_service import (
    GitHubError,
    InvalidRepoURL,
    RateLimitExceeded,
    RepoNotFound,
    analyze_repo,
)
from services.llm_service import generate_readme, generate_readme_stream

# ---------------------------------------------------------------------------
# App & middleware
# ---------------------------------------------------------------------------

app = fastapi.FastAPI(
    title="urReadme.md API",
    version="2.0.0",
    description="Generate production-ready README files from GitHub repositories.",
)

# CORS — allow the Next.js frontend (local dev on port 3000 + production)
app.add_middleware(
    fastapi.middleware.cors.CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        os.getenv("FRONTEND_URL", "*"),
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Global exception handler for GitHub errors
# ---------------------------------------------------------------------------

@app.exception_handler(GitHubError)
async def github_error_handler(_request: Request, exc: GitHubError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": str(exc)},
    )


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class GenerateRequest(BaseModel):
    repo_url: str = Field(
        ...,
        min_length=5,
        examples=["https://github.com/vercel/next.js"],
        description="Full GitHub repository URL (https or shorthand).",
    )
    gemini_api_key: str = Field(
        ...,
        min_length=10,
        description="User-provided Google Gemini API key for README generation.",
    )
    stream: bool = Field(
        default=False,
        description="If true, stream the README as text/event-stream.",
    )


class GenerateResponse(BaseModel):
    readme: str = Field(description="Generated README in Markdown format.")
    repo_name: str = Field(description="Full repository name (owner/repo).")
    language: str | None = Field(description="Primary language of the repo.")
    stars: int = Field(description="Star count.")
    license: str | None = Field(description="Detected SPDX license identifier.")


class HealthResponse(BaseModel):
    status: str
    version: str


class ErrorResponse(BaseModel):
    detail: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Health check for monitoring and readiness probes."""
    return HealthResponse(status="ok", version="2.0.0")


@app.post(
    "/generate-readme",
    response_model=GenerateResponse,
    responses={
        422: {"model": ErrorResponse, "description": "Invalid GitHub URL"},
        404: {"model": ErrorResponse, "description": "Repository not found"},
        429: {"model": ErrorResponse, "description": "GitHub rate limit exceeded"},
        500: {"model": ErrorResponse, "description": "Internal server error"},
    },
)
async def generate_readme_endpoint(body: GenerateRequest):
    """Analyze a GitHub repository and generate a comprehensive README.

    1. Parses the provided ``repo_url``.
    2. Fetches repo metadata, file tree, and key files via the GitHub API.
    3. Constructs a dense prompt and sends it to Gemini using the user's API key.
    4. Returns the generated README Markdown (or streams it).
    """
    api_key = body.gemini_api_key.strip()
    if not api_key:
        return JSONResponse(
            status_code=401,
            content={"detail": "Gemini API key is required."},
        )

    github_token = os.getenv("GITHUB_TOKEN")

    # ------ Analyze the repository ------
    try:
        analysis = await analyze_repo(body.repo_url, github_token=github_token)
    except GitHubError:
        raise  # handled by the global exception handler
    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Failed to analyze repository: {exc}",
            },
        )

    # ------ Streaming mode ------
    if body.stream:
        async def event_stream():
            try:
                async for chunk in generate_readme_stream(analysis, api_key):
                    yield f"data: {json.dumps(chunk)}\n\n"
                yield "data: [DONE]\n\n"
            except Exception as exc:
                traceback.print_exc()
                yield f"data: [ERROR]{exc}\n\n"

        return StreamingResponse(event_stream(), media_type="text/event-stream")

    # ------ Non-streaming mode ------
    try:
        readme = generate_readme(analysis, api_key)
    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Gemini generation failed: {exc}"},
        )

    return GenerateResponse(
        readme=readme,
        repo_name=analysis.meta.full_name,
        language=analysis.meta.language,
        stars=analysis.meta.stars,
        license=analysis.license_name,
    )


@app.post("/analyze-repo")
async def analyze_repo_endpoint(body: GenerateRequest):
    """Return raw repository analysis data without LLM generation.
    Useful for debugging or showing repo info in the UI before generating.
    """
    github_token = os.getenv("GITHUB_TOKEN")

    try:
        analysis = await analyze_repo(body.repo_url, github_token=github_token)
    except GitHubError:
        raise
    except Exception as exc:
        traceback.print_exc()
        return JSONResponse(
            status_code=500,
            content={"detail": f"Failed to analyze repository: {exc}"},
        )

    return {
        "meta": {
            "full_name": analysis.meta.full_name,
            "description": analysis.meta.description,
            "language": analysis.meta.language,
            "stars": analysis.meta.stars,
            "forks": analysis.meta.forks,
            "topics": analysis.meta.topics,
            "default_branch": analysis.meta.default_branch,
        },
        "tree_count": len(analysis.tree),
        "key_files": list(analysis.key_files.keys()),
        "license_name": analysis.license_name,
    }
