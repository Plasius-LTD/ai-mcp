import { describe, expect, it } from "vitest";

import {
  AI_MCP_ENV_PREFIX,
  AI_MCP_FEATURE_FLAG_ID,
  AI_MCP_PACKAGE,
  packageDescriptor,
} from "../src/index.js";

describe("@plasius/ai-mcp", () => {
  it("exports the package descriptor contract", () => {
    expect(packageDescriptor.packageName).toBe(AI_MCP_PACKAGE);
    expect(packageDescriptor.featureFlagId).toBe(AI_MCP_FEATURE_FLAG_ID);
    expect(packageDescriptor.envPrefix).toBe(AI_MCP_ENV_PREFIX);
    expect(packageDescriptor.summary.length).toBeGreaterThan(0);
  });
});
