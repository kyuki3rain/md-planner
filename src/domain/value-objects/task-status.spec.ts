import { describe, expect, it } from "vitest";

import { DEFAULT_STATUS_ORDER, isTaskStatus, parseTaskStatus } from "./task-status";

describe("TaskStatus", () => {
  it("parses valid status", () => {
    const result = parseTaskStatus("todo");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe("todo");
    }
  });

  it("rejects unknown status", () => {
    const result = parseTaskStatus("unknown");

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.message).toContain("TaskStatus is invalid");
    }
  });

  it("exposes a type guard", () => {
    expect(isTaskStatus("done")).toBe(true);
    expect(isTaskStatus("INVALID")).toBe(false);
  });

  it("defines a default order", () => {
    expect(DEFAULT_STATUS_ORDER).toEqual(["todo", "doing", "blocked", "done", "archived"]);
  });
});
