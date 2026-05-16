export const SAMPLE_README = `# urReadme.md

> Precision documentation for high-performance teams.

[![Version](https://img.shields.io/badge/version-2.0-7c3aed)](#)
[![License](https://img.shields.io/badge/license-MIT-22c55e)](#)
[![Build](https://img.shields.io/badge/build-passing-22c55e)](#)

## ✨ Overview

**urReadme.md** automates your documentation workflow — generate production-ready READMEs from any codebase in seconds using advanced LLMs and semantic code analysis.

## 🚀 Features

- **Semantic Code Analysis** — Parses your entire repository structure, exports, types, and logic.
- **CI/CD Integration** — Automatically refresh your README on every merge.
- **Custom Blueprints** — Industry-standard presets for NPM, PyPI, Cargo, and more.
- **Privacy First** — Public repo support with zero data retention.

## 📦 Installation

\`\`\`bash
npm install -g urreadme
# or
pnpm add -g urreadme
\`\`\`

## 🛠️ Usage

\`\`\`ts
import { generate } from "urreadme";

const readme = await generate({
  repo: "github.com/username/repository",
  model: "gpt-4o",
});

console.log(readme);
\`\`\`

## 📊 Comparison

| Feature        | urReadme | Manual |
| -------------- | -------- | ------ |
| Setup time     | 30s      | 2h+    |
| Auto-sync      | ✅       | ❌     |
| Custom presets | ✅       | ⚠️     |

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.
`
