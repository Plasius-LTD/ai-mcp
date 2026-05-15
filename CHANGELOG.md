# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

- **Added**
  - Added MCP tool risk classes, actor-role-based allowlist resolution, and audit metadata.
  - Added deterministic tool-allowlist result contracts with blocked/allowed reason codes.

- **Changed**
  - Updated the MCP feature flag to align with family orchestration gating.

- **Fixed**
  - (placeholder)

- **Security**
  - Added restricted tool blocking and unsafe-role risk gating for safer MCP defaults.
  - Sensitive tools are now denied for player roles unless an operator/admin context authorizes them.

## [0.1.2] - 2026-05-13

- **Added**
  - (placeholder)

- **Changed**
  - Refreshed dependencies to the latest stable published versions.
  - (placeholder)

- **Fixed**
  - (placeholder)

- **Security**
  - (placeholder)

## [0.1.1] - 2026-05-13

- Added initial public package scaffold with governance, legal, docs, build, test, and pack-check baselines.


[0.1.2]: https://github.com/Plasius-LTD/ai-mcp/releases/tag/v0.1.2
[0.1.1]: https://github.com/Plasius-LTD/ai-mcp/releases/tag/v0.1.1
