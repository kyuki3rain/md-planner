import { describe, expect, it } from "vitest";

import { TaskFactory } from "./task-factory";

describe("TaskFactory", () => {
  const factory = new TaskFactory();

  it("creates a task by merging defaults and inline attributes", () => {
    const result = factory.create({
      id: "t-abc12",
      title: "Implement indexer",
      status: "doing",
      attributes: {
        tags: ["backend"],
      },
      defaults: {
        assignee: "@me",
        due: "2025-10-12",
      },
      source: {
        filePath: "tasks/TODO.md",
        line: 12,
        column: 4,
      },
    });

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value.id).toBe("T-ABC12");
      expect(result.value.status).toBe("doing");
      expect(result.value.attributes.assignee).toBe("@me");
      expect(result.value.attributes.tags).toEqual(["backend"]);
      expect(result.value.attributes.due).toBe("2025-10-12");
      expect(result.value.source.filePath).toBe("tasks/TODO.md");
    }
  });

  it("fails when required fields are invalid", () => {
    const result = factory.create({
      id: "invalid id",
      title: "",
      status: "unknown",
      attributes: {},
      source: {
        filePath: "tasks/TODO.md",
        line: 0,
        column: 0,
      },
    });

    expect(result.isErr()).toBe(true);
    if (result.isErr()) {
      expect(result.error.reasons).toContain("TaskId");
    }
  });
});
