import { z } from "zod";

import { TaskTitleSchema } from "@domain/entities/task";
import { TaskAttributesSchema } from "@domain/entities/task-attributes";

/**
 * CreateTaskUseCaseへの入力データ
 */
export const CreateTaskInputSchema = z.object({
  /** タスクのタイトル */
  title: TaskTitleSchema,
  /** タスクの属性（オプション） */
  attributes: TaskAttributesSchema.optional(),
  /** タスクを挿入するファイルパス */
  filePath: z.string().min(1, { message: "File path must not be empty" }),
  /** 挿入位置（行番号、省略時はファイル末尾） */
  insertLine: z.number().int().min(0).optional(),
});

export type CreateTaskInput = z.infer<typeof CreateTaskInputSchema>;
