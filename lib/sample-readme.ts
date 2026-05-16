export const SAMPLE_README = `# Obsidian UI Framework

> A developer-first UI system for precision interfaces.

[![npm version](https://img.shields.io/npm/v/obsidian-ui.svg)](https://npmjs.com/package/obsidian-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- **High Contrast**: Optimized for readability in dark environments.
- **Zero Bloat**: Atomic CSS with zero-runtime overhead.
- **Precise**: Grid-based alignment and consistent spacing.
- **Accessible**: WCAG 2.1 AA compliant out of the box.
- **TypeScript First**: Full type safety with generics support.

## Quick Start

\`\`\`bash
npm install obsidian-ui
\`\`\`

\`\`\`tsx
import { Button, Card } from 'obsidian-ui'

export default function App() {
  return (
    <Card variant="elevated">
      <h2>Welcome to Obsidian</h2>
      <p>Start building beautiful interfaces.</p>
      <Button variant="primary">Get Started</Button>
    </Card>
  )
}
\`\`\`

## Components

| Component | Status | Description |
|-----------|--------|-------------|
| Button | ✅ Stable | Primary action element |
| Card | ✅ Stable | Container with elevation |
| Input | ✅ Stable | Text input with validation |
| Modal | 🚧 Beta | Overlay dialog component |
| Toast | 🚧 Beta | Notification system |
| Table | 📋 Planned | Data display grid |

## API Reference

### Button

\`\`\`tsx
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
}
\`\`\`

### Card

\`\`\`tsx
interface CardProps {
  variant: 'flat' | 'elevated' | 'outlined'
  padding: 'none' | 'sm' | 'md' | 'lg'
  children: React.ReactNode
}
\`\`\`

## Configuration

Create an \`obsidian.config.ts\` file in your project root:

\`\`\`ts
import { defineConfig } from 'obsidian-ui'

export default defineConfig({
  theme: {
    colors: {
      primary: '#8b5cf6',
      accent: '#10b981',
    },
    radius: '0.5rem',
  },
  darkMode: 'class',
})
\`\`\`

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (\`git checkout -b feature/amazing-feature\`)
3. Commit your changes (\`git commit -m 'Add amazing feature'\`)
4. Push to the branch (\`git push origin feature/amazing-feature\`)
5. Open a Pull Request

## License

MIT © [Obsidian Labs](https://obsidian.dev)

---

Built with precision. Designed for developers.
`
