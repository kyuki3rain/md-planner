import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import { UpdateTaskInputSchema } from "@application/dto/update-task.input";
import type { UpdateTaskInput } from "@application/dto/update-task.input";
import type { UpdateTaskOutput } from "@application/dto/update-task.output";
import type { PatchServiceError, PatchServicePort } from "@application/ports/patch-service";
import type { Task } from "@domain/entities/task";
import type { TaskAttributesInput } from "@domain/entities/task-attributes";
import { TaskFactory } from "@domain/services/task-factory";
import type { TaskIndexWriter } from "@domain/repositories/task-index-writer";
import type { TaskRepository } from "@domain/repositories/task-repository";

export type UpdateTaskError =
  | PatchServiceError
  | { type: "TASK_NOT_FOUND"; taskId: string }
  | { type: "VALIDATION_ERROR"; message: string };

type UpdateTaskDependencies = {
  readonly patchService: PatchServicePort;
  readonly repository: TaskRepository;
  readonly indexWriter: TaskIndexWriter;
  readonly taskFactory: TaskFactory;
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
    const parsed = UpdateTaskInputSchema.safeParse(input);
    if (!parsed.success) {
      return err({ type: "VALIDATION_ERROR", message: parsed.error.message });
    }

    const validated = parsed.data;

    // 既存タスクを取得
    const existingTask = await this.dependencies.repository.findById(validated.id);

    if (!existingTask) {
      return err({ type: "TASK_NOT_FOUND", taskId: validated.id });
    }

    const attributesInput = resolveAttributes(existingTask, validated.attributes);

    const taskResult = this.dependencies.taskFactory.create({
      id: existingTask.id,
      title: validated.title ?? existingTask.title,
      status: validated.status ?? existingTask.status,
      attributes: attributesInput,
      source: existingTask.source,
    });

    if (taskResult.isErr()) {
      return err({ type: "VALIDATION_ERROR", message: taskResult.error.message });
    }

    const updatedTask = taskResult.value;

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

function resolveAttributes(
  existingTask: Task,
  updates: UpdateTaskInput["attributes"],
): TaskAttributesInput | undefined {
  const current: TaskAttributesInput = {
    ...(existingTask.attributes.project ? { project: existingTask.attributes.project } : {}),
    ...(existingTask.attributes.assignee ? { assignee: existingTask.attributes.assignee } : {}),
    ...(existingTask.attributes.due ? { due: existingTask.attributes.due } : {}),
    ...(existingTask.attributes.tags ? { tags: existingTask.attributes.tags } : {}),
    ...(existingTask.attributes.depends ? { depends: existingTask.attributes.depends } : {}),
  };

  if (updates === undefined) {
    return Object.keys(current).length > 0 ? current : {};
  }

  if (updates === null) {
    return {};
  }

  const incoming: TaskAttributesInput = {};

  if (typeof updates.project === "string") {
    incoming.project = updates.project;
  }
  if (typeof updates.assignee === "string") {
    incoming.assignee = updates.assignee;
  }
  if (typeof updates.due === "string") {
    incoming.due = updates.due;
  }
  if (Array.isArray(updates.tags)) {
    incoming.tags = updates.tags;
  }
  if (Array.isArray(updates.depends)) {
    incoming.depends = updates.depends;
  }

  return {
    ...current,
    ...incoming,
  } satisfies TaskAttributesInput;
}
