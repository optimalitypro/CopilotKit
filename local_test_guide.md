# Local Testing Guide for CopilotKit with Next.js App Router

This guide helps you test all CopilotKit packages locally using a Next.js App Router application.

## Prerequisites

- Node.js 20.x or later
- pnpm v9.x installed globally: `npm i -g pnpm@^9`
- Built CopilotKit packages (see `how_to_build_guide.md`)

## Method 1: Using Tarball Installation (Recommended)

This method avoids workspace dependency conflicts and provides reliable local package installation. 

**Why this method is recommended:**
- Workspace dependencies (`workspace:*`) in local CopilotKit packages can't resolve properly when using global linking
- Tarball installation packages dependencies with fixed versions, avoiding resolution conflicts
- Works reliably with both npm and pnpm package managers
- Provides consistent behavior across different development environments

### Step 1: Build and Pack Local Packages

From the CopilotKit root directory:

```bash
cd CopilotKit
turbo build

# Pack all packages in dependency order
cd packages/shared && pnpm pack
cd ../runtime-client-gql && pnpm pack
cd ../react-core && pnpm pack
cd ../react-ui && pnpm pack
cd ../runtime && pnpm pack
cd ../sdk-js && pnpm pack
```

### Step 2: Create a Test Next.js App

```bash
# Go back to root directory
cd /path/to/CopilotKit
# Handle interactive prompts automatically
echo "n" | npx create-next-app@latest copilotkit-test --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd copilotkit-test
```

### Step 3: Install Additional Dependencies

```bash
pnpm add openai react-markdown
pnpm add -D @types/node
```

### Step 4: Install Local Packages from Tarballs

**Option A: Using npm (Recommended for reliability)**

```bash
# Edit package.json to use local tarballs
# Update dependencies section to use file: protocol
{
  "dependencies": {
    "@copilotkit/shared": "file:../CopilotKit/packages/shared/copilotkit-shared-1.9.2-next.9.tgz",
    "@copilotkit/runtime-client-gql": "file:../CopilotKit/packages/runtime-client-gql/copilotkit-runtime-client-gql-1.9.2-next.9.tgz",
    "@copilotkit/react-core": "file:../CopilotKit/packages/react-core/copilotkit-react-core-1.9.2-next.9.tgz",
    "@copilotkit/react-ui": "file:../CopilotKit/packages/react-ui/copilotkit-react-ui-1.9.2-next.9.tgz",
    "@copilotkit/runtime": "file:../CopilotKit/packages/runtime/copilotkit-runtime-1.9.2-next.9.tgz",
    "@copilotkit/react-textarea": "file:../CopilotKit/packages/react-textarea/copilotkit-react-textarea-1.9.2-next.9.tgz"
  }
}

# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Option B: Using pnpm (May encounter dependency conflicts)**

```bash
# Install packages in dependency order to avoid conflicts
pnpm add ../CopilotKit/packages/shared/copilotkit-shared-*.tgz
pnpm add ../CopilotKit/packages/runtime-client-gql/copilotkit-runtime-client-gql-*.tgz
pnpm add ../CopilotKit/packages/react-core/copilotkit-react-core-*.tgz
pnpm add ../CopilotKit/packages/react-ui/copilotkit-react-ui-*.tgz
pnpm add ../CopilotKit/packages/runtime/copilotkit-runtime-*.tgz
```

**Why npm is recommended over pnpm for local testing:**
- npm handles tarball installation more reliably
- pnpm may encounter dependency resolution conflicts with workspace packages
- npm provides cleaner error messages when dependency issues occur

### Step 5: Create a Basic Test Setup

#### Create API Route (`src/app/api/copilotkit/route.ts`):

```typescript
import { CopilotRuntime, OpenAIAdapter } from "@copilotkit/runtime";
import OpenAI from "openai";
import { NextRequest } from "next/server";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const copilotKit = new CopilotRuntime();

export const POST = async (req: NextRequest) => {
  const { handleRequest } = copilotKit.router;
  
  return handleRequest(req, new OpenAIAdapter({ openai }));
};
```

#### Update Main Page (`src/app/page.tsx`):

```typescript
"use client";

import { CopilotKit } from "@copilotkit/react-core";
import { CopilotPopup } from "@copilotkit/react-ui";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import { useState } from "react";

