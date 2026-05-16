"""GitHub repository analysis service.

Handles URL parsing, file-tree fetching via the GitHub API,
reading key files (package.json, requirements.txt, etc.),
and license detection — all with proper error handling for
invalid URLs, missing repos, and rate limits.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any

import httpx

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

GITHUB_API = "https://api.github.com"

# Files we always try to read from the repo root
KEY_FILES: list[str] = [
    "package.json",
    "requirements.txt",
    "pyproject.toml",
    "Cargo.toml",
    "go.mod",
    "Makefile",
    "Dockerfile",
    "docker-compose.yml",
    "docker-compose.yaml",
    "setup.py",
    "setup.cfg",
    "main.py",
    "main.ts",
    "main.go",
    "index.ts",
    "index.js",
    "app.py",
    "manage.py",
    "CMakeLists.txt",
    ".env.example",
    "tsconfig.json",
    "next.config.mjs",
    "next.config.js",
    "next.config.ts",
    "vite.config.ts",
    "vite.config.js",
]

LICENSE_NAMES: list[str] = [
    "LICENSE",
    "LICENSE.md",
    "LICENSE.txt",
    "LICENCE",
    "LICENCE.md",
    "LICENCE.txt",
    "COPYING",
]

MAX_FILE_SIZE = 80_000  # bytes – skip very large files


# ---------------------------------------------------------------------------
# Data classes
# ---------------------------------------------------------------------------

@dataclass
class RepoMeta:
    owner: str
    name: str
    full_name: str
    description: str | None
    default_branch: str
    language: str | None
    stars: int
    forks: int
    topics: list[str]
    homepage: str | None


@dataclass
class RepoAnalysis:
    meta: RepoMeta
    tree: list[str]
    key_files: dict[str, str]
    license_content: str | None
    license_name: str | None


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------

class GitHubError(Exception):
    """Base class for GitHub-related errors."""

    def __init__(self, message: str, status_code: int = 500) -> None:
        super().__init__(message)
        self.status_code = status_code


class InvalidRepoURL(GitHubError):
    def __init__(self, url: str) -> None:
        super().__init__(
            f"Invalid GitHub repository URL: '{url}'. "
            "Expected format: https://github.com/owner/repo",
            status_code=422,
        )


class RepoNotFound(GitHubError):
    def __init__(self, owner: str, repo: str) -> None:
        super().__init__(
            f"Repository '{owner}/{repo}' not found or is private.",
            status_code=404,
        )


class RateLimitExceeded(GitHubError):
    def __init__(self) -> None:
        super().__init__(
            "GitHub API rate limit exceeded. Please try again later or "
            "provide a GITHUB_TOKEN environment variable.",
            status_code=429,
        )


# ---------------------------------------------------------------------------
# URL parsing
# ---------------------------------------------------------------------------

_GITHUB_RE = re.compile(
    r"(?:https?://)?(?:www\.)?github\.com/(?P<owner>[^/]+)/(?P<repo>[^/\s#?]+)",
    re.IGNORECASE,
)


def parse_repo_url(raw_url: str) -> tuple[str, str]:
    """Extract ``(owner, repo)`` from a GitHub URL.

    Accepts formats like:
    - https://github.com/owner/repo
    - github.com/owner/repo
    - http://www.github.com/owner/repo/tree/main
    """
    m = _GITHUB_RE.match(raw_url.strip())
    if not m:
        raise InvalidRepoURL(raw_url)
    repo_name = m.group("repo").removesuffix(".git")
    return m.group("owner"), repo_name


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def _build_headers(token: str | None) -> dict[str, str]:
    headers: dict[str, str] = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def _check_response(resp: httpx.Response, owner: str, repo: str) -> None:
    if resp.status_code == 404:
        raise RepoNotFound(owner, repo)
    if resp.status_code == 403 and "rate limit" in resp.text.lower():
        raise RateLimitExceeded()
    if resp.status_code == 429:
        raise RateLimitExceeded()
    resp.raise_for_status()


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def analyze_repo(
    raw_url: str,
    github_token: str | None = None,
) -> RepoAnalysis:
    """Full pipeline: parse URL -> fetch metadata -> fetch tree -> read key files."""

    owner, repo = parse_repo_url(raw_url)
    headers = _build_headers(github_token)

    async with httpx.AsyncClient(
        base_url=GITHUB_API,
        headers=headers,
        timeout=30.0,
        follow_redirects=True,
    ) as client:
        # 1. Repository metadata
        meta = await _fetch_meta(client, owner, repo)

        # 2. Full file tree (recursive)
        tree = await _fetch_tree(client, owner, repo, meta.default_branch)

        # 3. Read key root files
        key_files = await _fetch_key_files(client, owner, repo, meta.default_branch, tree)

        # 4. License detection
        license_content, license_name = await _fetch_license(
            client, owner, repo, meta.default_branch, tree,
        )

    return RepoAnalysis(
        meta=meta,
        tree=tree,
        key_files=key_files,
        license_content=license_content,
        license_name=license_name,
    )


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

async def _fetch_meta(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
) -> RepoMeta:
    resp = await client.get(f"/repos/{owner}/{repo}")
    _check_response(resp, owner, repo)
    data: dict[str, Any] = resp.json()
    return RepoMeta(
        owner=data["owner"]["login"],
        name=data["name"],
        full_name=data["full_name"],
        description=data.get("description"),
        default_branch=data.get("default_branch", "main"),
        language=data.get("language"),
        stars=data.get("stargazers_count", 0),
        forks=data.get("forks_count", 0),
        topics=data.get("topics", []),
        homepage=data.get("homepage"),
    )


async def _fetch_tree(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
    branch: str,
) -> list[str]:
    """Fetch the full recursive tree, returning a list of file paths."""
    resp = await client.get(
        f"/repos/{owner}/{repo}/git/trees/{branch}",
        params={"recursive": "1"},
    )
    _check_response(resp, owner, repo)
    data = resp.json()
    paths: list[str] = []
    for item in data.get("tree", []):
        if item.get("type") == "blob":
            paths.append(item["path"])
    # Sort for deterministic output and limit to first 500 for large repos
    paths.sort()
    return paths[:500]


async def _fetch_file_content(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
    branch: str,
    path: str,
) -> str | None:
    """Download a single file's raw content. Returns None on failure."""
    url = f"https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}"
    try:
        resp = await client.get(url)
        if resp.status_code != 200:
            return None
        if len(resp.content) > MAX_FILE_SIZE:
            return f"[File too large: {len(resp.content):,} bytes — truncated]\n" + resp.text[:4000]
        return resp.text
    except Exception:
        return None


async def _fetch_key_files(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
    branch: str,
    tree: list[str],
) -> dict[str, str]:
    """Read well-known config and entry-point files from the repo root."""
    root_files = {p for p in tree if "/" not in p}
    targets = [f for f in KEY_FILES if f in root_files]

    results: dict[str, str] = {}
    for fname in targets:
        content = await _fetch_file_content(client, owner, repo, branch, fname)
        if content is not None:
            results[fname] = content
    return results


async def _fetch_license(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
    branch: str,
    tree: list[str],
) -> tuple[str | None, str | None]:
    """Detect and read the license file. Also tries the GitHub license API."""

    # Try the dedicated license endpoint first
    resp = await client.get(f"/repos/{owner}/{repo}/license")
    if resp.status_code == 200:
        data = resp.json()
        license_name = data.get("license", {}).get("spdx_id")
        content = await _fetch_file_content(
            client, owner, repo, branch, data.get("path", "LICENSE"),
        )
        return content, license_name

    # Fallback: look for common license file names in the tree
    root_files = {p for p in tree if "/" not in p}
    for name in LICENSE_NAMES:
        if name in root_files:
            content = await _fetch_file_content(client, owner, repo, branch, name)
            return content, None

    return None, None
