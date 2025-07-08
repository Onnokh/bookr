# 🧪 Bookr - Tempo CLI Tool

[![npm version](https://badge.fury.io/js/bookr-cli.svg)](https://badge.fury.io/js/bookr-cli)
[![npm downloads](https://img.shields.io/npm/dm/bookr-cli.svg)](https://www.npmjs.com/package/bookr-cli)
[![Node.js version](https://img.shields.io/node/v/bookr-cli.svg)](https://nodejs.org/)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

A terminal-based CLI tool to book time in Jira using the Tempo plugin by parsing your current Git branch name.

## 🎯 Features

- 🖼️ **Ink** — React for CLIs with beautiful terminal UI
- 🧠 **TypeScript** — Strong typing and better developer experience
- 🌲 **Biome** — Fast linting and formatting
- 🌐 **better-fetch** — Modern fetch API for HTTP requests
- ⏱️ **Tempo API integration** — Log time directly to Jira tickets
- 🌿 **Git integration** — Automatically parse Jira ticket IDs from branch names
- 🎯 **Flexible ticket input** — Specify ticket explicitly or use Git branch

## 🚀 Quick Start

### Installation

#### Package Manager

Using npm:
```bash
npm install bookr-cli
```

Using yarn:
```bash
yarn add bookr-cli
```

Using pnpm:
```bash
pnpm add bookr-cli
```

Using bun:
```bash
bun add bookr-cli
```

#### From Source

```bash
# Clone the repository
git clone <repository-url>
cd bookr

# Install dependencies
npm install

# Build the project
npm run build

# Run the CLI
npm start
```

### Usage

```bash
# Basic usage (uses Git branch for ticket)
bookr 2h15m

# Log time with explicit ticket
bookr PROJ-123 2h15m

# Log time with description
bookr 2h15m -m "Worked on CLI"
bookr PROJ-123 2h15m -m "Fixed bug in login"

# Log time for specific date
bookr --date "2024-01-15" 4h
bookr PROJ-456 --date "2024-01-15" 4h

# View today's worklogs
bookr today

# View sprint overview
bookr sprint

# View sprint progress
bookr progress

# Check for updates
bookr update

# Get help
bookr --help

# Show version
bookr --version
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run check` to ensure code quality
5. Submit a pull request

## 📝 License

ISC License - see `package.json` for details.