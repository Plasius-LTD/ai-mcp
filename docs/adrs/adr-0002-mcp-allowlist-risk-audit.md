# ADR-0002: MCP allowlist and risk-based execution gates

- Date: 2026-05-14
- Status: Accepted

## Context

MCP execution is part of the agentic AI boundary and requires strict minimization of available tools. A request should only execute from an allowlist based on role and tool risk class to avoid accidental privileged actions.

## Decision

`@plasius/ai-mcp` now exposes a deterministic allowlist resolver that:

- requires explicit `ai.mcp-rag.enabled` feature gate;
- evaluates requested tool IDs against a registry of tool descriptors;
- enforces role-based risk-class constraints;
- returns structured outcomes including allowed/blocked tools and audit metadata.

## Consequences

- Tool access is explicit and inspectable per request.
- Downstream callers can enforce telemetry and policy with reason codes.
- Restricted or unknown tools are denied by default when policy is unavailable.
- Audits now include decision outcome and policy references for compliance traceability.
