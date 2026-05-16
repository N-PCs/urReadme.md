"""Custom AI model for README generation.

This service uses a combination of structural analysis and a local transformer 
model (FLAN-T5) to generate comprehensive READMEs without external APIs.
"""

from __future__ import annotations

import logging
from typing import Any
from transformers import pipeline
import torch
from .github_service import RepoAnalysis

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model cache
_model = None

def get_model():
    """Lazy-load the transformer model."""
    global _model
    if _model is None:
        logger.info("Loading custom AI model (google/flan-t5-small)...")
        # Use a small model that can run on CPU/Render
        try:
            _model = pipeline(
                "text2text-generation", 
                model="google/flan-t5-small",
                device=-1 # Force CPU
            )
            logger.info("Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            _model = None
    return _model

def _generate_text(prompt: str, max_length: int = 150) -> str:
    """Generate text using the local model with a fallback."""
    model = get_model()
    if not model:
        return "Analysis-based description generation failed. Falling back to template logic."
    
    try:
        result = model(prompt, max_length=max_length, do_sample=True, temperature=0.7)
        return result[0]['generated_text']
    except Exception as e:
        logger.error(f"Generation error: {e}")
        return "Error during text generation."

def generate_readme(analysis: RepoAnalysis) -> str:
    """Generate a full README.md using custom AI logic."""
    meta = analysis.meta
    
    # 1. Introduction & Theory
    intro_prompt = f"Write a professional introduction and 'Why use this?' theory section for {meta.name}. Description: {meta.description or 'A software project'}."
    introduction = _generate_text(intro_prompt, max_length=200)
    
    # 2. Tech Stack & Features
    tech_stack = []
    if meta.language:
        tech_stack.append(meta.language)
    
    key_files_list = list(analysis.key_files.keys())
    if "package.json" in key_files_list:
        tech_stack.append("Node.js")
    if "requirements.txt" in key_files_list or "pyproject.toml" in key_files_list:
        tech_stack.append("Python")
    if "Dockerfile" in key_files_list:
        tech_stack.append("Docker")
    
    features_prompt = f"List 4 powerful features for a project with these files: {', '.join(analysis.tree[:15])}."
    features = _generate_text(features_prompt, max_length=200)
    
    # 3. Project Structure (Tree)
    # We use the actual tree fetched from GitHub
    tree_str = "\n".join([f"├── {f}" for f in analysis.tree[:20]])
    if len(analysis.tree) > 20:
        tree_str += f"\n└── ... ({len(analysis.tree) - 20} more files)"

    # 4. Installation & Local Setup
    if "package.json" in key_files_list:
        setup_logic = "```bash\ngit clone https://github.com/{full_name}.git\ncd {name}\nnpm install\nnpm run dev\n```".format(full_name=meta.full_name, name=meta.name)
    elif "requirements.txt" in key_files_list:
        setup_logic = "```bash\ngit clone https://github.com/{full_name}.git\ncd {name}\npip install -r requirements.txt\npython main.py\n```".format(full_name=meta.full_name, name=meta.name)
    else:
        setup_logic = "```bash\ngit clone https://github.com/{full_name}.git\ncd {name}\n# Follow project-specific setup steps\n```".format(full_name=meta.full_name, name=meta.name)
        
    # 5. License & Authors
    license_info = analysis.license_name or "MIT"

    # Assemble the README
    readme = f"""# {meta.name}

> {meta.description or "A modern software repository analysis tool."}

## 📖 Introduction & Theory
{introduction}

## 🚀 Key Features
{features}

## 🛠️ Tech Stack
{', '.join(tech_stack) if tech_stack else 'Detected from codebase'}

## 📂 Implementation / Project Structure
```text
.
{tree_str}
```

## ⚙️ How to Run Locally
### Prerequisites
- Ensure you have the required runtime ({meta.language or 'environment'}) installed.
- Git for cloning the repository.

### Setup Steps
{setup_logic}

## 👥 Authors
- **{meta.owner}** - *Initial work* - [{meta.owner}](https://github.com/{meta.owner})

## 📄 License
This project is licensed under the **{license_info}** License - see the [LICENSE](LICENSE) file for details.
"""
    return readme

async def generate_readme_stream(analysis: RepoAnalysis):
    """Simulate streaming for the custom AI model."""
    readme = generate_readme(analysis)
    # Since local generation is relatively fast, we just yield chunks
    chunk_size = 50
    for i in range(0, len(readme), chunk_size):
        yield readme[i:i+chunk_size]
