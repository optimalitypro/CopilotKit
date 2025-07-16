# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

CopilotKit is a monorepo organized using pnpm workspaces and Turborepo. The main structure is:

- **CopilotKit/packages/**: Core packages for the CopilotKit React SDK
  - `react-core`: Core React hooks and providers for CopilotKit
  - `react-ui`: Pre-built UI components (chat, popup, sidebar)
  - `react-textarea`: Intelligent textarea component with autosuggestions
  - `runtime`: Backend runtime for processing AI requests
  - `runtime-client-gql`: GraphQL client for runtime communication
  - `shared`: Shared types and utilities
  - `sdk-js`: JavaScript SDK for LangGraph integration
- **examples/**: Example applications demonstrating various use cases
  - CoAgents examples (multi-agent workflows)
  - Copilot examples (single-agent assistants)
  - Integration examples with different frameworks
- **docs/**: Documentation website built with Next.js
- **sdk-python/**: Python SDK for server-side integrations

## Key Commands

### Development
```bash
# Install dependencies
pnpm install

# Build all packages
turbo build

# Start development mode for all packages
turbo dev

# Start development for specific package
turbo dev --filter="@copilotkit/package-name"

# Clean all packages
turbo clean

# Fresh build (clean + install + build)
pnpm freshbuild
```

### Testing and Quality
```bash
# Run tests
turbo test

# Run linting
turbo lint

# Type checking
turbo check-types

# Format code
pnpm format

# Check formatting
pnpm check-prettier
```

### Package Management
```bash
# Link packages globally for testing
turbo run link:global

# Unlink packages
turbo run unlink:global
```

## Architecture Overview

### Core Architecture
CopilotKit follows a client-server architecture:

1. **Frontend (React)**: React components and hooks that integrate AI capabilities into web applications
2. **Runtime**: Backend service that processes AI requests, manages context, and interfaces with LLMs
3. **CoAgents**: Multi-agent framework for complex workflows using LangGraph

### Key Concepts

- **Actions**: Functions that the AI can call to interact with your application
- **Readable State**: Application state that the AI can read and understand
- **CoAgents**: Multi-agent workflows that can collaborate and maintain shared state
- **Generative UI**: AI-generated user interface components
- **Human-in-the-Loop**: Workflows that require human approval or input

### Package Dependencies
The packages have a dependency hierarchy:
- `react-ui` and `react-textarea` depend on `react-core`
- `react-core` depends on `runtime-client-gql` and `shared`
- `runtime` depends on `shared`
- All packages use workspace dependencies for internal references

## Development Guidelines

### Prerequisites
- Node.js 20.x or later
- pnpm v9.x (install globally: `npm i -g pnpm@^9`)
- Turborepo v2.x (install globally: `npm i -g turbo@2`)

### Branch Naming
- Documentation: `docs/<ISSUE_NUMBER>-<CUSTOM_NAME>`
- Features: `feat/<ISSUE_NUMBER>-<CUSTOM_NAME>`
- Bug fixes: `fix/<ISSUE_NUMBER>-<CUSTOM_NAME>`

### Commit Messages
Format: `<type>(<package>): <subject>`

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test changes
- `chore`: Build/tooling changes

### Testing Strategy
- Each package has its own test suite using Jest
- Examples include E2E tests using Playwright
- QA scripts validate integrations across different frameworks

### Release Process
- Uses changesets for version management
- Packages are published to npm with public access
- Release scripts handle changelog generation and publishing

## Common Development Patterns

### Adding New Features
1. Determine which package(s) need changes
2. Update the core types in `shared` if needed
3. Implement in the appropriate package
4. Add tests and documentation
5. Update examples if the feature affects public APIs

### Working with Examples
- Examples are self-contained applications
- They demonstrate real-world usage patterns
- Each example has its own dependencies and can be run independently
- Use examples to test new features before release

### Package Exports
- All packages use modern ESM/CJS dual exports
- TypeScript declarations are generated during build
- Main entry points are in each package's `src/index.ts`




# CopilotKit Development Workflow

## Workspace Setup
CopilotKit uses a monorepo structure with:
- **[CopilotKit/package.json](mdc:CopilotKit/package.json)** - Main workspace configuration
- **[CopilotKit/packages/](mdc:CopilotKit/packages)** - Core library packages
- **[examples/](mdc:examples)** - Example applications

## Development Scripts
Located in [CopilotKit/scripts/](mdc:CopilotKit/scripts):

### Development Scripts
- **[develop/](mdc:CopilotKit/scripts/develop)** - Development environment setup
- **[qa/](mdc:CopilotKit/scripts/qa)** - Quality assurance and testing scripts
- **[release/](mdc:CopilotKit/scripts/release)** - Release automation scripts

### Documentation Scripts
- **[docs/](mdc:CopilotKit/scripts/docs)** - Documentation generation and management

## Package Management
- Uses pnpm workspaces for package management
- Local packages are linked automatically within the workspace
- Examples reference local packages via workspace protocol

## Testing
- **[e2e/](mdc:examples/e2e)** - End-to-end testing setup with Playwright
- **[playwright.config.ts](mdc:examples/e2e/playwright.config.ts)** - Playwright configuration
- Test results in [test-results/](mdc:examples/e2e/test-results)

## Documentation Site
- **[docs/](mdc:docs)** - Documentation website built with Next.js
- **[content/docs/](mdc:docs/content/docs)** - Markdown documentation files
- **[components/react/](mdc:docs/components/react)** - React component examples
- **[snippets/](mdc:docs/snippets)** - Code snippets for documentation

## Configuration Files
- **[CopilotKit.code-workspace](mdc:CopilotKit/CopilotKit.code-workspace)** - VS Code workspace settings
- **[utilities/](mdc:CopilotKit/utilities)** - Shared utilities:
  - [eslint-config-custom/](mdc:CopilotKit/utilities/eslint-config-custom) - ESLint configuration
  - [tailwind-config/](mdc:CopilotKit/utilities/tailwind-config) - Tailwind CSS configuration  
  - [tsconfig/](mdc:CopilotKit/utilities/tsconfig) - TypeScript configurations

## Infrastructure
- **[infra/](mdc:infra)** - AWS CDK infrastructure code
- **[helmfile/](mdc:examples/helmfile)** - Kubernetes deployment configuration
- **[Dockerfile.*](mdc:examples/Dockerfile.agent-js)** - Docker configurations for different components

## Component Registry
- **[registry/](mdc:registry)** - Component registry for reusable components
- **[registry/registry/](mdc:registry/registry)** - Registry content:
  - [chat/](mdc:registry/registry/chat) - Chat components
  - [quickstarts/](mdc:registry/registry/quickstarts) - Quick start templates

## Development Best Practices
1. Work within the monorepo structure
2. Use the provided scripts for common tasks
3. Test changes with relevant examples
4. Follow the established patterns in existing code
5. Update documentation when adding new features


# CopilotKit Frontend Development Guide

## Core React Packages

### React Components
- **[react-core/](mdc:CopilotKit/packages/react-core/)** - Core React components and hooks
  - `CopilotProvider` - Main provider component
  - `useCopilotChat` - Chat functionality hook
  - `useCopilotAction` - Action definition hook
  - `useCopilotReadable` - State reading hook

### UI Components
- **[react-ui/](mdc:CopilotKit/packages/react-ui/)** - Pre-built UI components
  - `CopilotChat` - Chat interface component
  - `CopilotPopup` - Popup chat component
  - `CopilotSidebar` - Sidebar chat component

### Specialized Components
- **[react-textarea/](mdc:CopilotKit/packages/react-textarea/)** - AI-enhanced textarea
  - `CopilotTextarea` - Smart textarea with AI suggestions
  - Auto-completion and suggestions

## Frontend Example Categories

### Basic Integration Examples
- **[copilot-chat-with-your-data/](mdc:examples/copilot-chat-with-your-data/)** - Chat with custom data
- **[copilot-form-filling/](mdc:examples/copilot-form-filling/)** - AI-powered form filling
- **[copilot-fully-custom/](mdc:examples/copilot-fully-custom/)** - Custom copilot implementation

### Advanced UI Examples
- **[copilot-state-machine/](mdc:examples/copilot-state-machine/)** - State machine integration
- **[demo-viewer/](mdc:examples/demo-viewer/)** - Demo viewer application
- **[saas-dynamic-dashboards/frontend/](mdc:examples/saas-dynamic-dashboards/frontend/)** - Dynamic dashboard UI

### Coagents UI Examples
Most coagents examples have a `ui/` folder with Next.js applications:
- **[coagents-starter/ui/](mdc:examples/coagents-starter/ui/)** - Basic coagents UI
- **[coagents-travel/ui/](mdc:examples/coagents-travel/ui/)** - Travel planning UI
- **[coagents-research-canvas/ui/](mdc:examples/coagents-research-canvas/ui/)** - Research canvas UI

## Component Registry
- **[registry/](mdc:registry/)** - Reusable component registry
- **[registry/registry/chat/](mdc:registry/registry/chat/)** - Chat components
- **[registry/registry/layout/](mdc:registry/registry/layout/)** - Layout components
- **[registry/registry/quickstarts/](mdc:registry/registry/quickstarts/)** - Quick start templates

## Common Frontend Patterns

### Provider Setup
```typescript
import { CopilotProvider } from '@copilotkit/react-core'

function App() {
  return (
    <CopilotProvider runtimeUrl="/api/copilotkit">
      {/* Your app components */}
    </CopilotProvider>
  )
}
```

### Chat Integration
```typescript
import { CopilotChat } from '@copilotkit/react-ui'

