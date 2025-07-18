# OptimalityPro CI/CD Guide: Publishing CopilotKit to Organization GitHub NPM Registry

This guide helps you set up GitHub Actions workflows to automatically build, test, and publish CopilotKit packages to your organization's GitHub NPM registry.

## Overview

This setup provides:
- **Automated CI/CD pipeline** for building and testing CopilotKit packages
- **Secure publishing** to GitHub Packages NPM registry
- **Version management** using changesets
- **Quality gates** with linting, formatting, and testing
- **Monorepo support** using Turborepo for efficient builds

## Prerequisites

1. **GitHub Organization**: Your CopilotKit fork in the OptimalityPro organization
2. **Repository Access**: Admin access to configure secrets and settings
3. **GitHub Packages**: Access to your organization's GitHub Packages registry

## Step 1: Configure Repository Settings

### Enable GitHub Packages

1. Go to your repository settings
2. Navigate to **Settings > General > Features**
3. Ensure **Packages** is enabled
4. Go to **Settings > Actions > General**
5. Set **Workflow permissions** to "Read and write permissions"
6. Check "Allow GitHub Actions to create and approve pull requests"

### Package Registry Configuration

Your packages will be published to:
```
https://npm.pkg.github.com/@optimalitypro
```

## Step 2: Configure Package.json Files

Update each package's `package.json` to use your organization scope:

### Root Package.json (CopilotKit/package.json)

```json
{
  "name": "@optimalitypro/copilotkit",
  "private": false,
  "repository": {
    "type": "git",
    "url": "https://github.com/optimalitypro/CopilotKit.git"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

### Individual Package Files

Update each package in `CopilotKit/packages/*/package.json`:

```json
{
  "name": "@optimalitypro/react-core",
  "repository": {
    "type": "git",
    "url": "https://github.com/optimalitypro/CopilotKit.git"
  },
  "publishConfig": {
    "registry": "https://npm.pkg.github.com"
  }
}
```

**Packages to update:**
- `@optimalitypro/shared`
- `@optimalitypro/runtime`
- `@optimalitypro/runtime-client-gql`
- `@optimalitypro/react-core`
- `@optimalitypro/react-ui`
- `@optimalitypro/react-textarea`
- `@optimalitypro/sdk-js`

## Step 3: GitHub Secrets Configuration

Set up the following secrets in your repository:

### Required Secrets

Go to **Settings > Secrets and variables > Actions** and add:

1. **`GITHUB_TOKEN`** (automatically provided by GitHub)
2. **`NPM_TOKEN`** - Personal Access Token with packages:write permission

### Creating NPM_TOKEN

1. Go to **GitHub > Settings > Developer settings > Personal access tokens > Tokens (classic)**
2. Click **Generate new token (classic)**
3. Set **Expiration**: No expiration (or your organization's policy)
4. Select scopes:
   - `write:packages` - Upload packages to GitHub Package Registry
   - `read:packages` - Download packages from GitHub Package Registry
   - `delete:packages` - Delete packages from GitHub Package Registry (optional)
5. Copy the token and add it as `NPM_TOKEN` secret

## Step 4: Create GitHub Workflows

Create the following workflow files in `.github/workflows/`:

### 1. Main CI Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI

on:
  push:
    branches: [main]
    paths-ignore:
      - 'docs/**'
      - 'README.md'
      - 'examples/**'
      - 'CopilotKit/packages/**/package.json'
      - 'CopilotKit/packages/**/CHANGELOG.md'
      - 'CopilotKit/.changeset/**'
  pull_request:
    branches: [main]
    paths-ignore:
      - 'docs/**'
      - 'README.md'
      - 'examples/**'

jobs:
  test:
    name: 'Build and Test'
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: 'CopilotKit'
    strategy:
      matrix:
        node-version: [20.x, 18.x]
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: "9.5"
    
      - name: Use Node.js ${{ matrix.node-version }}
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}
          registry-url: 'https://npm.pkg.github.com'
          scope: '@optimalitypro'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm run lint

      - name: Check formatting
        run: pnpm run check-prettier

      - name: Type check
        run: pnpm run check-types

      - name: Build
        run: pnpm run build

      - name: Run tests
        run: pnpm run test
```

### 2. Release Workflow (`.github/workflows/release.yml`)

```yaml
name: Release

on:
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Release type'
        required: true
        default: 'patch'
        type: choice
        options:
          - patch
          - minor
          - major
          - prerelease
  push:
    branches:
      - main
    paths:
      - 'CopilotKit/.changeset/**'

concurrency: ${{ github.workflow }}-${{ github.ref }}

jobs:
  release:
    name: Release to GitHub Packages
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: "CopilotKit"
    timeout-minutes: 15
    
    steps:
      - name: Checkout Repo
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20.x
          registry-url: 'https://npm.pkg.github.com'
          scope: '@optimalitypro'
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: "9.5"

      - name: Install Dependencies
        run: pnpm install --frozen-lockfile

      - name: Build Packages
        run: pnpm run build

      - name: Get current version
        id: current-version
        run: |
          echo "version=$(node -p "require('./packages/react-core/package.json').version")" >> "$GITHUB_OUTPUT"

      - name: Create Release PR or Publish
        id: changesets
        uses: changesets/action@v1
        with:
          publish: pnpm release:publish
          version: pnpm release:version
          commit: "ci: update package versions"
          title: "ci: update package versions"
          setupGitUser: true
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}

      - name: Get new version
        id: new-version
        run: |
          echo "version=$(node -p "require('./packages/react-core/package.json').version")" >> "$GITHUB_OUTPUT"

      - name: Create Git Tag
        if: steps.changesets.outputs.published == 'true'
        run: |
          git config --global user.email "github-actions[bot]@users.noreply.github.com"
          git config --global user.name "github-actions[bot]"
          git tag -a "v${{ steps.new-version.outputs.version }}" -m "Release v${{ steps.new-version.outputs.version }}"
          git push origin "v${{ steps.new-version.outputs.version }}"

      - name: Create GitHub Release
        if: steps.changesets.outputs.published == 'true'
        uses: actions/create-release@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tag_name: v${{ steps.new-version.outputs.version }}
          release_name: v${{ steps.new-version.outputs.version }}
          body: |
            ## Changes in v${{ steps.new-version.outputs.version }}
            
            Published packages:
            ${{ steps.changesets.outputs.publishedPackages }}
          draft: false
          prerelease: false
