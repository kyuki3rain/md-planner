import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import { ulid } from "ulid";

import { CreateTaskInputSchema } from "@application/dto/create-task.input";
import type { CreateTaskInput } from "@application/dto/create-task.input";
import type { CreateTaskOutput } from "@application/dto/create-task.output";
import type { PatchServiceError, PatchServicePort } from "@application/ports/patch-service";
import type { TaskAttributesInput } from "@domain/entities/task-attributes";
import type { TaskIndexWriter } from "@domain/repositories/task-index-writer";
import type { TaskId } from "@domain/value-objects/task-id";
import type { TaskFactory } from "@domain/services/task-factory";

export type CreateTaskError = PatchServiceError | { type: "VALIDATION_ERROR"; message: string };

type CreateTaskDependencies = {
  readonly patchService: PatchServicePort;
  readonly indexWriter: TaskIndexWriter;
  readonly taskFactory: TaskFactory;
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
    const parsed = CreateTaskInputSchema.safeParse(input);
    if (!parsed.success) {
      return err({ type: "VALIDATION_ERROR", message: parsed.error.message });
    }

    const validated = parsed.data;

    // 新しいタスクIDを生成
    const taskId = this.generateTaskId();

    const taskResult = this.dependencies.taskFactory.create({
      id: taskId,
      title: validated.title,
      status: "todo",
      attributes: toTaskAttributesInput(validated.attributes),
      source: {
        filePath: validated.filePath,
        line: validated.insertLine ?? 0,
        column: 0,
      },
    });

    if (taskResult.isErr()) {
      return err({ type: "VALIDATION_ERROR", message: taskResult.error.message });
    }

    const task = taskResult.value;

    // Markdownファイルへの挿入
    const patchResult = await this.dependencies.patchService.applyPatch({
      type: "insert",
      filePath: validated.filePath,
      task,
      insertLine: validated.insertLine,
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

function toTaskAttributesInput(
  attributes: CreateTaskInput["attributes"],
): TaskAttributesInput | undefined {
  if (!attributes) {
    return undefined;
  }

  const normalized: TaskAttributesInput = {
    ...(typeof attributes.project === "string" ? { project: attributes.project } : {}),
    ...(typeof attributes.assignee === "string" ? { assignee: attributes.assignee } : {}),
    ...(typeof attributes.due === "string" ? { due: attributes.due } : {}),
    ...(Array.isArray(attributes.tags) ? { tags: [...attributes.tags] } : {}),
    ...(Array.isArray(attributes.depends) ? { depends: [...attributes.depends] } : {}),
  };

  return Object.keys(normalized).length > 0 ? normalized : {};
}
