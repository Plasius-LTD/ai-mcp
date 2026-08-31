# @plasius/ai-mcp

[![npm version](https://img.shields.io/npm/v/@plasius/ai-mcp.svg)](https://www.npmjs.com/package/@plasius/ai-mcp)
[![Build Status](https://img.shields.io/github/actions/workflow/status/Plasius-LTD/ai-mcp/ci.yml?branch=main&label=build&style=flat)](https://github.com/Plasius-LTD/ai-mcp/actions/workflows/ci.yml)
[![coverage](https://img.shields.io/codecov/c/github/Plasius-LTD/ai-mcp)](https://codecov.io/gh/Plasius-LTD/ai-mcp)
[![License](https://img.shields.io/github/license/Plasius-LTD/ai-mcp)](./LICENSE)
[![Code of Conduct](https://img.shields.io/badge/code%20of%20conduct-yes-blue.svg)](./CODE_OF_CONDUCT.md)
[![Security Policy](https://img.shields.io/badge/security%20policy-yes-orange.svg)](./SECURITY.md)
[![Changelog](https://img.shields.io/badge/changelog-md-blue.svg)](./CHANGELOG.md)

MCP tool registry, per-call allowlist, and tool audit contracts for Plasius AI orchestration.

## Scope

This package is part of the layered `@plasius/ai-*` package family. It defines the external contracts for MCP tool registration, per-call allowlisting, role-gated risk decisions, and audit metadata.

## Install

```bash
npm install @plasius/ai-mcp
```

## Contracts

- `AI_MCP_FEATURE_FLAGS` declares the feature flags that gate MCP behavior.
- `resolveAiMcpToolAllowlist` evaluates requested tool IDs against registry descriptors, feature flags, and actor roles.
- `isAiMcpToolAllowed` and `isAiMcpToolRiskAllowed` provide lightweight policy predicates for callers.
- `packageDescriptor` exposes package name, primary flag, env prefix, and summary.

## Usage

```ts
import {
  AI_MCP_FEATURE_FLAGS,
  resolveAiMcpToolAllowlist,
} from "@plasius/ai-mcp";

const result = resolveAiMcpToolAllowlist({
  requestedTools: ["rag.search", "admin.kill-switch"],
  actorRole: "operator",
  featureFlags: {
    [AI_MCP_FEATURE_FLAGS.mcp]: true,
  },
  toolRegistry: [
    {
      toolId: "rag.search",
      toolName: "RAG Search",
      riskClass: "safe",
    },
    {
      toolId: "admin.kill-switch",
      toolName: "Admin Kill Switch",
      riskClass: "restricted",
    },
  ],
});

console.log(result.allowedTools);
console.log(result.blockedTools);
```

## Development

```bash
npm install
npm run build
npm test
npm run test:coverage
npm run pack:check
```

## Release Workflow

Protected `main` releases use a two-step flow:

1. Run `.github/workflows/cd.yml` with `bump=patch|minor|major` to open or refresh a `release/vX.Y.Z` prep PR.
2. Merge that PR to `main`.
3. Rerun `.github/workflows/cd.yml` on `main` with `bump=none` to tag, draft the GitHub release, and publish to npm.

## Governance

- Security policy: [SECURITY.md](./SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- ADRs: [docs/adrs](./docs/adrs)
- CLA and legal docs: [legal](./legal)

## License

Apache-2.0
<!-- BEGIN PLASIUS RELEASE INTEGRITY -->
## Release integrity

Production package publication runs only from `.github/workflows/cd.yml` on
protected `main`. The job verifies that the prepared commit is still the
current main commit and has an exact successful `ci.yml` push result before it
mutates release state. Reviewed package CI runs on explicit GitHub-hosted
capacity with package-manager caching disabled and rejects fork PR execution.
npm publication runs on GitHub-hosted Node.js 24 with pinned npm 11.6.2, uses the protected `production` environment and
short-lived npm OIDC with provenance, and has no long-lived npm write-token
fallback. Rollback disables CD; it never rewrites published package history.
<!-- END PLASIUS RELEASE INTEGRITY -->
