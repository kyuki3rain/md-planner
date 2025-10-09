import { describe, expect, it } from "vitest";

import type { Task } from "@domain/entities/task";
import { TaskFactory } from "@domain/services/task-factory";

import { MarkdownTaskParser } from "@infrastructure/parsers/markdown-task-parser";

import { InMemoryTaskIndex } from "./memory-task-index";

describe("InMemoryTaskIndex", () => {
  function parseTasks(markdown: string): readonly Task[] {
    const parser = new MarkdownTaskParser(new TaskFactory());
    const result = parser.parse({
      content: markdown,
      filePath: "tasks/Sprint.md",
    });
    return result.tasks;
  }

  it("stores tasks via replace and exposes repository queries", async () => {
    const markdown =
      "- [ ] First task {id: T-AAA11, status: todo}\n- [x] Second task {id: T-BBB22}";
    const tasks = parseTasks(markdown);

    const index = new InMemoryTaskIndex();

    await index.replace(tasks);

    const allTasks = await index.listAll();
    expect(allTasks).toHaveLength(2);

    const fileTasks = await index.listByFile("tasks/Sprint.md");
    expect(fileTasks.map((task) => task.id)).toEqual(tasks.map((task) => task.id));

    const found = await index.findById(tasks[1]?.id ?? "");
    expect(found?.title).toBe("Second task");
  });

  it("updates and removes tasks through index writer operations", async () => {
    const [initial] = parseTasks("- [ ] Initial {id: T-INIT1, status: todo}");
    const index = new InMemoryTaskIndex();

    await index.upsert(initial);

    const stored = await index.findById(initial.id);
    expect(stored?.title).toBe("Initial");

    const updated: Task = {
      ...initial,
      title: "Initial (updated)",
    };

    await index.upsert(updated);

    const afterUpdate = await index.findById(initial.id);
    expect(afterUpdate?.title).toBe("Initial (updated)");

    await index.remove(initial.id);

    const afterRemove = await index.findById(initial.id);
    expect(afterRemove).toBeNull();
    const all = await index.listAll();
    expect(all).toHaveLength(0);
  });
});
