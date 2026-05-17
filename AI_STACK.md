# AI Stack & Custom LLM Setup

## 🧠 AI Architecture Overview

**urReadme.md** uses a **custom transformer-based LLM** (not OpenAI), specifically:
- **Model**: Google's FLAN-T5-small
- **Framework**: Hugging Face Transformers
- **Hardware**: CPU-optimized (no GPU required)
- **Inference Location**: Backend (FastAPI)

---

## How It Works

### 1. **Repository Analysis** (GitHub API)
```
[User URL] → [GitHub API] → [Tree + Key Files] → [Analysis Service]
```
The backend fetches:
- Repository structure (file tree)
- Key files: `package.json`, `requirements.txt`, `setup.py`, etc.
- Language detection
- License information
- Repository metadata

**File**: `backend/services/github_service.py`

### 2. **README Generation** (Custom LLM)
```
[Analysis] → [FLAN-T5 Model] → [Structured Prompt] → [Generated README]
```

The backend uses the FLAN-T5 transformer model to:
- Write introduction & theory sections
- Generate feature lists
- Create tech stack summaries
- Add installation instructions
- Apply proper formatting

**Model**: `google/flan-t5-small`
**File**: `backend/services/llm_service.py`

### 3. **Frontend Proxy** (Next.js API Route)
```
[Frontend Request] → [Next.js API Route] → [Backend FastAPI] → [Response]
```

The frontend proxies requests to the backend:
- Does NOT process AI/LLM locally
- Streams README generation in real-time (Server-Sent Events)
- Falls back to sample README if backend is down

**File**: `frontend/app/api/generate-readme/route.ts`

---

## 🔧 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  UI Layer (React Components)                            │  │
│  │  - Hero, Navbar, Workspace, Features                   │  │
│  │  - Real-time Markdown preview                          │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  API Routes (Next.js App Router)                        │  │
│  │  /api/generate-readme → Proxy to backend               │  │
│  │  /api/health         → Health check                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (HTTP/SSE)
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Generate README Endpoint                               │  │
│  │  POST /generate-readme                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  GitHub Service (analyze_repo)                          │  │
│  │  - Fetch repo tree                                      │  │
│  │  - Read key configuration files                         │  │
│  │  - Detect language & tech stack                         │  │
│  │  - Extract license info                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  LLM Service (Custom Transformer)                       │  │
│  │  - Load FLAN-T5 model                                   │  │
│  │  - Generate text sections                               │  │
│  │  - Structure full README                                │  │
│  │  - Stream output (SSE)                                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  External APIs                                          │  │
│  │  - GitHub API (public repos)                            │  │
│  │  - Hugging Face (model download - first run only)      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📦 Dependencies

### Backend (Python)
```
fastapi>=0.128.1           # Web framework
httpx>=0.28.0              # HTTP client
pydantic>=2.11.0           # Data validation
uvicorn>=0.34.0            # ASGI server
transformers>=4.40.0       # Hugging Face Transformers
torch>=2.12.0              # PyTorch (CPU version)
sentencepiece>=0.2.0       # Tokenizer for FLAN-T5
python-dotenv>=1.0.1       # Environment variables
```

### Frontend (Node.js)
```
next@16.2.6                # React framework
react@19                   # UI library
tailwindcss@4.2.0          # Styling
typescript@5.7.3           # Type safety
```

**Note**: OpenAI dependency has been removed. No external LLM APIs are used.

---

## 🎯 Key Characteristics of FLAN-T5

### ✅ Advantages
- **Free** - No API costs
- **Privacy** - Everything runs locally/on-premise
- **Fast** - CPU inference is fast enough (1-3 seconds per README)
- **Reliable** - No rate limits or external dependencies
- **Lightweight** - Small enough to run on basic VPS/Render

### ⚠️ Trade-offs
- **Quality** - Smaller than GPT-4o (but still very good for documentation)
- **Context window** - Limited compared to larger models
- **Speed** - Slower than cached API calls (but independent)

---

## 🔄 Request Flow Example

### User generates README for `https://github.com/vercel/next.js`

1. **Frontend** (port 3000)
   ```javascript
   POST /api/generate-readme
   { repo_url: "https://github.com/vercel/next.js", stream: true }
   ```

