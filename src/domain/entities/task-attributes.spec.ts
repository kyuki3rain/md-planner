import { describe, expect, it } from "vitest";

import { parseTaskAttributes } from "./task-attributes";

describe("TaskAttributes", () => {
  it("normalises attribute values", () => {
    const result = parseTaskAttributes({
      project: " clean-snap ",
      assignee: "@me",
      tags: [" backend ", "spec"],
      due: "2025-10-12",
      depends: ["t-abc12"],
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.project).toBe("clean-snap");
      expect(result.value.tags).toEqual(["backend", "spec"]);
      expect(result.value.due).toBe("2025-10-12");
      expect(result.value.depends?.[0]).toBe("T-ABC12");
    }
  });

  it("fails when nested values are invalid", () => {
    const result = parseTaskAttributes({
      due: "not-a-date",
    });

    expect(result.isErr()).toBe(true);
  });
});
