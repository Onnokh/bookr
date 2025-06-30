# 🧪 Tempo CLI Tool Development Plan

A terminal-based CLI tool to book time in Jira using the Tempo plugin by parsing your current Git branch name.

## 🎯 Project Overview

This guide walks you through setting up:

- 🖼️ [Ink](https://github.com/vadimdemedes/ink) — React for CLIs
- 🧠 TypeScript — strong typing
- 🌲 [Biome](https://biomejs.dev/) — linting and formatting
- 🌐 [better-fetch](https://github.com/veritem/better-fetch) — modern fetch API
- ⏱️ Tempo API integration — to log time via Jira tickets

## 📋 Step-by-Step Development Plan

### Phase 1: Project Setup & Dependencies

#### Step 1: Initialize Node.js Project
- [ ] Initialize `package.json` with `npm init -y`
- [ ] Set up TypeScript configuration (`tsconfig.json`)
- [ ] Configure project structure and entry points

#### Step 2: Install Core Dependencies
- [ ] Install Ink: `npm install ink react`
- [ ] Install TypeScript: `npm install -D typescript @types/node @types/react`
- [ ] Install Biome: `npm install -D @biomejs/biome`
- [ ] Install better-fetch: `npm install better-fetch`
- [ ] Install CLI utilities: `npm install meow` (for argument parsing)

#### Step 3: Configure Development Tools
- [ ] Set up Biome configuration (`biome.json`)
- [ ] Configure TypeScript for CLI development
- [ ] Set up build scripts in `package.json`
- [ ] Add development scripts (dev, build, start)

### Phase 2: Core CLI Infrastructure

#### Step 4: Create CLI Entry Point
- [ ] Create `src/cli.ts` as main entry point
- [ ] Set up command-line argument parsing with meow
- [ ] Configure package.json bin field for global installation
- [ ] Add shebang and proper CLI structure

#### Step 5: Set Up Ink Components
- [ ] Create base App component structure
- [ ] Set up component hierarchy for CLI interface
- [ ] Implement basic rendering with Ink
- [ ] Add proper exit handling

#### Step 6: Implement Git Branch Parsing
- [ ] Create Git utility functions
- [ ] Parse current branch name
- [ ] Extract Jira ticket numbers from branch names
- [ ] Add branch name validation

#### Step 7: Configuration Management
- [ ] Create configuration file structure
- [ ] Implement API key storage (secure)
- [ ] Add default settings and user preferences
- [ ] Create configuration validation

### Phase 3: Tempo API Integration

#### Step 8: Create Tempo API Client
- [ ] Set up better-fetch for API calls
- [ ] Create Tempo API client class
- [ ] Implement base API configuration
- [ ] Add request/response types

#### Step 9: Implement Authentication
- [ ] Add API token authentication
- [ ] Implement token validation
- [ ] Add authentication error handling
- [ ] Create secure token storage

#### Step 10: Add API Endpoints
- [ ] Implement worklog creation endpoint
- [ ] Add issue/work item lookup
- [ ] Create user profile fetching
- [ ] Add project and account endpoints

#### Step 11: Jira Ticket Integration
- [ ] Parse Jira ticket IDs from branch names
- [ ] Validate ticket existence via API
- [ ] Fetch ticket details and metadata
- [ ] Add ticket auto-completion

### Phase 4: User Interface & Experience

#### Step 12: Build Interactive Components
- [ ] Create time entry form component
- [ ] Add date/time picker functionality
- [ ] Implement description input
- [ ] Add activity/work type selection

#### Step 13: Add Validation & Error Handling
- [ ] Implement input validation
- [ ] Add API error handling
- [ ] Create user-friendly error messages
- [ ] Add retry mechanisms

#### Step 14: Implement Confirmation Dialogs
- [ ] Create confirmation prompts
- [ ] Add preview of time entry
- [ ] Implement undo/redo functionality
- [ ] Add batch time entry support

#### Step 15: Help & Documentation
- [ ] Add comprehensive help system
- [ ] Create usage examples
- [ ] Add command-line help flags
- [ ] Implement interactive tutorials

### Phase 5: Polish & Testing

#### Step 16: Error Handling & Edge Cases
- [ ] Handle network connectivity issues
- [ ] Add offline mode support
- [ ] Implement graceful degradation
- [ ] Add comprehensive logging

#### Step 17: Testing
- [ ] Write unit tests for core functions
- [ ] Add integration tests for API calls
- [ ] Create CLI testing utilities
- [ ] Add test coverage reporting

#### Step 18: Documentation
- [ ] Create README with installation guide
- [ ] Add API documentation
- [ ] Create troubleshooting guide
- [ ] Add contribution guidelines

#### Step 19: Packaging & Distribution
- [ ] Configure build process
- [ ] Add npm publish configuration
- [ ] Create installation scripts
- [ ] Add version management

#### Step 20: Final Polish
- [ ] Performance optimization
- [ ] Code review and cleanup
- [ ] Security audit
- [ ] User experience testing

## 🚀 Getting Started

To begin development:

1. Clone this repository
2. Follow the steps in Phase 1
3. Run `npm install` to install dependencies
4. Use `npm run dev` for development
5. Use `npm run build` to build for production

## 📁 Project Structure

```
bookr/
├── src/
│   ├── cli.ts              # Main CLI entry point
│   ├── components/         # Ink React components
│   ├── api/               # Tempo API client
│   ├── utils/             # Utility functions
│   └── types/             # TypeScript type definitions
├── config/                # Configuration files
├── tests/                 # Test files
├── docs/                  # Documentation
├── package.json
├── tsconfig.json
├── biome.json
└── README.md
```

## 🔧 Development Commands

- `npm run dev` - Start development mode
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Run Biome linting
- `npm run format` - Format code with Biome
- `npm run start` - Run built CLI tool

## 📝 Notes

- This plan is iterative and can be adjusted based on requirements
- Each phase should be completed before moving to the next
- Testing should be done throughout development, not just at the end
- Security considerations should be prioritized, especially for API key handling 