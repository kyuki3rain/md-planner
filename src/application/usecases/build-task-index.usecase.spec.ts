import { describe, expect, it } from "vitest";

import { TaskFactory } from "@domain/services/task-factory";

import { InMemoryTaskIndex } from "@infrastructure/index/memory-task-index";
import { MarkdownTaskParser } from "@infrastructure/parsers/markdown-task-parser";

import { BuildTaskIndexUseCase } from "./build-task-index.usecase";

describe("BuildTaskIndexUseCase", () => {
  it("parses files and replaces the task index", async () => {
    const parser = new MarkdownTaskParser(new TaskFactory());
    const index = new InMemoryTaskIndex();
    const useCase = new BuildTaskIndexUseCase({ parser, writer: index });

    const output = await useCase.execute({
      files: [
        {
          filePath: "tasks/a.md",
          content: "- [ ] First {id: T-AAA11, status: todo}",
        },
        {
          filePath: "tasks/b.md",
          content: "- [x] Second {id: T-BBB22}",
        },
      ],
    });

    expect(output.tasks).toHaveLength(2);
    expect(output.issues).toHaveLength(0);

    const stored = await index.listAll();
    expect(stored.map((task) => task.id)).toEqual(["T-AAA11", "T-BBB22"]);
  });

  it("aggregates parser issues with file information without dropping tasks", async () => {
    const parser = new MarkdownTaskParser(new TaskFactory());
    const index = new InMemoryTaskIndex();
    const useCase = new BuildTaskIndexUseCase({ parser, writer: index });

    const output = await useCase.execute({
      files: [
        {
          filePath: "tasks/a.md",
          content: [
            "- [ ] Valid {id: T-AAA11, status: todo}",
            "- [ ] Invalid {id: T-INVALID, status: ???}",
          ].join("\n"),
        },
      ],
    });

    expect(output.tasks.map((task) => task.id)).toEqual(["T-AAA11"]);
    expect(output.issues).toHaveLength(1);
    expect(output.issues[0]?.filePath).toBe("tasks/a.md");
    expect(output.issues[0]?.message).toContain("Failed to create Task");

    const stored = await index.listAll();
    expect(stored.map((task) => task.id)).toEqual(["T-AAA11"]);
  });
});
