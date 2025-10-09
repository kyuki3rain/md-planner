import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import { ulid } from "ulid";

import type { CreateTaskInput } from "@application/dto/create-task.input";
import type { CreateTaskOutput } from "@application/dto/create-task.output";
import type { PatchServiceError, PatchServicePort } from "@application/ports/patch-service";
import type { Task } from "@domain/entities/task";
import type { TaskIndexWriter } from "@domain/repositories/task-index-writer";
import type { TaskId } from "@domain/value-objects/task-id";

export type CreateTaskError = PatchServiceError | { type: "VALIDATION_ERROR"; message: string };

type CreateTaskDependencies = {
  readonly patchService: PatchServicePort;
  readonly indexWriter: TaskIndexWriter;
};

/**
 * タスクを新規作成するユースケース
 *
 * 1. 新しいタスクIDを生成
 * 2. タスクエンティティを構築
 * 3. PatchServiceを使ってMarkdownファイルに挿入
 * 4. TaskIndexに登録
 */
export class CreateTaskUseCase {
  constructor(private readonly dependencies: CreateTaskDependencies) {}

  async execute(input: CreateTaskInput): Promise<Result<CreateTaskOutput, CreateTaskError>> {
    // 新しいタスクIDを生成
    const taskId = this.generateTaskId();

    // タスクエンティティを構築
    const task: Task = {
      id: taskId,
      title: input.title,
      status: "todo",
      attributes: input.attributes ?? {
        tags: undefined,
        depends: undefined,
      },
      source: {
        filePath: input.filePath,
        line: input.insertLine ?? -1, // -1は末尾を意味する（実際の行番号はパッチ適用時に確定）
        column: 0,
      },
    };

    // Markdownファイルへの挿入
    const patchResult = await this.dependencies.patchService.applyPatch({
      type: "insert",
      filePath: input.filePath,
      task,
      insertLine: input.insertLine,
    });

    if (patchResult.isErr()) {
      return err(patchResult.error);
    }

    // インデックスに登録
    await this.dependencies.indexWriter.upsert(task);

    return ok({ task });
  }

  private generateTaskId(): TaskId {
    // ULIDを生成してタスクIDとして使用（先頭にT-プレフィックス）
    const id = ulid();
    // 短縮版: 最初の10文字を使用
    return `T-${id.substring(0, 6)}` as TaskId;
  }
}
