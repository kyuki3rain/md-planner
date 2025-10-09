import { z } from "zod";

import type { NeverthrowResult } from "@shared/result";
import { type ZodValidationError, parseWithSchema } from "@shared/validation";

const TASK_STATUS_VALUES = ["todo", "doing", "blocked", "done", "archived"] as const;

export const TaskStatusSchema = z.enum(TASK_STATUS_VALUES);

export type TaskStatus = z.infer<typeof TaskStatusSchema>;
export type TaskStatusError = ZodValidationError;

export function parseTaskStatus(value: unknown): NeverthrowResult<TaskStatus, TaskStatusError> {
  const normalized = typeof value === "string" ? value.trim().toLowerCase() : value;
  return parseWithSchema(TaskStatusSchema, normalized as z.input<typeof TaskStatusSchema>, {
    subject: "TaskStatus",
  });
}

export function isTaskStatus(value: unknown): value is TaskStatus {
  return TaskStatusSchema.safeParse(value).success;
}

export const DEFAULT_STATUS_ORDER: readonly TaskStatus[] = [
  "todo",
  "doing",
  "blocked",
  "done",
  "archived",
];
