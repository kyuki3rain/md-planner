import { describe, expect, it } from "vitest";
import { z } from "zod";

import { formatZodError, parseWithSchema } from "./zod";

describe("parseWithSchema", () => {
  it("returns ok when the payload is valid", () => {
    const schema = z.object({ name: z.string() });
    const result = parseWithSchema(schema, { name: "md-planner" }, { subject: "Test" });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toEqual({ name: "md-planner" });
    }
  });

  it("returns err when the payload is invalid", () => {
    const schema = z.object({ name: z.string().min(2) });
    const result = parseWithSchema(schema, { name: "" }, { subject: "Schema" });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toBe("Schema is invalid");
      const firstIssue = result.error.issues[0];
      expect(firstIssue?.code).toBe("too_small");
      expect(firstIssue?.message).toContain("string");
      expect(formatZodError(result.error)).toContain("Schema is invalid");
    }
  });
});