```

### 3. Quality Checks Workflow (`.github/workflows/quality.yml`)

```yaml
name: Quality

on:
  pull_request:
    branches: [main]

jobs:
  quality:
    name: Quality Checks
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: 'CopilotKit'
    
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v4
        with:
          version: "9.5"

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20.x

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm run lint

      - name: Check Prettier
        run: pnpm run check-prettier

      - name: Type Check
        run: pnpm run check-types
```

## Step 5: Update Package Scripts

Add the following scripts to your root `CopilotKit/package.json`:

```json
{
  "scripts": {
    "release:version": "changeset version",
    "release:publish": "changeset publish"
  }
}
```

## Step 6: Configure Changesets

### Initialize Changesets (if not already configured)

```bash
cd CopilotKit
npx @changesets/cli init
```

### Update Changeset Config (`.changeset/config.json`)

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": ["@optimalitypro/eslint-config-custom", "@optimalitypro/tailwind-config", "@optimalitypro/tsconfig"]
}
```

## Step 7: Publishing Workflow

### Automatic Publishing (Recommended)

1. **Create a changeset** for your changes:
   ```bash
   cd CopilotKit
   npx changeset
   ```

2. **Commit and push** the changeset file

3. **GitHub Actions will**:
   - Create a "Release" PR with version bumps
   - When you merge the PR, packages are automatically published

### Manual Publishing

1. **Trigger workflow manually**:
   - Go to Actions tab in GitHub
   - Select "Release" workflow
   - Click "Run workflow"
   - Choose release type (patch/minor/major/prerelease)

## Step 8: Using Published Packages

### Installation from GitHub Packages

Create `.npmrc` in your project root:

```bash
@optimalitypro:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

Install packages:

```bash
npm install @optimalitypro/react-core
npm install @optimalitypro/react-ui
npm install @optimalitypro/runtime
```

### Environment Variables

Set `GITHUB_TOKEN` environment variable with a token that has `read:packages` permission.

## Step 9: Security Considerations

### Repository Security

1. **Branch Protection**: Enable branch protection on `main`
   - Require PR reviews
   - Require status checks to pass
   - Require branches to be up to date

2. **Secrets Management**: 
   - Use repository secrets for sensitive data
   - Regularly rotate access tokens
   - Use least-privilege principles

3. **Workflow Security**:
   - Use specific action versions (not `@latest`)
   - Review third-party actions before use
   - Enable dependency scanning

### Package Security

1. **Access Control**: Configure package permissions in GitHub Packages
2. **Version Signing**: Consider using package signing for verification
3. **Vulnerability Scanning**: Enable GitHub security advisories

## Step 10: Monitoring and Maintenance

### Monitoring

1. **Workflow Status**: Monitor action runs in the Actions tab
2. **Package Downloads**: Track usage in GitHub Packages
3. **Security Alerts**: Enable Dependabot for dependency updates

### Maintenance

1. **Regular Updates**: Keep action versions updated
2. **Token Rotation**: Regularly rotate access tokens
3. **Cleanup**: Remove old package versions as needed

## Common Issues and Solutions

### Publishing Failures

**Issue**: `403 Forbidden` when publishing
- **Solution**: Check `NODE_AUTH_TOKEN` is set correctly and has `write:packages` permission

**Issue**: Package name conflicts
- **Solution**: Ensure all package names use `@optimalitypro/` scope

**Issue**: Build timeouts
- **Solution**: Increase timeout in workflow or optimize build process

### Installation Issues

**Issue**: `404 Not Found` when installing
- **Solution**: Verify `.npmrc` configuration and token permissions

**Issue**: Authentication failures
- **Solution**: Check `GITHUB_TOKEN` environment variable in consumer projects

### Workflow Issues

**Issue**: Workflows not triggering
- **Solution**: Check branch protection rules and file paths in trigger conditions

**Issue**: Test failures in CI
- **Solution**: Ensure all tests pass locally before pushing

## Migration from NPM Registry

If migrating from public NPM registry:

1. **Update all import statements** in examples and documentation
2. **Update installation instructions** in README files
3. **Notify users** about the migration and new installation process
4. **Maintain compatibility** by keeping the same API surface

## Best Practices

1. **Semantic Versioning**: Use proper semver for version bumps
2. **Changelog Management**: Maintain clear changelogs for each release
3. **Testing**: Ensure comprehensive test coverage before publishing
4. **Documentation**: Keep installation and usage docs updated
5. **Monitoring**: Set up alerts for failed builds or publishes

This CI/CD setup ensures reliable, secure, and automated publishing of your CopilotKit packages to the OptimalityPro organization's GitHub NPM registry.