2. **Frontend API Route** (`frontend/app/api/generate-readme/route.ts`)
   ```javascript
   POST http://localhost:8000/generate-readme  // (or production backend URL)
   // Proxies to backend, returns stream
   ```

3. **Backend** (port 8000)
   ```python
   POST /generate-readme
   # Calls analyze_repo() → GitHub API calls
   # Calls generate_readme() → FLAN-T5 model
   # Streams response via SSE
   ```

4. **Backend Analysis** (`backend/services/github_service.py`)
   ```
   - Parses URL: vercel/next.js
   - Fetches /repos/vercel/next.js (GitHub API)
   - Reads tree, package.json, README, license
   - Returns RepoAnalysis object
   ```

5. **Backend LLM** (`backend/services/llm_service.py`)
   ```
   - Lazy-loads: google/flan-t5-small
   - Generates:
     * Introduction prompt
     * Features prompt
     * Uses actual file tree
   - Assembles full README in Markdown
   ```

6. **Frontend UI**
   ```
   - Receives streamed README chunks
   - Updates editor & preview in real-time
   - User can edit, download, or regenerate
   ```

---

## 🚀 Deployment

### Backend Deployment
- **Platform**: Render, Railway, Heroku, AWS, etc.
- **Environment Variables**: `FRONTEND_URL` (for CORS)
- **Python**: 3.9+
- **Resources**: CPU-based (no GPU needed)

### Frontend Deployment
- **Platform**: Vercel (recommended), Netlify, etc.
- **Environment Variables**:
  - `BACKEND_URL` - Your backend API URL
  - `GITHUB_TOKEN` - Optional (for higher rate limits)

---

## 📝 Custom Configuration

### Override Temperature/Sampling (if needed)
Edit `backend/services/llm_service.py`:
```python
result = model(prompt, max_length=150, temperature=0.7)
                                      # ^ Adjust creativity (0-1)
```

### Change Model Size
Current: `google/flan-t5-small`
Options:
- `google/flan-t5-base` (larger, slower, better quality)
- `google/flan-t5-large` (much slower, best quality)

Edit in `backend/services/llm_service.py`:
```python
_model = pipeline(
    "text2text-generation",
    model="google/flan-t5-base",  # Change here
    device=-1  # CPU
)
```

---

## ❌ Files Removed (OpenAI Integration)

The following OpenAI-related files and references were removed:

### Code Files
- ❌ `frontend/lib/llm-service.ts` (used OpenAI API)
- ❌ OpenAI imports from `frontend/app/api/generate-readme/route.ts`

### Configuration
- ❌ `OPENAI_API_KEY` from `frontend/.env.example`
- ❌ `openai>=1.82.0` from `backend/pyproject.toml`
- ❌ OpenAI mentions from `vercel.json`
- ❌ OpenAI references from deployment docs

### UI Updates
- ❌ Removed "Powered by GPT-4o" from Hero component
- ❌ Updated health check endpoint
- ❌ Removed gpt-4o reference from sample README

---

## 🧪 Testing the Setup

### Test Backend
```bash
cd backend
curl -X POST http://localhost:8000/generate-readme \
  -H "Content-Type: application/json" \
  -d '{"repo_url": "https://github.com/torvalds/linux", "stream": false}'
```

### Test Frontend
```bash
cd frontend
npm run dev
# Go to http://localhost:3000
# Enter a repo URL
```

### Test Health
```bash
curl http://localhost:3000/api/health
# Should return:
# {
#   "status": "ok",
#   "version": "2.0.0",
#   "backend": "http://localhost:8000",
#   "github_auth": true/false
# }
```

---

## 📚 References

- [FLAN-T5 Hugging Face](https://huggingface.co/google/flan-t5-small)
- [Transformers Library](https://huggingface.co/docs/transformers/)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)

---

## ✨ Summary

Your **urReadme.md** uses a **100% custom LLM stack**:
- ✅ No OpenAI API calls
- ✅ No external LLM dependencies
- ✅ Full privacy & control
- ✅ Cost-effective (no API bills)
- ✅ Self-hostable on any server

All AI generation happens on your backend using Google's FLAN-T5 transformer model!
