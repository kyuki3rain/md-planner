import { type NeverthrowResult, err, ok } from "@shared/result";

import { type Task, TaskSchema, TaskSourceSchema, TaskTitleSchema } from "@domain/entities/task";
import { type TaskAttributesInput, parseTaskAttributes } from "@domain/entities/task-attributes";
import { type TaskId, parseTaskId } from "@domain/value-objects/task-id";
import { type TaskStatus, parseTaskStatus } from "@domain/value-objects/task-status";

export type TaskFactoryInput = {
  readonly id: string;
  readonly title: string;
  readonly status: string;
  readonly attributes?: TaskAttributesInput;
  readonly defaults?: TaskAttributesInput;
  readonly source: Task["source"];
};

export type TaskFactoryIssue = {
  readonly reason: "TaskId" | "TaskStatus" | "TaskTitle" | "TaskAttributes" | "TaskSource";
  readonly message: string;
  readonly detail?: unknown;
};

export type TaskFactoryError = {
  readonly message: string;
  readonly reasons: readonly TaskFactoryIssue["reason"][];
  readonly issues: readonly TaskFactoryIssue[];
};

const TASK_CREATION_ERROR = "Failed to create Task";

export class TaskFactory {
  create(input: TaskFactoryInput): NeverthrowResult<Task, TaskFactoryError> {
    const issues: TaskFactoryIssue[] = [];

    const id = this.parseId(input.id, issues);
    const status = this.parseStatus(input.status, issues);
    const title = this.parseTitle(input.title, issues);
    const source = this.parseSource(input.source, issues);
    const attributes = this.parseAttributes(input.defaults, input.attributes, issues);

    if (issues.length > 0 || !id || !status || !title || !source || !attributes) {
      return err({
        message: TASK_CREATION_ERROR,
        reasons: issues.map((issue) => issue.reason),
        issues,
      });
    }

    const task: Task = {
      id,
      title,
      status,
      attributes,
      source,
    };

    const taskValidation = TaskSchema.safeParse(task);
    if (!taskValidation.success) {
      return err({
        message: TASK_CREATION_ERROR,
        reasons: ["TaskAttributes"],
        issues: [
          {
            reason: "TaskAttributes",
            message: "Task schema validation failed",
            detail: taskValidation.error.format(),
          },
        ],
      });
    }

    return ok(taskValidation.data);
  }

  private parseId(value: string, issues: TaskFactoryIssue[]): TaskId | undefined {
    const result = parseTaskId(value);
    if (result.isErr()) {
      issues.push({
        reason: "TaskId",
        message: result.error.message,
        detail: result.error,
      });
      return undefined;
    }
    return result.value;
  }

  private parseStatus(value: string, issues: TaskFactoryIssue[]): TaskStatus | undefined {
    const result = parseTaskStatus(value);
    if (result.isErr()) {
      issues.push({
        reason: "TaskStatus",
        message: result.error.message,
        detail: result.error,
      });
      return undefined;
    }
    return result.value;
  }

  private parseTitle(value: string, issues: TaskFactoryIssue[]): string | undefined {
    const trimmed = value.trim();
    const validation = TaskTitleSchema.safeParse(trimmed);
    if (!validation.success) {
      issues.push({
        reason: "TaskTitle",
        message: validation.error.message,
        detail: validation.error.format(),
      });
      return undefined;
    }
    return trimmed;
  }

  private parseSource(
    value: TaskFactoryInput["source"],
    issues: TaskFactoryIssue[],
  ): TaskFactoryInput["source"] | undefined {
    const validation = TaskSourceSchema.safeParse(value);
    if (!validation.success) {
      issues.push({
        reason: "TaskSource",
        message: validation.error.message,
        detail: validation.error.format(),
      });
      return undefined;
    }
    return validation.data;
  }

  private parseAttributes(
    defaults: TaskAttributesInput | undefined,
    attributes: TaskAttributesInput | undefined,
    issues: TaskFactoryIssue[],
  ) {
    const merged = {
      ...(defaults ?? {}),
      ...(attributes ?? {}),
    } satisfies TaskAttributesInput;

    const result = parseTaskAttributes(merged);
    if (result.isErr()) {
      issues.push({
        reason: "TaskAttributes",
        message: result.error.message,
        detail: result.error.issues,
      });
      return undefined;
    }
    return result.value;
  }
}
