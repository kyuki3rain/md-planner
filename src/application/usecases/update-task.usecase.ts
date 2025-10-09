import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import type { UpdateTaskInput } from "@application/dto/update-task.input";
import type { UpdateTaskOutput } from "@application/dto/update-task.output";
import type { PatchServiceError, PatchServicePort } from "@application/ports/patch-service";
import type { Task } from "@domain/entities/task";
import type { TaskIndexWriter } from "@domain/repositories/task-index-writer";
import type { TaskRepository } from "@domain/repositories/task-repository";

export type UpdateTaskError = PatchServiceError | { type: "TASK_NOT_FOUND"; taskId: string };

type UpdateTaskDependencies = {
  readonly patchService: PatchServicePort;
  readonly repository: TaskRepository;
  readonly indexWriter: TaskIndexWriter;
};

/**
 * 既存タスクを更新するユースケース
 *
 * 1. リポジトリから既存タスクを取得
 * 2. 指定されたフィールドをマージして新しいタスクを構築
 * 3. PatchServiceを使ってMarkdownファイルを更新
 * 4. TaskIndexを更新
 */
export class UpdateTaskUseCase {
  constructor(private readonly dependencies: UpdateTaskDependencies) {}

  async execute(input: UpdateTaskInput): Promise<Result<UpdateTaskOutput, UpdateTaskError>> {
    // 既存タスクを取得
    const existingTask = await this.dependencies.repository.findById(input.id);

    if (!existingTask) {
      return err({ type: "TASK_NOT_FOUND", taskId: input.id });
    }

    // 更新されたタスクを構築（指定されたフィールドのみ上書き）
    const updatedTask: Task = {
      ...existingTask,
      title: input.title ?? existingTask.title,
      status: input.status ?? existingTask.status,
      attributes:
        input.attributes !== undefined
          ? (input.attributes ?? { tags: undefined, depends: undefined })
          : existingTask.attributes,
    };

    // Markdownファイルを更新
    const patchResult = await this.dependencies.patchService.applyPatch({
      type: "update",
      task: updatedTask,
    });

    if (patchResult.isErr()) {
      return err(patchResult.error);
    }

    // インデックスを更新
    await this.dependencies.indexWriter.upsert(updatedTask);

    return ok({ task: updatedTask });
  }
}
