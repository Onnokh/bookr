# 🧪 Bookr - Tempo CLI Tool

A terminal-based CLI tool to book time in Jira using the Tempo plugin by parsing your current Git branch name.

## 🎯 Features

- 🖼️ **Ink** — React for CLIs with beautiful terminal UI
- 🧠 **TypeScript** — Strong typing and better developer experience
- 🌲 **Biome** — Fast linting and formatting
- 🌐 **better-fetch** — Modern fetch API for HTTP requests
- ⏱️ **Tempo API integration** — Log time directly to Jira tickets
- 🌿 **Git integration** — Automatically parse Jira ticket IDs from branch names

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
# Basic usage
bookr

# Log time with description
bookr 2h15m -m "Worked on CLI"

# Log time for specific date
bookr --date "2024-01-15" 4h

# Get help
bookr --help

# version
bookr --version
```

## 🔧 Architecture

### Technology Stack

- **Runtime**: Node.js 18+ with ES modules
- **UI Framework**: Ink (React for CLIs)
- **Language**: TypeScript with strict configuration
- **HTTP Client**: better-fetch for API calls
- **CLI Framework**: meow for argument parsing
- **Code Quality**: Biome for linting and formatting
- **Development**: tsx for fast TypeScript execution

### Key Design Decisions

1. **ES Modules**: Using modern ES modules for better tree-shaking and compatibility
2. **Strict TypeScript**: Enabling all strict checks for better code quality
3. **Ink UI**: React-based CLI interface for rich user experience
4. **Positional Arguments**: User-friendly syntax for time logging
5. **Modular Structure**: Clear separation of concerns with dedicated directories

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run `npm run check` to ensure code quality
5. Submit a pull request

## 📝 License

ISC License - see `package.json` for details.

## 🔗 Related Links

- [Ink Documentation](https://github.com/vadimdemedes/ink)
- [Biome Documentation](https://biomejs.dev/)
- [Tempo API Documentation](https://tempo.io/api-docs/)
- [Development Plan](./DEVELOPMENT_PLAN.md) 