function TestComponent() {
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<string[]>([]);

  // Test useCopilotReadable
  useCopilotReadable({
    description: "Current count value",
    value: count,
  });

  useCopilotReadable({
    description: "List of items",
    value: items,
  });

  // Test useCopilotAction
  useCopilotAction({
    name: "incrementCounter",
    description: "Increment the counter by a given amount",
    parameters: [
      {
        name: "amount",
        type: "number",
        description: "Amount to increment by",
        required: true,
      },
    ],
    handler: async ({ amount }) => {
      setCount(prev => prev + amount);
    },
  });

  useCopilotAction({
    name: "addItem",
    description: "Add an item to the list",
    parameters: [
      {
        name: "item",
        type: "string",
        description: "Item to add to the list",
        required: true,
      },
    ],
    handler: async ({ item }) => {
      setItems(prev => [...prev, item]);
    },
  });

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">CopilotKit Test App</h1>
      
      <div className="space-y-2">
        <p className="text-lg">Count: {count}</p>
        <button 
          onClick={() => setCount(c => c + 1)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Increment
        </button>
      </div>

      <div className="space-y-2">
        <p className="text-lg">Items ({items.length}):</p>
        <ul className="list-disc list-inside">
          {items.map((item, index) => (
            <li key={index}>{item}</li>
          ))}
        </ul>
        <button 
          onClick={() => setItems(prev => [...prev, `Item ${prev.length + 1}`])}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Add Item
        </button>
      </div>

      <div className="text-sm text-gray-600">
        <p>Test the AI assistant by asking it to:</p>
        <ul className="list-disc list-inside ml-4">
          <li>Increment the counter by 5</li>
          <li>Add "Shopping" to the list</li>
          <li>What's the current count?</li>
          <li>How many items are in the list?</li>
        </ul>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      <TestComponent />
      <CopilotPopup
        instructions="You are a helpful assistant that can interact with the counter and items list. Help users increment the counter and manage their items."
        labels={{
          title: "CopilotKit Test Assistant",
          initial: "Hi! I can help you test CopilotKit features."
        }}
      />
    </CopilotKit>
  );
}
```

#### Add Environment Variables (`.env.local`):

```bash
OPENAI_API_KEY=your_openai_api_key_here
```

#### Update CSS (`src/app/globals.css`):

```css
@import "tailwindcss";

/* Add CopilotKit styles */
@import "@copilotkit/react-ui/styles.css";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
```

### Step 6: Test All Components

Run your test app:

```bash
pnpm dev
```

## Method 2: Using Workspace Linking (Alternative)

**⚠️ Warning:** This method frequently encounters workspace dependency conflicts and is not recommended for reliable local testing. Use Method 1 (tarball) instead.

**Common issues with workspace linking:**
- `workspace:*` dependencies in local packages can't resolve properly when linked globally
- Symlink conflicts between pnpm workspaces and global links
- Runtime errors due to missing or incorrectly resolved dependencies
- Version mismatches between linked packages and their dependencies

**When to use this method:**
- Only if you need to make frequent changes to CopilotKit source code during development
- If you're contributing to CopilotKit and need live updates
- As a last resort if tarball method fails for specific environment reasons

### Step 1: Link CopilotKit Packages Globally

From the CopilotKit root directory:

```bash
cd CopilotKit
turbo run link:global
```

This links all packages globally:
- `@copilotkit/react-core`
- `@copilotkit/react-ui` 
- `@copilotkit/react-textarea`
- `@copilotkit/runtime`
- `@copilotkit/runtime-client-gql`
- `@copilotkit/shared`
- `@copilotkit/sdk-js`

### Step 2: Create a Test Next.js App

```bash
# Go back to root directory
cd /path/to/CopilotKit
echo "n" | npx create-next-app@latest copilotkit-test --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd copilotkit-test
```

### Step 3: Install Additional Dependencies

```bash
pnpm add openai react-markdown
pnpm add -D @types/node
```

### Step 4: Link CopilotKit Packages to Your App

```bash
pnpm link --global @copilotkit/shared
pnpm link --global @copilotkit/runtime-client-gql
pnpm link --global @copilotkit/react-core
pnpm link --global @copilotkit/react-ui
pnpm link --global @copilotkit/runtime
```

**If linking fails with symlink errors, use Method 1 (tarball installation) instead.**

### Step 5: Continue with the same setup

Follow the same steps as Method 1 from "Step 5: Create a Basic Test Setup" onwards.

## Method 3: Using Examples from the Repository

### Test Existing Examples

CopilotKit provides pre-built examples you can use for testing:

```bash
# Test the basic Next.js example
cd CopilotKit/examples/next-openai
pnpm install
pnpm run example-dev

# Test form filling example  
cd ../../examples/copilot-form-filling
pnpm install
pnpm dev

