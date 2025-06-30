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

## 📁 Project Structure

```
bookr/
├── src/                          # Source code
│   ├── cli.ts                    # Main CLI entry point
│   ├── components/               # Ink React components
│   │   └── App.tsx              # Main application component
│   ├── api/                     # API clients and integrations
│   ├── utils/                   # Utility functions
│   └── types/                   # TypeScript type definitions
├── dist/                        # Compiled JavaScript output
├── config/                      # Configuration files
├── tests/                       # Test files
├── docs/                        # Documentation
├── package.json                 # Project dependencies and scripts
├── tsconfig.json               # TypeScript configuration
├── biome.json                  # Biome linting and formatting config
├── DEVELOPMENT_PLAN.md         # Development roadmap and tasks
└── README.md                   # This file
```

## 📄 File Descriptions

### Core Files

#### `src/cli.ts`
- **Purpose**: Main entry point for the CLI application
- **Features**: 
  - Command-line argument parsing with `meow`
  - Ink rendering setup
  - CLI help text and usage examples
  - Positional argument support for time logging
- **Usage**: Handles `bookr 2h15m -m "description"` syntax

#### `src/components/App.tsx`
- **Purpose**: Main React component for the CLI interface
- **Features**:
  - Displays welcome message and current branch
  - Shows time and description from CLI arguments
  - Placeholder for Git branch parsing
  - Ink-based terminal UI components

### Configuration Files

#### `package.json`
- **Purpose**: Project metadata, dependencies, and scripts
- **Key Features**:
  - ES module configuration (`"type": "module"`)
  - CLI binary configuration for global installation
  - Development and build scripts
  - Dependencies: Ink, React, better-fetch, meow
  - Dev dependencies: TypeScript, Biome, tsx

#### `tsconfig.json`
- **Purpose**: TypeScript compiler configuration
- **Features**:
  - ES2020 target with Node16 module resolution
  - Strict type checking enabled
  - JSX support for React components
  - Source maps and declaration files
  - Path mapping for clean imports

#### `biome.json`
- **Purpose**: Biome configuration for linting and formatting
- **Features**:
  - Automatic import organization
  - Strict linting rules
  - Code formatting with 2-space indentation
  - Git integration for ignored files

### Documentation

#### `DEVELOPMENT_PLAN.md`
- **Purpose**: Comprehensive development roadmap
- **Content**:
  - 5-phase development plan with 20 detailed steps
  - Project setup instructions
  - Feature implementation roadmap
  - Testing and deployment guidelines

## 🛠️ Development

### Available Scripts

```bash
# Development (with live reload)
npm run dev

# Build for production
npm run build

# Run built CLI
npm start

# Lint code
npm run lint

# Format code
npm run format

# Check code (lint + format)
npm run check

# Clean build output
npm run clean
```

### Development Workflow

1. **Development Mode**: Use `npm run dev` for rapid iteration
   ```bash
   npm run dev -- 2h15m -m "Development work"
   ```

2. **Production Testing**: Build and test as users would
   ```bash
   npm run build
   npm start -- 2h15m -m "Production test"
   ```

3. **Code Quality**: Run linting and formatting
   ```bash
   npm run check
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

## 🚧 Current Status

### ✅ Completed
- [x] Project setup and configuration
- [x] Basic CLI structure with argument parsing
- [x] Ink-based UI components
- [x] TypeScript configuration
- [x] Biome linting and formatting
- [x] Development and build scripts
- [x] Positional argument support for time logging

### 🚧 In Progress
- [ ] Git branch parsing functionality
- [ ] Tempo API integration
- [ ] Jira ticket ID extraction
- [ ] Interactive time entry components

### 📋 Planned
- [ ] Configuration management
- [ ] Error handling and validation
- [ ] Testing framework setup
- [ ] Documentation and examples
- [ ] Packaging and distribution

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