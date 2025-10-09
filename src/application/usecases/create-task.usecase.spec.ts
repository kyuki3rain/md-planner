import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CreateTaskInput } from "@application/dto/create-task.input";
import type { PatchServicePort } from "@application/ports/patch-service";
import type { TaskIndexWriter } from "@domain/repositories/task-index-writer";
import { TaskFactory } from "@domain/services/task-factory";
import { CreateTaskUseCase } from "./create-task.usecase";

describe("CreateTaskUseCase", () => {
  let useCase: CreateTaskUseCase;
  let mockPatchService: PatchServicePort;
  let mockIndexWriter: TaskIndexWriter;

  beforeEach(() => {
    mockPatchService = {
      applyPatch: vi.fn(),
    };
    mockIndexWriter = {
      upsert: vi.fn(),
      remove: vi.fn(),
      replace: vi.fn(),
    };
    useCase = new CreateTaskUseCase({
      patchService: mockPatchService,
      indexWriter: mockIndexWriter,
      taskFactory: new TaskFactory(),
    });
  });

  describe("execute", () => {
    it("should create a new task successfully", async () => {
      const input: CreateTaskInput = {
        title: "New task",
        filePath: "/path/to/file.md",
      };

      vi.mocked(mockPatchService.applyPatch).mockResolvedValue(ok(undefined));
      vi.mocked(mockIndexWriter.upsert).mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.task.title).toBe("New task");
        expect(result.value.task.status).toBe("todo");
      }

      expect(mockPatchService.applyPatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "insert",
          filePath: "/path/to/file.md",
        }),
      );
      expect(mockIndexWriter.upsert).toHaveBeenCalled();
    });

    it("should create a task with attributes", async () => {
      const input: CreateTaskInput = {
        title: "Task with attributes",
        filePath: "/path/to/file.md",
        attributes: {
          project: "test-project",
          tags: ["backend"],
          depends: undefined,
        },
      };

      vi.mocked(mockPatchService.applyPatch).mockResolvedValue(ok(undefined));
      vi.mocked(mockIndexWriter.upsert).mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.task.attributes.project).toBe("test-project");
        expect(result.value.task.attributes.tags).toContain("backend");
      }
    });

    it("should return error when patch fails", async () => {
      const input: CreateTaskInput = {
        title: "New task",
        filePath: "/path/to/file.md",
      };

      vi.mocked(mockPatchService.applyPatch).mockResolvedValue(
        err({ type: "FILE_NOT_FOUND", filePath: "/path/to/file.md" }),
      );

      const result = await useCase.execute(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("FILE_NOT_FOUND");
      }
      expect(mockIndexWriter.upsert).not.toHaveBeenCalled();
    });

    it("should insert at specified line number", async () => {
      const input: CreateTaskInput = {
        title: "New task",
        filePath: "/path/to/file.md",
        insertLine: 5,
      };

      vi.mocked(mockPatchService.applyPatch).mockResolvedValue(ok(undefined));
      vi.mocked(mockIndexWriter.upsert).mockResolvedValue(undefined);

      await useCase.execute(input);

      expect(mockPatchService.applyPatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "insert",
          insertLine: 5,
        }),
      );
    });
  });
});
