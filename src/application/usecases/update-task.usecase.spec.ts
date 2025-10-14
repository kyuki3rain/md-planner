import { err, ok } from "neverthrow";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { UpdateTaskInput } from "@application/dto/update-task.input";
import type { PatchServicePort } from "@application/ports/patch-service";
import type { Task } from "@domain/entities/task";
import type { TaskIndexWriter } from "@domain/repositories/task-index-writer";
import type { TaskRepository } from "@domain/repositories/task-repository";
import type { TaskId } from "@domain/value-objects/task-id";
import { TaskFactory } from "@domain/services/task-factory";
import { UpdateTaskUseCase } from "./update-task.usecase";

describe("UpdateTaskUseCase", () => {
  let useCase: UpdateTaskUseCase;
  let mockPatchService: PatchServicePort;
  let mockRepository: TaskRepository;
  let mockIndexWriter: TaskIndexWriter;

  function makeExistingTask(): Task {
    return {
      id: "T-ABC123" as TaskId,
      title: "Existing task",
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
  }

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
    useCase = new UpdateTaskUseCase({
      patchService: mockPatchService,
      repository: mockRepository,
      indexWriter: mockIndexWriter,
      taskFactory: new TaskFactory(),
    });
  });

  describe("execute", () => {
    it("should update task title successfully", async () => {
      const input: UpdateTaskInput = {
        id: "T-ABC123" as TaskId,
        title: "Updated title",
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(makeExistingTask());
      vi.mocked(mockPatchService.applyPatch).mockResolvedValue(ok(undefined));
      vi.mocked(mockIndexWriter.upsert).mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.task.title).toBe("Updated title");
        expect(result.value.task.status).toBe("todo");
      }

      expect(mockPatchService.applyPatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "update",
        }),
      );
      expect(mockIndexWriter.upsert).toHaveBeenCalled();
    });

    it("should update task status", async () => {
      const input: UpdateTaskInput = {
        id: "T-ABC123" as TaskId,
        status: "doing",
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(makeExistingTask());
      vi.mocked(mockPatchService.applyPatch).mockResolvedValue(ok(undefined));
      vi.mocked(mockIndexWriter.upsert).mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.task.status).toBe("doing");
      }
    });

    it("should return error when task not found", async () => {
      const input: UpdateTaskInput = {
        id: "T-NOTFOUND" as TaskId,
        title: "New title",
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(null);

      const result = await useCase.execute(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("TASK_NOT_FOUND");
      }
      expect(mockPatchService.applyPatch).not.toHaveBeenCalled();
    });

    it("should return error when patch fails", async () => {
      const input: UpdateTaskInput = {
        id: "T-ABC123" as TaskId,
        title: "New title",
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(makeExistingTask());
      vi.mocked(mockPatchService.applyPatch).mockResolvedValue(
        err({ type: "WRITE_ERROR", message: "Failed to write" }),
      );

      const result = await useCase.execute(input);

      expect(result.isErr()).toBe(true);
      if (result.isErr()) {
        expect(result.error.type).toBe("WRITE_ERROR");
      }
      expect(mockIndexWriter.upsert).not.toHaveBeenCalled();
    });

    it("should update multiple fields at once", async () => {
      const input: UpdateTaskInput = {
        id: "T-ABC123" as TaskId,
        title: "New title",
        status: "done",
        attributes: {
          project: "new-project",
          tags: ["updated"],
          depends: undefined,
        },
      };

      vi.mocked(mockRepository.findById).mockResolvedValue(makeExistingTask());
      vi.mocked(mockPatchService.applyPatch).mockResolvedValue(ok(undefined));
      vi.mocked(mockIndexWriter.upsert).mockResolvedValue(undefined);

      const result = await useCase.execute(input);

      expect(result.isOk()).toBe(true);
      if (result.isOk()) {
        expect(result.value.task.title).toBe("New title");
        expect(result.value.task.status).toBe("done");
        expect(result.value.task.attributes.project).toBe("new-project");
      }
    });
  });
});
