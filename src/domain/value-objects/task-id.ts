import { z } from "zod";

import type { NeverthrowResult } from "@shared/result";
import type { Brand } from "@shared/types";
import { type ZodValidationError, parseWithSchema } from "@shared/validation";

export type TaskId = Brand<string, "TaskId">;

// 従来の形式: A-XXXXX (例: T-ABC123)
const LEGACY_TASK_ID_PATTERN = /^[A-Z]-[A-Z0-9]{4,30}$/;
// ULID形式: 26文字の英数字 (例: 01ARZ3NDEKTSV4RRFFQ69G5FAV)
const ULID_PATTERN = /^[0-9A-Z]{26}$/;

export function sanitizeTaskId(value: string): string {
  return value.trim().toUpperCase();
}

const taskIdSchema = z
  .string()
  .min(6, { message: "ID must be at least 6 characters" })
  .max(32, { message: "ID must be 32 characters or fewer" })
  .refine(
    (value) => {
      const sanitized = value.toUpperCase();
      return LEGACY_TASK_ID_PATTERN.test(sanitized) || ULID_PATTERN.test(sanitized);
    },
    {
      message: "ID must follow the pattern <LETTER>-<ALPHANUMERIC> (e.g., T-ABC123) or be a valid ULID",
    },
  )
  .transform((value) => value.toUpperCase() as TaskId);

export type TaskIdError = ZodValidationError;

export function parseTaskId(value: string): NeverthrowResult<TaskId, TaskIdError> {
  const sanitized = sanitizeTaskId(value);
  return parseWithSchema(taskIdSchema, sanitized, { subject: "TaskId" });
}

export function isTaskId(value: unknown): value is TaskId {
  if (typeof value !== "string") {
    return false;
  }
  const sanitized = sanitizeTaskId(value);
  return LEGACY_TASK_ID_PATTERN.test(sanitized) || ULID_PATTERN.test(sanitized);
}

export const TaskIdSchema = taskIdSchema;
