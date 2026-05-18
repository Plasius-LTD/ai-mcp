# @plasius/ai-mcp

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

## Governance

- Security policy: [SECURITY.md](./SECURITY.md)
- Code of conduct: [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md)
- ADRs: [docs/adrs](./docs/adrs)
- CLA and legal docs: [legal](./legal)

## License

Apache-2.0
