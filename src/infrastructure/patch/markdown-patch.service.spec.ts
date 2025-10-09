import { err, ok } from "neverthrow";
import { type Mock, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  FileReaderPort,
  FileSystemError,
  FileWriterPort,
} from "@application/ports/file-system";
import type { Task } from "@domain/entities/task";
import type { TaskId } from "@domain/value-objects/task-id";
import type { Result } from "neverthrow";
import { MarkdownPatchService } from "./markdown-patch.service";

describe("MarkdownPatchService", () => {
  let service: MarkdownPatchService;
  let mockFileReader: {
    readFile: Mock<[string], Promise<Result<string, FileSystemError>>>;
  };
  let mockFileWriter: {
    writeFile: Mock<[string, string], Promise<Result<void, FileSystemError>>>;
  };

  const sampleTask: Task = {
    id: "T-ABC123" as TaskId,
    title: "Sample task",
    status: "todo",
    attributes: {
      tags: ["backend"],
      depends: undefined,
      project: "test-project",
    },
    source: {
      filePath: "/path/to/file.md",
      line: 5,
      column: 0,
    },
  };

  beforeEach(() => {
    mockFileReader = {
      readFile: vi.fn(),
    };
    mockFileWriter = {
      writeFile: vi.fn(),
    };
    service = new MarkdownPatchService(
      mockFileReader as unknown as FileReaderPort,
      mockFileWriter as unknown as FileWriterPort,
    );
  });

  describe("insert operation", () => {
    it("should insert task at the end of file", async () => {
      const existingContent = "# TODO\n\n- [ ] Existing task {id: T-AAA111}\n";
      mockFileReader.readFile.mockResolvedValue(ok(existingContent));
      mockFileWriter.writeFile.mockResolvedValue(ok(undefined));

      const result = await service.applyPatch({
        type: "insert",
        filePath: "/path/to/file.md",
        task: sampleTask,
      });

      expect(result.isOk()).toBe(true);
      expect(mockFileWriter.writeFile).toHaveBeenCalledWith(
        "/path/to/file.md",
        expect.stringContaining("Sample task"),
      );
      expect(mockFileWriter.writeFile).toHaveBeenCalledWith(
        "/path/to/file.md",
        expect.stringContaining("T-ABC123"),
      );
    });

    it("should insert task at specified line", async () => {
      const existingContent = "# TODO\n\n- [ ] First task\n- [ ] Second task\n";
      mockFileReader.readFile.mockResolvedValue(ok(existingContent));
      mockFileWriter.writeFile.mockResolvedValue(ok(undefined));

      const result = await service.applyPatch({
        type: "insert",
        filePath: "/path/to/file.md",
        task: sampleTask,
        insertLine: 2,
      });

      expect(result.isOk()).toBe(true);
      const writtenContent = mockFileWriter.writeFile.mock.calls[0]?.[1] as string;
      const lines = writtenContent.split("\n");
      expect(lines[2]).toContain("Sample task");
    });

    it("should return error when file not found", async () => {
      mockFileReader.readFile.mockResolvedValue(
        err({ type: "FILE_NOT_FOUND" as const, filePath: "/path/to/file.md" }),
      );

      const result = await service.applyPatch({
        type: "insert",
        filePath: "/path/to/file.md",
        task: sampleTask,
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("FILE_NOT_FOUND");
      }
    });
  });

  describe("update operation", () => {
    it("should update task attributes in place", async () => {
      const existingContent =
        "# TODO\n\n- [ ] Sample task {id: T-ABC123, status: todo, project: old-project}\n";
      mockFileReader.readFile.mockResolvedValue(ok(existingContent));
      mockFileWriter.writeFile.mockResolvedValue(ok(undefined));

      const updatedTask: Task = {
        ...sampleTask,
        status: "doing",
        attributes: {
          ...sampleTask.attributes,
          project: "new-project",
        },
      };

      const result = await service.applyPatch({
        type: "update",
        task: updatedTask,
      });

      expect(result.isOk()).toBe(true);
      const writtenContent = mockFileWriter.writeFile.mock.calls[0]?.[1] as string;
      expect(writtenContent).toContain("status: doing");
      expect(writtenContent).toContain("new-project");
    });

    it("should return error when task not found in file", async () => {
      const existingContent = "# TODO\n\n- [ ] Different task {id: T-DDD111}\n";
      mockFileReader.readFile.mockResolvedValue(ok(existingContent));

      const result = await service.applyPatch({
        type: "update",
        task: sampleTask,
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("TASK_NOT_FOUND");
      }
    });
  });

  describe("delete operation", () => {
    it("should delete task line from file", async () => {
      const existingContent =
        "# TODO\n\n- [ ] First task {id: T-AAA111}\n- [ ] Sample task {id: T-ABC123}\n- [ ] Third task {id: T-CCC333}\n";
      mockFileReader.readFile.mockResolvedValue(ok(existingContent));
      mockFileWriter.writeFile.mockResolvedValue(ok(undefined));

      const result = await service.applyPatch({
        type: "delete",
        taskId: "T-ABC123",
        filePath: "/path/to/file.md",
      });

      expect(result.isOk()).toBe(true);
      const writtenContent = mockFileWriter.writeFile.mock.calls[0]?.[1] as string;
      expect(writtenContent).not.toContain("T-ABC123");
      expect(writtenContent).toContain("T-AAA111");
      expect(writtenContent).toContain("T-CCC333");
    });

    it("should return error when task not found", async () => {
      const existingContent = "# TODO\n\n- [ ] Different task {id: T-DDD111}\n";
      mockFileReader.readFile.mockResolvedValue(ok(existingContent));

      const result = await service.applyPatch({
        type: "delete",
        taskId: "T-ABC123",
        filePath: "/path/to/file.md",
      });

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("TASK_NOT_FOUND");
      }
    });
  });

  describe("formatting preservation", () => {
    it("should preserve original indentation and spacing", async () => {
      const existingContent = "  - [ ] Indented task {id: T-ABC123, status: todo}\n";
      mockFileReader.readFile.mockResolvedValue(ok(existingContent));
      mockFileWriter.writeFile.mockResolvedValue(ok(undefined));

      const updatedTask: Task = {
        ...sampleTask,
        status: "doing",
      };

      const result = await service.applyPatch({
        type: "update",
        task: updatedTask,
      });

      expect(result.isOk()).toBe(true);
      const writtenContent = mockFileWriter.writeFile.mock.calls[0]?.[1] as string;
      expect(writtenContent).toMatch(/^\s{2}-/); // 2スペースのインデント保持
    });
  });
});
