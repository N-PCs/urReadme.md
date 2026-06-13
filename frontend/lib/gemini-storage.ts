const STORAGE_KEY = "gemini_api_key"

export function getGeminiApiKey(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setGeminiApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEY, key.trim())
}

export function clearGeminiApiKey(): void {
  localStorage.removeItem(STORAGE_KEY)
}
