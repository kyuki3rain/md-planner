import { z } from "zod";

import type { TaskId } from "@domain/value-objects/task-id";
import { TaskIdSchema } from "@domain/value-objects/task-id";
import { type TaskStatus, TaskStatusSchema } from "@domain/value-objects/task-status";

import { type TaskAttributes, TaskAttributesSchema } from "./task-attributes";

const taskTitleSchema = z.string().min(1, { message: "Task title must not be empty" });

export type TaskTitle = z.infer<typeof taskTitleSchema>;

const taskSourceSchema = z.object({
  filePath: z.string().min(1),
  line: z.number().int().min(0),
  column: z.number().int().min(0),
});

export type TaskSource = z.infer<typeof taskSourceSchema>;

export type Task = {
  readonly id: TaskId;
  readonly title: TaskTitle;
  readonly status: TaskStatus;
  readonly attributes: TaskAttributes;
  readonly source: TaskSource;
};

export const TaskIdRefSchema = TaskIdSchema;
export const TaskTitleSchema = taskTitleSchema;
export const TaskSourceSchema = taskSourceSchema;

export const TaskSchema = z.object({
  id: TaskIdSchema,
  title: taskTitleSchema,
  status: TaskStatusSchema,
  attributes: TaskAttributesSchema,
  source: taskSourceSchema,
});
