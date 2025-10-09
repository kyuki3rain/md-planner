import { z } from "zod";

import type { NeverthrowResult } from "@shared/result";
import { ok } from "@shared/result";
import { type ZodValidationError, parseWithSchema } from "@shared/validation";

import { DueDateSchema } from "@domain/value-objects/due-date";
import { TaskIdSchema, sanitizeTaskId } from "@domain/value-objects/task-id";

const nonEmptyStringSchema = z.string().min(1, { message: "Value must not be empty" });

const taskAttributesSchema = z
  .object({
    project: nonEmptyStringSchema.optional(),
    assignee: nonEmptyStringSchema.optional(),
    tags: z.array(nonEmptyStringSchema).optional(),
    due: DueDateSchema.optional(),
    depends: z.array(TaskIdSchema).optional(),
  })
  .transform((value) => ({
    ...value,
    tags: value.tags ? Array.from(new Set(value.tags)) : undefined,
    depends: value.depends ? Array.from(new Set(value.depends)) : undefined,
  }));

export type TaskAttributes = z.output<typeof taskAttributesSchema>;
export const TaskAttributesSchema = taskAttributesSchema;

export type TaskAttributesInput = {
  readonly project?: string | null;
  readonly assignee?: string | null;
  readonly tags?: readonly string[] | null;
  readonly due?: string | null;
  readonly depends?: readonly string[] | null;
};

type SanitizedTaskAttributesInput = {
  readonly project?: string;
  readonly assignee?: string;
  readonly tags?: string[];
  readonly due?: string;
  readonly depends?: string[];
};

export type TaskAttributesError = ZodValidationError;

function sanitizeAttributesInput(input: TaskAttributesInput): SanitizedTaskAttributesInput {
  const tags = input.tags?.map((tag) => tag.trim()).filter((tag) => tag.length > 0);
  const depends = input.depends?.map((id) => sanitizeTaskId(id));
  const due = typeof input.due === "string" ? input.due.trim() : undefined;

  return {
    project: typeof input.project === "string" ? input.project.trim() : undefined,
    assignee: typeof input.assignee === "string" ? input.assignee.trim() : undefined,
    tags: tags && tags.length > 0 ? tags : undefined,
    due: due && due.length > 0 ? due : undefined,
    depends: depends && depends.length > 0 ? depends : undefined,
  };
}

export function parseTaskAttributes(
  input: TaskAttributesInput | undefined,
): NeverthrowResult<TaskAttributes, TaskAttributesError> {
  if (!input) {
    return ok({} as TaskAttributes);
  }

  const sanitized = sanitizeAttributesInput(input);

  return parseWithSchema(taskAttributesSchema, sanitized, {
    subject: "TaskAttributes",
  });
}
