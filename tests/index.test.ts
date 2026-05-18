import { describe, expect, it } from "vitest";

import {
  AI_MCP_ENV_PREFIX,
  AI_MCP_FEATURE_FLAGS,
  AI_MCP_FEATURE_FLAG_ID,
  AI_MCP_PACKAGE,
  AI_MCP_TOOL_RISK_CLASSES,
  AI_MCP_TOOL_ROLES,
  isAiMcpToolAllowed,
  isAiMcpToolRiskAllowed,
  resolveAiMcpToolAllowlist,
  packageDescriptor,
} from "../src/index.js";

describe("@plasius/ai-mcp", () => {
  const toolRegistry = [
    {
      toolId: "tool.safe",
      toolName: "Safe Tool",
      riskClass: AI_MCP_TOOL_RISK_CLASSES[0],
    },
    {
      toolId: "tool.sensitive",
      toolName: "Sensitive Tool",
      riskClass: AI_MCP_TOOL_RISK_CLASSES[1],
    },
    {
      toolId: "tool.privileged",
      toolName: "Privileged Tool",
      riskClass: AI_MCP_TOOL_RISK_CLASSES[2],
    },
    {
      toolId: "tool.restricted",
      toolName: "Restricted Tool",
      riskClass: AI_MCP_TOOL_RISK_CLASSES[3],
    },
  ];

  it("exports the package descriptor contract", () => {
    expect(packageDescriptor.packageName).toBe(AI_MCP_PACKAGE);
    expect(packageDescriptor.featureFlagId).toBe(AI_MCP_FEATURE_FLAG_ID);
    expect(packageDescriptor.envPrefix).toBe(AI_MCP_ENV_PREFIX);
    expect(packageDescriptor.summary.length).toBeGreaterThan(0);
  });

  it("declares MCP feature flag contract", () => {
    expect(AI_MCP_FEATURE_FLAGS).toEqual({
      mcp: AI_MCP_FEATURE_FLAG_ID,
    });
  });

  it("denies all requested tools when MCP is disabled", () => {
    const result = resolveAiMcpToolAllowlist({
      requestedTools: ["tool.safe", "tool.privileged"],
      toolRegistry,
      actorRole: "player",
    });

    expect(result).toMatchObject({
      allowedTools: [],
      blockedTools: ["tool.safe", "tool.privileged"],
      needsEscalation: true,
      source: "policy-disabled",
      enabledFeatureFlags: [],
      audit: {
        actorRole: "player",
        result: "deny",
      },
    });
    expect(result.audit.correlationId.length).toBeGreaterThan(0);
  });

  it("allows safe tools and blocks unrestricted roles from restricted tools", () => {
    const result = resolveAiMcpToolAllowlist({
      requestedTools: [
        "tool.safe",
        "tool.sensitive",
        "tool.restricted",
        "tool.privileged",
        "tool.unknown",
      ],
      toolRegistry,
      actorRole: "player",
      correlationId: "corr-2",
      featureFlags: {
        [AI_MCP_FEATURE_FLAGS.mcp]: true,
      },
    });

    expect(result).toMatchObject({
      allowedTools: ["tool.safe"],
      blockedTools: expect.arrayContaining([
        "tool.sensitive",
        "tool.restricted",
        "tool.unknown",
        "tool.privileged",
      ]),
      source: "policy",
      audit: {
        actorRole: "player",
        result: "escalate",
      },
    });
    expect(result.reasonCodes.some((item) => item.startsWith("tool-not-registered:")).valueOf()).toBe(true);
  });

  it("permits privileged tool for operator role", () => {
    expect(
      resolveAiMcpToolAllowlist({
        requestedTools: ["tool.sensitive", "tool.privileged"],
        toolRegistry,
        actorRole: "operator",
        featureFlags: {
          [AI_MCP_FEATURE_FLAGS.mcp]: true,
        },
      })
    ).toMatchObject({
      allowedTools: ["tool.sensitive", "tool.privileged"],
      blockedTools: [],
      needsEscalation: false,
      audit: {
        actorRole: "operator",
        result: "allow",
      },
    });
  });

  it("returns deterministic risk gating results", () => {
    expect(isAiMcpToolAllowed("tool.safe", "player", toolRegistry)).toBe(true);
    expect(isAiMcpToolAllowed("tool.sensitive", "player", toolRegistry)).toBe(false);
    expect(isAiMcpToolAllowed("tool.missing", "admin", toolRegistry)).toBe(false);
    expect(isAiMcpToolRiskAllowed("sensitive", "operator")).toBe(true);
    expect(isAiMcpToolRiskAllowed("sensitive", "player")).toBe(false);
    expect(isAiMcpToolRiskAllowed("restricted", "system")).toBe(true);
    expect(isAiMcpToolAllowed("tool.restricted", "player", toolRegistry)).toBe(false);
    expect(
      isAiMcpToolRiskAllowed("privileged", "admin")
    ).toBe(true);
    expect(
      isAiMcpToolRiskAllowed("restricted", "operator")
    ).toBe(false);

    for (const role of AI_MCP_TOOL_ROLES) {
      expect(typeof role).toBe("string");
    }
  });

  it("reports empty enabled allowlist requests as deny-all", () => {
    const result = resolveAiMcpToolAllowlist({
      requestedTools: [],
      toolRegistry,
      actorRole: "admin",
      featureFlags: {
        [AI_MCP_FEATURE_FLAGS.mcp]: true,
      },
    });

    expect(result).toMatchObject({
      allowedTools: [],
      blockedTools: [],
      source: "policy-allow-empty",
      audit: {
        result: "deny",
      },
    });
    expect(result.reasonCodes).toEqual(expect.arrayContaining([
      "mcp-allowlist-deny-all",
      "mcp-allowlist-empty-request",
    ]));
  });

  it("defaults missing actor role and registry to deny unregistered tools", () => {
    const result = resolveAiMcpToolAllowlist({
      requestedTools: ["tool.missing"],
      featureFlags: {
        [AI_MCP_FEATURE_FLAGS.mcp]: true,
      },
    });

    expect(result).toMatchObject({
      allowedTools: [],
      blockedTools: ["tool.missing"],
      needsEscalation: false,
      audit: {
        actorRole: "player",
        result: "deny",
      },
    });
    expect(result.reasonCodes).toContain("tool-not-registered:tool.missing");
  });
});
