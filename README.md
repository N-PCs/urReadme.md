# urReadme.md 🚀

**urReadme.md** is a modern, AI-powered tool that automatically generates professional GitHub README files. It analyzes your repository structure, identifies your tech stack, and synthesizes high-quality documentation using a local, self-hosted AI model.

---

## ✨ Features

- **Semantic Repository Analysis**: Automatically maps your project's file structure and identifies key entry points.
- **Custom Local AI**: Uses a self-hosted **FLAN-T5** model for README generation—no expensive API keys or external services required.
- **Split-Screen Workspace**: Real-time editing with a live, GitHub-styled Markdown preview.
- **Interactive UI**: A clean, modern dashboard built with Next.js and Tailwind CSS.
- **Privacy First**: Analysis and generation happen without storing your repository data.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: [Next.js (App Router)](https://nextjs.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown Rendering**: [react-markdown](https://github.com/remarkjs/react-markdown)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **AI/ML**: [Hugging Face Transformers](https://huggingface.co/docs/transformers/index) (FLAN-T5-small)
- **HTTP Client**: [httpx](https://www.python-httpx.org/)
- **API Communication**: Server-Sent Events (SSE) for real-time streaming.

---

## 📂 Project Structure

```text
.
├── frontend/               # Next.js Application
│   ├── app/                # App router, pages, and API routes
│   ├── components/         # UI components and layout sections
│   ├── lib/                # Frontend services and utilities
│   └── public/             # Static assets
└── backend/                # FastAPI Application
    ├── main.py             # Entry point for the backend API
    ├── services/           # GitHub analysis and AI logic
    └── requirements.txt    # Python dependencies
```

---

## ⚙️ Getting Started

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.9+)
- [Git](https://git-scm.com/)

### 2. Backend Setup
```bash
# Navigate to backend
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# On Windows (CMD):
.\venv\Scripts\activate.bat
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload
```
The backend will run on `http://127.0.0.1:8000`.

### 3. Frontend Setup
```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Set environment variables (Optional: Add GITHUB_TOKEN for higher rate limits)
# echo "GITHUB_TOKEN=your_token" > .env.local

# Start the development server
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📖 Usage
1. Enter a public GitHub repository URL (e.g., `https://github.com/username/repo`).
2. Click **Generate README**.
3. Watch as the AI analyzes your code and streams the generated Markdown.
4. Use the **Edit Mode** to fine-tune the content and preview it in real-time.
5. Copy the final result directly into your project's `README.md`.

---

## 📄 License
This project is licensed under the **MIT** License.
