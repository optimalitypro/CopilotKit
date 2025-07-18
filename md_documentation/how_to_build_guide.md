# How to Build CopilotKit with pnpm

This guide documents the complete build process for CopilotKit using pnpm and Turborepo.

## Prerequisites

Before building CopilotKit, ensure you have:

- **Node.js 20.x or later** - Required for modern JavaScript features
- **pnpm v9.x** - Install globally: `npm i -g pnpm@^9`
- **Turborepo v2.x** - Install globally: `npm i -g turbo@2` (optional, as it's included in devDependencies)

## Repository Structure

CopilotKit is organized as a monorepo with the following structure:

```
CopilotKit/
├── CopilotKit/                    # Main workspace
│   ├── packages/                  # Core packages
│   │   ├── shared/               # Shared utilities and types
│   │   ├── runtime/              # Backend runtime
│   │   ├── runtime-client-gql/   # GraphQL client
│   │   ├── react-core/           # Core React hooks
│   │   ├── react-ui/             # UI components
│   │   ├── react-textarea/       # Smart textarea
│   │   └── sdk-js/               # JavaScript SDK
│   ├── examples/                 # Example applications
│   └── utilities/                # Build utilities
├── examples/                     # Standalone examples
├── docs/                         # Documentation site
└── sdk-python/                   # Python SDK
```

## Build Process Overview

The build process uses:
- **pnpm workspaces** for dependency management
- **Turborepo** for task orchestration and caching
- **tsup** for TypeScript compilation
- **GraphQL Code Generation** for type-safe GraphQL

## Step-by-Step Build Instructions

### 1. Clone and Setup

```bash
git clone https://github.com/CopilotKit/CopilotKit.git
cd CopilotKit
```

### 2. Install Dependencies

Install all dependencies across the monorepo:

```bash
pnpm install
```

This command:
- Installs dependencies for the root workspace
- Installs dependencies for all packages in `CopilotKit/packages/`
- Installs dependencies for all examples
- Creates symlinks for workspace dependencies
- Takes ~30-60 seconds depending on network speed

**Expected output:**
```
Scope: all X workspace projects
Lockfile is up to date, resolution step is skipped
Packages: +1726
Progress: resolved 1726, reused 1442, downloaded 260, added 1726, done
```

### 3. Build All Packages

Build all packages in the correct dependency order:

```bash
cd CopilotKit
turbo build
```

**Note:** The build process can take 3-5 minutes, especially on the first run. If you encounter timeout errors, this is normal and the build may still complete successfully.

**What happens during build:**

#### Stage 1: Shared Package (`@copilotkit/shared`)
- Compiles TypeScript to both ESM and CJS formats
- Generates type definitions (.d.ts files)
- Creates source maps for debugging
- Build time: ~6-8 seconds

#### Stage 2: Core Packages (Parallel)
- **`@copilotkit/sdk-js`**: JavaScript SDK compilation (~9 seconds)
- **`@copilotkit/runtime`**: Backend runtime with GraphQL schema generation (~35 seconds)

#### Stage 3: GraphQL Client (`@copilotkit/runtime-client-gql`)
- Generates GraphQL types from schema
- Compiles TypeScript with generated types
- Build time: ~15 seconds

#### Stage 4: React Packages (Parallel)
- **`@copilotkit/react-core`**: Core React hooks and providers (~25 seconds)
- **`@copilotkit/react-textarea`**: Smart textarea component (~30 seconds)
- **`@copilotkit/react-ui`**: UI components with CSS processing (~35 seconds)

**Total build time: ~2-3 minutes**

### 4. Verify Build Success

Check that all packages built successfully:

```bash
# Verify dist folders exist
ls CopilotKit/packages/*/dist

# Check for any build errors
turbo build --dry-run
```

## Build Configuration Details

### Package Manager Configuration

**pnpm-workspace.yaml:**
```yaml
packages:
  - "examples/*"
  - "packages/*" 
  - "utilities/*"
```

**Root package.json scripts:**
```json
{
  "scripts": {
    "build": "turbo build",
    "dev": "turbo dev --concurrency 14",
    "clean": "turbo clean",
    "freshbuild": "pnpm -w clean && pnpm i && pnpm -w build"
  }
}
```

### Turborepo Configuration

**turbo.json key settings:**
```json
{
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    }
  }
}
```

### TypeScript Compilation

Each package uses **tsup** for fast TypeScript compilation:

```typescript
// tsup.config.ts (typical configuration)
export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
});
```

**Output formats:**
- **ESM**: Modern module format (`dist/*.mjs`)
- **CJS**: CommonJS format (`dist/*.js`)
- **TypeScript**: Declaration files (`dist/*.d.ts`)
- **Source Maps**: For debugging support

### Special Build Steps

#### Runtime Package
The runtime package has additional steps:
1. TypeScript compilation
2. GraphQL schema generation from TypeScript decorators
3. Schema export to `__snapshots__/schema/schema.graphql`

#### Runtime Client Package  
The GraphQL client package:
1. Reads schema from runtime package
2. Generates TypeScript types from GraphQL schema
3. Compiles with generated types

## Advanced Build Commands

### Development Mode

Start all packages in watch mode:

```bash
turbo dev
```

Start specific packages:
```bash
turbo dev --filter="@copilotkit/react-core"
turbo dev --filter="@copilotkit/runtime"
```

### Clean Build

Remove all build artifacts and rebuild:

```bash
cd CopilotKit
pnpm freshbuild
```

**Important:** The `freshbuild` command must be run from the `CopilotKit` subdirectory, not the root directory.

This runs:
1. `pnpm clean` - Removes node_modules and dist folders
2. `pnpm install` - Reinstalls all dependencies  
3. `pnpm build` - Rebuilds all packages

### Selective Building

Build only specific packages:

```bash
# Build only runtime and its dependencies
turbo build --filter="@copilotkit/runtime"

# Build all React packages
turbo build --filter="@copilotkit/react-*"
```

### Package Linking

For local development, link packages globally:

```bash
cd CopilotKit
turbo run link:global
```

Unlink when done:
```bash
cd CopilotKit
turbo run unlink:global
```

**⚠️ Important:** Package linking frequently encounters workspace dependency conflicts due to `workspace:*` dependency resolution issues. When local packages with `workspace:*` dependencies are linked globally, they can't resolve their internal dependencies properly, leading to build failures and runtime errors.

**Recommended Alternative:** Use the tarball installation method described in the local testing guide, which avoids these workspace dependency conflicts entirely.

## Build Output Structure

After a successful build, each package will have:

```
packages/[package]/
├── dist/
│   ├── index.js          # CJS entry point
│   ├── index.mjs         # ESM entry point  
│   ├── index.d.ts        # TypeScript definitions
│   ├── *.js.map          # Source maps
│   └── [other modules]   # Additional compiled modules
├── package.json          # Package metadata
└── tsconfig.json         # TypeScript config
```

## Troubleshooting Build Issues

### Common Build Errors

**1. TypeScript Errors**
```bash
# Check types without building
turbo check-types

# Fix common issues
pnpm format
```

**2. Dependency Issues**
```bash
# Reinstall dependencies
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**3. Stale Build Cache**
```bash
# Clear Turbo cache
cd CopilotKit
turbo build --force

# Clear all caches
cd CopilotKit
pnpm clean
```

**4. Missing Global Dependencies**
```bash
# Reinstall global tools
npm i -g pnpm@^9 turbo@2
```

### Performance Tips

**Speed up builds:**
- Use `turbo build` (with caching) instead of rebuilding everything
- Use `--filter` to build only what you need
- Enable remote caching if working in a team

**Monitor build:**
- Use `turbo build --dry-run` to see what will be built
- Add `--verbose` flag for detailed output
- Check individual package logs for specific errors

**Build Timeouts:**
- Build process typically takes 3-5 minutes
- First builds may take longer due to dependency resolution
- Timeout errors don't necessarily mean build failure - check output directories

## Continuous Integration

For CI/CD pipelines, use:

```bash
# Install dependencies
pnpm install --frozen-lockfile

# Build with cache
turbo build --cache-dir=.turbo

# Run tests
turbo test

# Check formatting and linting
turbo lint
pnpm check-prettier
```

## Build Artifacts

The build process generates the following distributable artifacts:

- **npm packages**: Ready for publishing to npm registry
- **Type definitions**: Full TypeScript support
- **Source maps**: For debugging in production
- **GraphQL schema**: API documentation and client generation
- **Example apps**: Deployable demonstration applications

### Creating Package Tarballs for Local Testing

To create tarballs for local testing (recommended over linking):

```bash
cd CopilotKit
turbo build

# Create tarballs for all packages
cd packages/shared && pnpm pack
cd ../runtime-client-gql && pnpm pack
cd ../react-core && pnpm pack
cd ../react-ui && pnpm pack
cd ../runtime && pnpm pack
cd ../react-textarea && pnpm pack
cd ../sdk-js && pnpm pack
```

This creates `.tgz` files that can be installed directly in test applications using:
```bash
npm install file:../path/to/package.tgz
```

**Advantages of tarball method:**
- Avoids workspace dependency conflicts
- Works with both npm and pnpm
- Provides more reliable local testing
- Simulates actual package installation process

## Next Steps

After building:
1. **Test locally**: Use the local testing guide (`local_test_guide.md`)
2. **Run examples**: Test with provided example applications
3. **Develop**: Start development with `turbo dev`
4. **Deploy**: Use built packages in your applications

This build system ensures type safety, optimal bundle sizes, and developer experience across the entire CopilotKit ecosystem.