function ChatInterface() {
  return (
    <CopilotChat
      labels={{
        title: "Your AI Assistant",
        initial: "Hello! How can I help you today?"
      }}
    />
  )
}
```

### Actions and State
```typescript
import { useCopilotAction, useCopilotReadable } from '@copilotkit/react-core'
import { useState } from 'react'

function MyComponent() {
  const [state, setState] = useState({})
  // …
}
  
  useCopilotReadable({
    name: "current_state",
    description: "Current application state",
    value: state
  })
  
  useCopilotAction({
    name: "update_state",
    description: "Update application state",
    parameters: [/* ... */],
    handler: (args) => {
      setState(args.newState)
    }
  })
}
```

## Documentation Components
- **[docs/components/react/](mdc:docs/components/react/)** - React component documentation
- **[docs/components/ui/](mdc:docs/components/ui/)** - UI component library
- **[docs/snippets/](mdc:docs/snippets/)** - Code snippets and examples

## Integration with Agents

### Runtime Configuration
- **[runtime/](mdc:CopilotKit/packages/runtime/)** - Core runtime for agent communication
- **[runtime-client-gql/](mdc:CopilotKit/packages/runtime-client-gql/)** - GraphQL client

### Agent Communication
- Frontend components communicate with agents via the runtime
- Actions defined in frontend are executed by backend agents
- State is synchronized between frontend and agents

## Development Best Practices

### Component Development
1. Use TypeScript for better type safety
2. Follow the established component patterns
3. Implement proper error handling
4. Use the provided hooks and utilities

### UI/UX Guidelines
1. Maintain consistent styling with Tailwind CSS
2. Use the component registry for reusable components
3. Implement responsive design
4. Provide clear user feedback

### Testing and Quality
1. Test components with different agent configurations
2. Use the E2E testing setup in [examples/e2e/](mdc:examples/e2e/)
3. Follow accessibility best practices
4. Validate agent integration flows

### Styling and Theming
- Uses Tailwind CSS for styling
- Shared configuration in [utilities/tailwind-config/](mdc:CopilotKit/utilities/tailwind-config/)
- Custom components in [components.json](mdc:docs/components.json)
- UI components follow modern design patterns

# CopilotKit Architecture Overview

## Core Library Structure
The main CopilotKit library is located in [CopilotKit/](mdc:CopilotKit/) with the following key packages:

### React Packages
- **[react-core/](mdc:CopilotKit/packages/react-core/)** - Core React components and hooks for CopilotKit
- **[react-textarea/](mdc:CopilotKit/packages/react-textarea/)** - Textarea component with AI integration
- **[react-ui/](mdc:CopilotKit/packages/react-ui/)** - UI components for copilot interfaces

### Runtime & SDK
- **[runtime/](mdc:CopilotKit/packages/runtime/)** - Core runtime for executing copilot actions
- **[runtime-client-gql/](mdc:CopilotKit/packages/runtime-client-gql/)** - GraphQL client for runtime communication
- **[sdk-js/](mdc:CopilotKit/packages/sdk-js/)** - JavaScript SDK for backend integration
- **[shared/](mdc:CopilotKit/packages/shared/)** - Shared utilities and types

### Python SDK
- **[sdk-python/](mdc:sdk-python/)** - Python SDK with integrations for:
  - CrewAI agents in [crewai/](mdc:sdk-python/copilotkit/crewai/)
  - LangGraph integrations
  - OpenAI integrations in [openai/](mdc:sdk-python/copilotkit/openai/)

## Key Concepts
- **Copilots**: AI assistants that can read and write application state
- **Actions**: Functions that copilots can call to interact with your application
- **Agents**: Backend AI agents that process complex tasks
- **Coagents**: Multi-agent systems for complex workflows

## Examples Structure
All examples are in [examples/](mdc:examples/) and typically follow this pattern:
- `agent/` or `agent-py/` - Backend agent implementation
- `ui/` - Frontend Next.js application
- `README.md` - Setup and usage instructions

## Development Workflow
- Examples use the local packages via workspace references
- [package.json](mdc:CopilotKit/package.json) contains workspace configuration
- Scripts in [scripts/](mdc:CopilotKit/scripts/) for development, testing, and releases