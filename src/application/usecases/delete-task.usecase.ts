import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import type { DeleteTaskInput } from "@application/dto/delete-task.input";
import type { DeleteTaskOutput } from "@application/dto/delete-task.output";
import type { PatchServiceError, PatchServicePort } from "@application/ports/patch-service";
import type { TaskIndexWriter } from "@domain/repositories/task-index-writer";
import type { TaskRepository } from "@domain/repositories/task-repository";

export type DeleteTaskError = PatchServiceError | { type: "TASK_NOT_FOUND"; taskId: string };

type DeleteTaskDependencies = {
  readonly patchService: PatchServicePort;
  readonly repository: TaskRepository;
  readonly indexWriter: TaskIndexWriter;
};

/**
 * タスクを削除するユースケース
 *
 * 1. リポジトリから既存タスクを取得（ファイルパス情報が必要）
 * 2. PatchServiceを使ってMarkdownファイルからタスク行を削除
 * 3. TaskIndexから削除
 */
export class DeleteTaskUseCase {
  constructor(private readonly dependencies: DeleteTaskDependencies) {}

  async execute(input: DeleteTaskInput): Promise<Result<DeleteTaskOutput, DeleteTaskError>> {
    // 既存タスクを取得（削除対象の確認とファイルパス取得のため）
    const existingTask = await this.dependencies.repository.findById(input.id);

    if (!existingTask) {
      return err({ type: "TASK_NOT_FOUND", taskId: input.id });
    }

    // Markdownファイルから削除
    const patchResult = await this.dependencies.patchService.applyPatch({
      type: "delete",
      taskId: input.id,
      filePath: existingTask.source.filePath,
    });

    if (patchResult.isErr()) {
      return err(patchResult.error);
    }

    // インデックスから削除
    await this.dependencies.indexWriter.remove(input.id);

    return ok({ success: true });
  }
}