# Test chat with data example
cd ../copilot-chat-with-your-data  
pnpm install
pnpm dev
```

## Testing Checklist

### Core Functionality Tests

- [ ] **CopilotProvider**: App initializes without errors
- [ ] **useCopilotReadable**: AI can read application state
- [ ] **useCopilotAction**: AI can execute functions
- [ ] **CopilotPopup**: Popup interface works correctly
- [ ] **CopilotSidebar**: Sidebar interface (if testing)
- [ ] **CopilotChat**: Headless chat functionality

### Advanced Features Tests

- [ ] **useCopilotTextarea**: Smart autocompletion in text areas
- [ ] **Image uploads**: Test image handling in chat
- [ ] **Streaming responses**: Real-time AI responses
- [ ] **Error handling**: Graceful error states
- [ ] **Customization**: Custom styling and components

### Integration Tests

- [ ] **API Routes**: Backend runtime processes requests
- [ ] **Environment variables**: Configuration works correctly
- [ ] **Build process**: App builds without errors
- [ ] **TypeScript**: No type errors in development

## Common Issues and Solutions

### Package Linking Issues

If Method 2 (workspace linking) fails:
```bash
# Unlink and re-link
cd CopilotKit
turbo run unlink:global
turbo run link:global

# In your test app
pnpm unlink --global @copilotkit/react-core
pnpm link --global @copilotkit/react-core
```

**If you encounter symlink errors or workspace dependency conflicts, use Method 1 (tarball installation) instead.**

### Workspace Dependency Resolution Issues

**Common error patterns:**
- `Cannot read properties of null (reading 'matches')` - npm dependency resolution failure
- `Module not found: Can't resolve '@copilotkit/shared'` - workspace dependency not found
- `CopilotTraceHandler is not exported` - version mismatch between packages
- Runtime errors about missing functions or types

**Root cause:**
- CopilotKit packages use `workspace:*` dependencies to reference each other
- When packed as tarballs, these get resolved to actual version numbers
- When linked globally, `workspace:*` dependencies can't resolve properly
- This causes build failures and runtime errors

**Solution:**
- Always use Method 1 (tarball installation) for reliable local testing
- Only use linking for active development where you need live updates

### Build Errors

If you get build errors:
```bash
# Rebuild CopilotKit packages
cd CopilotKit
pnpm freshbuild

# Clear Next.js cache
cd your-test-app
rm -rf .next
pnpm dev
```

**Note:** The build process can take 3-5 minutes and may timeout in some environments. This is normal for the first build.

### Runtime Errors

Common fixes:
- Ensure all environment variables are set
- Check that API routes are correctly configured
- Verify OpenAI API key is valid
- Make sure all required dependencies are installed

## Testing Different LLM Providers

### Test with OpenAI

```typescript
import { OpenAIAdapter } from "@copilotkit/runtime";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
return handleRequest(req, new OpenAIAdapter({ openai }));
```

### Test with Anthropic

```typescript
import { AnthropicAdapter } from "@copilotkit/runtime";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
return handleRequest(req, new AnthropicAdapter({ anthropic }));
```

### Test with Google

```typescript
import { GoogleGenerativeAIAdapter } from "@copilotkit/runtime";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
return handleRequest(req, new GoogleGenerativeAIAdapter({ googleGenerativeAI: genAI }));
```

## Performance Testing

Monitor these metrics during testing:
- Initial page load time
- Time to first AI response
- Memory usage during long conversations
- Network request sizes
- Bundle size impact

## Cleanup

When finished testing:

```bash
# For Method 1 (tarball): Simply remove the test app
rm -rf copilotkit-test

# For Method 2 (workspace linking): Unlink packages first
cd CopilotKit
turbo run unlink:global

# Then remove test app
rm -rf copilotkit-test
```

## Summary of Key Learnings

**Why tarball installation is recommended:**
1. **Workspace dependency conflicts**: `workspace:*` dependencies in CopilotKit packages can't resolve properly when using global linking
2. **Reliability**: Tarball installation provides consistent behavior across different environments
3. **Package manager compatibility**: Works reliably with both npm and pnpm
4. **Error prevention**: Avoids common runtime errors like missing exports or type mismatches

**When to use each method:**
- **Method 1 (Tarball)**: Default choice for testing local changes
- **Method 2 (Linking)**: Only for active development with frequent changes
- **Method 3 (Examples)**: For testing existing functionality without local changes

**Package manager recommendations:**
- **For building CopilotKit**: Use pnpm (required for workspace management)
- **For testing applications**: Use npm (more reliable with tarball installation)
- **Why switch**: pnpm is optimized for monorepos, npm is better for single-package installation

This guide ensures comprehensive testing of all CopilotKit packages in a real Next.js App Router environment while avoiding common pitfalls with workspace dependency management.