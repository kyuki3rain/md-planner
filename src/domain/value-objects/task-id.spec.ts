import { describe, expect, it } from "vitest";

import { isTaskId, parseTaskId } from "./task-id";

describe("TaskId", () => {
  it("parses and normalises valid identifiers", () => {
    const result = parseTaskId(" t-abc12 ");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe("T-ABC12");
    }
  });

  it("rejects invalid identifiers", () => {
    const result = parseTaskId("invalid id");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("TaskId is invalid");
    }
  });

  it("provides a type guard", () => {
    expect(isTaskId("T-12345")).toBe(true);
    expect(isTaskId("not-id")).toBe(false);
    expect(isTaskId(123)).toBe(false);
  });
});
