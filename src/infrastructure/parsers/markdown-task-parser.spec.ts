import { describe, expect, it } from "vitest";

import type { Task } from "@domain/entities/task";
import { TaskFactory } from "@domain/services/task-factory";

import { MarkdownTaskParser } from "./markdown-task-parser";

describe("MarkdownTaskParser", () => {
  const factory = new TaskFactory();

  function parse(content: string) {
    const parser = new MarkdownTaskParser(factory);
    return parser.parse({
      content,
      filePath: "tasks/Sprint.md",
    });
  }

  it("parses markdown checkboxes with inline attributes into Task entities", () => {
    const markdown = `---
defaults:
  assignee: "@me"
---

- [ ] Implement indexer {id: T-ABC12, status: doing, tags: [backend, parsing], due: 2025-10-12}
- [x] Ship release {id: T-ZYX98, tags: [release]}
`;

    const result = parse(markdown);

    expect(result.tasks).toHaveLength(2);

    const [first, second] = result.tasks as [Task, Task];

    expect(first.id).toBe("T-ABC12");
    expect(first.status).toBe("doing");
    expect(first.attributes.assignee).toBe("@me");
    expect(first.attributes.tags).toEqual(["backend", "parsing"]);
    expect(first.attributes.due).toBe("2025-10-12");
    expect(first.title).toBe("Implement indexer");
    expect(first.source.filePath).toBe("tasks/Sprint.md");
    expect(first.source.line).toBe(5);
    expect(first.source.column).toBe(2);

    expect(second.id).toBe("T-ZYX98");
    expect(second.status).toBe("done");
    expect(second.title).toBe("Ship release");
    expect(second.attributes.assignee).toBe("@me");
    expect(second.source.line).toBe(6);
  });

  it("auto-assigns an id when the attribute is missing", () => {
    const markdown = "- [ ] Missing id {status: todo}";

    const result = parse(markdown);

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]?.id).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/);
    expect(result.issues).toHaveLength(0);
  });

  it("falls back to checkbox status when inline status is absent", () => {
    const markdown = "- [x] Done task {id: T-OK123}";

    const result = parse(markdown);

    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]?.status).toBe("done");
  });
});
