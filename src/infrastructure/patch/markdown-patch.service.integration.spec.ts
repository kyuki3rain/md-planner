import { ok } from "neverthrow";
import { beforeEach, describe, expect, it } from "vitest";

import type { Task } from "@domain/entities/task";
import type { TaskId } from "@domain/value-objects/task-id";
import { MarkdownPatchService } from "@infrastructure/patch/markdown-patch.service";
import { InMemoryFileSystem } from "./in-memory-file-system";

describe("MarkdownPatchService Integration", () => {
  let fileSystem: InMemoryFileSystem;
  let patchService: MarkdownPatchService;

  beforeEach(() => {
    fileSystem = new InMemoryFileSystem();
    patchService = new MarkdownPatchService(fileSystem, fileSystem);
  });

  const createTask = (
    id: string,
    title: string,
    status: "todo" | "doing" | "done" = "todo",
  ): Task => ({
    id: id as TaskId,
    title,
    status,
    attributes: {
      tags: undefined,
      depends: undefined,
    },
    source: {
      filePath: "/test.md",
      line: 0,
      column: 0,
    },
  });

  describe("full workflow", () => {
    it("should insert, update, and delete tasks", async () => {
      // 初期ファイル
      fileSystem.setFile("/test.md", "# TODO List\n\n");

      // タスクを挿入
      const task1 = createTask("T-001", "First task");
      const insertResult = await patchService.applyPatch({
        type: "insert",
        filePath: "/test.md",
        task: task1,
      });

      expect(insertResult.isOk()).toBe(true);

      let content = fileSystem.getFile("/test.md");
      expect(content).toContain("First task");
      expect(content).toContain("T-001");

      // 2つ目のタスクを挿入
      const task2 = createTask("T-002", "Second task");
      await patchService.applyPatch({
        type: "insert",
        filePath: "/test.md",
        task: task2,
      });

      content = fileSystem.getFile("/test.md");
      expect(content).toContain("Second task");

      // タスクを更新
      const updatedTask1: Task = {
        ...task1,
        status: "doing",
        attributes: {
          ...task1.attributes,
          project: "test-project",
        },
      };

      const updateResult = await patchService.applyPatch({
        type: "update",
        task: updatedTask1,
      });

      expect(updateResult.isOk()).toBe(true);
      content = fileSystem.getFile("/test.md");
      expect(content).toContain("status: doing");
      expect(content).toContain("test-project");

      // タスクを削除
      const deleteResult = await patchService.applyPatch({
        type: "delete",
        taskId: "T-001",
        filePath: "/test.md",
      });

      expect(deleteResult.isOk()).toBe(true);
      content = fileSystem.getFile("/test.md");
      expect(content).not.toContain("T-001");
      expect(content).toContain("T-002"); // 2つ目は残る
    });

    it("should preserve markdown structure", async () => {
      fileSystem.setFile(
        "/test.md",
        "# Project Tasks\n\n## Sprint 1\n\n- [ ] Existing task {id: T-000}\n\n## Sprint 2\n\n",
      );

      const task = createTask("T-NEW", "New task");
      await patchService.applyPatch({
        type: "insert",
        filePath: "/test.md",
        task,
        insertLine: 7, // Sprint 2のセクション内
      });

      const content = fileSystem.getFile("/test.md");
      const lines = content.split("\n");

      // 見出しが保持されているか確認
      expect(lines[0]).toBe("# Project Tasks");
      expect(lines[2]).toBe("## Sprint 1");
      expect(lines[6]).toBe("## Sprint 2");
      expect(lines[7]).toContain("New task");
    });
  });
});
