export interface AiPackageDescriptor {
  readonly packageName: string;
  readonly featureFlagId: string;
  readonly envPrefix: string;
  readonly summary: string;
}

export const AI_MCP_PACKAGE = "@plasius/ai-mcp";
export const AI_MCP_FEATURE_FLAG_ID = "ai.mcp.enabled";
export const AI_MCP_ENV_PREFIX = "AI_MCP";

export const packageDescriptor: AiPackageDescriptor = Object.freeze({
  packageName: AI_MCP_PACKAGE,
  featureFlagId: AI_MCP_FEATURE_FLAG_ID,
  envPrefix: AI_MCP_ENV_PREFIX,
  summary: "MCP tool registry, per-call allowlist, and tool audit contracts for Plasius agentic AI.",
});
