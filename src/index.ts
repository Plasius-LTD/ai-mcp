export interface AiPackageDescriptor {
  readonly packageName: string;
  readonly featureFlagId: string;
  readonly envPrefix: string;
  readonly summary: string;
}

export const AI_MCP_PACKAGE = "@plasius/ai-mcp";
export const AI_MCP_FEATURE_FLAG_ID = "ai.mcp-rag.enabled";
export const AI_MCP_ENV_PREFIX = "AI_MCP";

export const AI_MCP_FEATURE_FLAGS = {
  mcp: AI_MCP_FEATURE_FLAG_ID,
} as const;

export type AiMcpFeatureFlagKey =
  (typeof AI_MCP_FEATURE_FLAGS)[keyof typeof AI_MCP_FEATURE_FLAGS];

export type AiMcpFeatureFlagSnapshot = Readonly<
  Record<string, boolean | undefined>
>;

export const AI_MCP_TOOL_RISK_CLASSES = [
  "safe",
  "sensitive",
  "privileged",
  "restricted",
] as const;

export type AiMcpToolRiskClass = (typeof AI_MCP_TOOL_RISK_CLASSES)[number];

export const AI_MCP_TOOL_ROLES = ["system", "admin", "operator", "player"] as const;

export type AiMcpActorRole = (typeof AI_MCP_TOOL_ROLES)[number];

export const AI_MCP_RESOLUTION_SOURCES = [
  "policy",
  "policy-disabled",
  "policy-allow-empty",
] as const;

export type AiMcpResolutionSource = (typeof AI_MCP_RESOLUTION_SOURCES)[number];

export interface AiMcpToolDescriptor {
  readonly toolId: string;
  readonly toolName: string;
  readonly riskClass: AiMcpToolRiskClass;
  readonly description?: string;
}

export interface AiMcpAuditMetadata {
  readonly policyId: string;
  readonly policyVersion: string;
  readonly correlationId: string;
  readonly requestId?: string;
  readonly actorId?: string;
  readonly actorRole: AiMcpActorRole;
  readonly evaluatedAtUtc: string;
  readonly result: "allow" | "deny" | "escalate";
}

export interface ResolveAiMcpToolAllowlistInput {
  readonly requestedTools: readonly string[];
  readonly featureFlags?: AiMcpFeatureFlagSnapshot;
  readonly toolRegistry?: readonly AiMcpToolDescriptor[];
  readonly actorRole?: AiMcpActorRole;
  readonly requestId?: string;
  readonly actorId?: string;
  readonly correlationId?: string;
  readonly policyId?: string;
  readonly policyVersion?: string;
  readonly reasonCodes?: readonly string[];
}

export interface ResolveAiMcpToolAllowlistResult {
  readonly requestedTools: readonly string[];
  readonly allowedTools: readonly string[];
  readonly blockedTools: readonly string[];
  readonly needsEscalation: boolean;
  readonly reasonCodes: readonly string[];
  readonly source: AiMcpResolutionSource;
  readonly enabledFeatureFlags: readonly AiMcpFeatureFlagKey[];
  readonly audit: AiMcpAuditMetadata;
}

function nowIsoString(): string {
  return new Date().toISOString();
}

function normalizeToolIds(values: readonly string[]): string[] {
  const normalized = values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  return Array.from(new Set(normalized));
}

function isAiMcpFeatureEnabled(
  featureFlag: AiMcpFeatureFlagKey,
  snapshot: AiMcpFeatureFlagSnapshot = {}
): boolean {
  return snapshot[featureFlag] === true;
}

function isAllowedForRole(riskClass: AiMcpToolRiskClass, role: AiMcpActorRole): boolean {
  if (role === "system") {
    return true;
  }

  if (riskClass === "safe") {
    return true;
  }

  if (riskClass === "restricted") {
    return false;
  }

  if (riskClass === "privileged") {
    return role === "admin" || role === "operator";
  }

  return role === "admin" || role === "operator" || role === "player";
}

