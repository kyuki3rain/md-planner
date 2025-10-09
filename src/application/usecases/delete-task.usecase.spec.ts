import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DeleteTaskInput } from "@application/dto/delete-task.input";
import type { PatchServicePort } from "@application/ports/patch-service";
import type { Task } from "@domain/entities/task";
import type { TaskIndexWriter } from "@domain/repositories/task-index-writer";
import type { TaskRepository } from "@domain/repositories/task-repository";
import type { TaskId } from "@domain/value-objects/task-id";
import { DeleteTaskUseCase } from "./delete-task.usecase";

describe("DeleteTaskUseCase", () => {
  let useCase: DeleteTaskUseCase;
  let mockPatchService: PatchServicePort;
  let mockRepository: TaskRepository;
  let mockIndexWriter: TaskIndexWriter;

  const existingTask: Task = {
    id: "T-ABC123" as TaskId,
    title: "Task to delete",
    status: "todo",
    attributes: {
      tags: undefined,
      depends: undefined,
    },
    source: {
      filePath: "/path/to/file.md",
      line: 10,
      column: 0,
    },
  };

  beforeEach(() => {
    mockPatchService = {
      applyPatch: vi.fn(),
    };
    mockRepository = {
      findById: vi.fn(),
      listAll: vi.fn(),
      listByFile: vi.fn(),
    };
    mockIndexWriter = {
      upsert: vi.fn(),
      remove: vi.fn(),
      replace: vi.fn(),
    };
    useCase = new DeleteTaskUseCase({
      patchService: mockPatchService,
      repository: mockRepository,
      indexWriter: mockIndexWriter,
    });
  });

  describe("execute", () => {
    it("should delete task successfully", async () => {
      const input: DeleteTaskInput = {
        id: "T-ABC123" as TaskId,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingTask);
      vi.mocked(mockPatchService.applyPatch).mockResolvedValue(ok(undefined));
      vi.mocked(mockIndexWriter.remove).mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.success).toBe(true);
      }

      expect(mockPatchService.applyPatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "delete",
          taskId: "T-ABC123",
          filePath: "/path/to/file.md",
        }),
      );
      expect(mockIndexWriter.remove).toHaveBeenCalledWith("T-ABC123");
    });

    it("should return error when task not found", async () => {
      const input: DeleteTaskInput = {
        id: "T-NOTFOUND" as TaskId,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const result = await useCase.execute(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("TASK_NOT_FOUND");
      }
      expect(mockPatchService.applyPatch).not.toHaveBeenCalled();
      expect(mockIndexWriter.remove).not.toHaveBeenCalled();
    });

    it("should return error when patch fails", async () => {
      const input: DeleteTaskInput = {
        id: "T-ABC123" as TaskId,
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(existingTask);
      vi.mocked(mockPatchService.applyPatch).mockResolvedValue(
        err({ type: "WRITE_ERROR", message: "Failed to write" }),
      );

      const result = await useCase.execute(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("WRITE_ERROR");
      }
      expect(mockIndexWriter.remove).not.toHaveBeenCalled();
    });
  });
});
