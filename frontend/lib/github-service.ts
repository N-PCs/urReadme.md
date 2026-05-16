/**
 * GitHub repository analysis service.
 *
 * Handles URL parsing, file-tree fetching via the GitHub REST API,
 * reading key files (package.json, requirements.txt, etc.),
 * and license detection — all with proper error handling for
 * invalid URLs, missing repos, and rate limits.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GITHUB_API = "https://api.github.com"

const KEY_FILES = [
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
] as const

const LICENSE_NAMES = [
  "LICENSE",
  "LICENSE.md",
  "LICENSE.txt",
  "LICENCE",
  "LICENCE.md",
  "LICENCE.txt",
  "COPYING",
] as const

const MAX_FILE_SIZE = 80_000

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RepoMeta {
  owner: string
  name: string
  fullName: string
  description: string | null
  defaultBranch: string
  language: string | null
  stars: number
  forks: number
  topics: string[]
  homepage: string | null
}

export interface RepoAnalysis {
  meta: RepoMeta
  tree: string[]
  keyFiles: Record<string, string>
  licenseContent: string | null
  licenseName: string | null
}

// ---------------------------------------------------------------------------
// Errors
// ---------------------------------------------------------------------------

export class GitHubError extends Error {
  statusCode: number
  constructor(message: string, statusCode = 500) {
    super(message)
    this.statusCode = statusCode
  }
}

export class InvalidRepoURL extends GitHubError {
  constructor(url: string) {
    super(
      `Invalid GitHub repository URL: '${url}'. Expected format: https://github.com/owner/repo`,
      422,
    )
  }
}

export class RepoNotFound extends GitHubError {
  constructor(owner: string, repo: string) {
    super(`Repository '${owner}/${repo}' not found or is private.`, 404)
  }
}

export class RateLimitExceeded extends GitHubError {
  constructor() {
    super(
      "GitHub API rate limit exceeded. Please try again later or provide a GITHUB_TOKEN environment variable.",
      429,
    )
  }
}

// ---------------------------------------------------------------------------
// URL parsing
// ---------------------------------------------------------------------------

const GITHUB_RE =
  /(?:https?:\/\/)?(?:www\.)?github\.com\/(?<owner>[^/]+)\/(?<repo>[^/\s#?]+)/i

export function parseRepoUrl(rawUrl: string): [string, string] {
  const m = rawUrl.trim().match(GITHUB_RE)
  if (!m?.groups) throw new InvalidRepoURL(rawUrl)
  const repo = m.groups.repo.replace(/\.git$/, "")
  return [m.groups.owner, repo]
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

function buildHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  }
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

function checkResponse(
  resp: Response,
  owner: string,
  repo: string,
): void {
  if (resp.status === 404) throw new RepoNotFound(owner, repo)
  if (resp.status === 403 || resp.status === 429) throw new RateLimitExceeded()
  if (!resp.ok) throw new GitHubError(`GitHub API error: ${resp.status}`, resp.status)
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function analyzeRepo(
  rawUrl: string,
  githubToken?: string,
): Promise<RepoAnalysis> {
  const [owner, repo] = parseRepoUrl(rawUrl)
  const headers = buildHeaders(githubToken)

  // 1. Metadata
  const meta = await fetchMeta(owner, repo, headers)

  // 2. File tree
  const tree = await fetchTree(owner, repo, meta.defaultBranch, headers)

  // 3. Key files
  const keyFiles = await fetchKeyFiles(owner, repo, meta.defaultBranch, tree, headers)

  // 4. License
  const { content: licenseContent, name: licenseName } = await fetchLicense(
    owner,
    repo,
    meta.defaultBranch,
    tree,
    headers,
  )

  return { meta, tree, keyFiles, licenseContent, licenseName }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function fetchMeta(
  owner: string,
  repo: string,
  headers: Record<string, string>,
): Promise<RepoMeta> {
  const resp = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, { headers })
  checkResponse(resp, owner, repo)
  const d = await resp.json()
  return {
    owner: d.owner.login,
    name: d.name,
    fullName: d.full_name,
    description: d.description ?? null,
    defaultBranch: d.default_branch ?? "main",
    language: d.language ?? null,
    stars: d.stargazers_count ?? 0,
    forks: d.forks_count ?? 0,
    topics: d.topics ?? [],
    homepage: d.homepage ?? null,
  }
}

async function fetchTree(
  owner: string,
  repo: string,
  branch: string,
  headers: Record<string, string>,
): Promise<string[]> {
  const resp = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`,
    { headers },
  )
  checkResponse(resp, owner, repo)
  const data = await resp.json()
  const paths: string[] = []
  for (const item of data.tree ?? []) {
    if (item.type === "blob") paths.push(item.path)
  }
  paths.sort()
  return paths.slice(0, 500)
}

async function fetchFileContent(
  owner: string,
  repo: string,
  branch: string,
  path: string,
  headers: Record<string, string>,
): Promise<string | null> {
  try {
    const resp = await fetch(
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
      { headers },
    )
    if (!resp.ok) return null
    const text = await resp.text()
    if (text.length > MAX_FILE_SIZE) {
      return `[File too large: ${text.length.toLocaleString()} bytes — truncated]\n${text.slice(0, 4000)}`
    }
    return text
  } catch {
    return null
  }
}

async function fetchKeyFiles(
  owner: string,
  repo: string,
  branch: string,
  tree: string[],
  headers: Record<string, string>,
): Promise<Record<string, string>> {
  const rootFiles = new Set(tree.filter((p) => !p.includes("/")))
  const targets = KEY_FILES.filter((f) => rootFiles.has(f))

  const results: Record<string, string> = {}
  // Fetch in parallel, 5 at a time
  const batches: string[][] = []
  for (let i = 0; i < targets.length; i += 5) {
    batches.push(targets.slice(i, i + 5))
  }
  for (const batch of batches) {
    const entries = await Promise.all(
      batch.map(async (fname) => {
        const content = await fetchFileContent(owner, repo, branch, fname, headers)
        return [fname, content] as const
      }),
    )
    for (const [fname, content] of entries) {
      if (content !== null) results[fname] = content
    }
  }
  return results
}

async function fetchLicense(
  owner: string,
  repo: string,
  branch: string,
  tree: string[],
  headers: Record<string, string>,
): Promise<{ content: string | null; name: string | null }> {
  // Try the dedicated license endpoint
  try {
    const resp = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/license`, {
      headers,
    })
    if (resp.ok) {
      const data = await resp.json()
      const licenseName: string | null = data.license?.spdx_id ?? null
      const content = await fetchFileContent(
        owner,
        repo,
        branch,
        data.path ?? "LICENSE",
        headers,
      )
      return { content, name: licenseName }
    }
  } catch {
    // Fall through to manual search
  }

  // Fallback: look for license files in the tree
  const rootFiles = new Set(tree.filter((p) => !p.includes("/")))
  for (const name of LICENSE_NAMES) {
    if (rootFiles.has(name)) {
      const content = await fetchFileContent(owner, repo, branch, name, headers)
      return { content, name: null }
    }
  }

  return { content: null, name: null }
}