export function resolveAiMcpToolAllowlist(
  input: ResolveAiMcpToolAllowlistInput
): ResolveAiMcpToolAllowlistResult {
  const featureEnabled = isAiMcpFeatureEnabled(
    AI_MCP_FEATURE_FLAGS.mcp,
    input.featureFlags
  );
  const actorRole: AiMcpActorRole = input.actorRole ?? "player";
  const requestedTools = normalizeToolIds(input.requestedTools);
  const featureFlagIds: AiMcpFeatureFlagKey[] = featureEnabled
    ? [AI_MCP_FEATURE_FLAGS.mcp]
    : [];

  const reasonCodes = [...(input.reasonCodes ?? [])];
  const registryById = new Map(
    (input.toolRegistry ?? []).map((tool) => [tool.toolId, tool])
  );

  if (!featureEnabled) {
    reasonCodes.push("mcp-feature-disabled");

    return {
      requestedTools,
      allowedTools: [],
      blockedTools: requestedTools,
      needsEscalation: true,
      reasonCodes,
      source: "policy-disabled",
      enabledFeatureFlags: featureFlagIds,
      audit: {
        policyId: input.policyId ?? "mcp-policy-v1",
        policyVersion: input.policyVersion ?? "2026-05-01",
        correlationId: input.correlationId ?? crypto.randomUUID(),
        requestId: input.requestId,
        actorId: input.actorId,
        actorRole,
        evaluatedAtUtc: nowIsoString(),
        result: "deny",
      },
    };
  }

  const allowedTools: string[] = [];
  const blockedTools: string[] = [];

  for (const requestedTool of requestedTools) {
    const tool = registryById.get(requestedTool);

    if (!tool) {
      blockedTools.push(requestedTool);
      reasonCodes.push(`tool-not-registered:${requestedTool}`);
      continue;
    }

    if (!isAllowedForRole(tool.riskClass, actorRole)) {
      blockedTools.push(requestedTool);
      reasonCodes.push(`tool-risk-restricted:${requestedTool}`);
      continue;
    }

    allowedTools.push(requestedTool);
  }

  if (allowedTools.length === 0) {
    reasonCodes.push("mcp-allowlist-deny-all");
  }

  if (requestedTools.length === 0) {
    reasonCodes.push("mcp-allowlist-empty-request");
  }

  return {
    requestedTools,
    allowedTools,
    blockedTools,
    needsEscalation: blockedTools.length > 0 && allowedTools.length > 0,
    reasonCodes,
    source: requestedTools.length > 0 ? "policy" : "policy-allow-empty",
    enabledFeatureFlags: featureFlagIds,
    audit: {
      policyId: input.policyId ?? "mcp-policy-v1",
      policyVersion: input.policyVersion ?? "2026-05-01",
      correlationId: input.correlationId ?? crypto.randomUUID(),
      requestId: input.requestId,
      actorId: input.actorId,
      actorRole,
      evaluatedAtUtc: nowIsoString(),
      result:
        blockedTools.length === requestedTools.length
          ? "deny"
          : blockedTools.length > 0
            ? "escalate"
            : "allow",
    },
  };
}

export function isAiMcpToolRiskAllowed(
  riskClass: AiMcpToolRiskClass,
  actorRole: AiMcpActorRole
): boolean {
  return isAllowedForRole(riskClass, actorRole);
}

export function isAiMcpToolAllowed(
  toolId: string,
  actorRole: AiMcpActorRole,
  registry: readonly AiMcpToolDescriptor[]
): boolean {
  const tool = registry.find((candidate) => candidate.toolId === toolId);

  if (!tool) {
    return false;
  }

  return isAllowedForRole(tool.riskClass, actorRole);
}

export const packageDescriptor: AiPackageDescriptor = Object.freeze({
  packageName: AI_MCP_PACKAGE,
  featureFlagId: AI_MCP_FEATURE_FLAG_ID,
  envPrefix: AI_MCP_ENV_PREFIX,
  summary:
    "MCP tool registry, per-call allowlist, and audit contracts for Plasius AI orchestration.",
});
