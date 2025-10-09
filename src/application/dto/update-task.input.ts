import { z } from "zod";

import { TaskTitleSchema } from "@domain/entities/task";
import { TaskAttributesSchema } from "@domain/entities/task-attributes";
import { TaskIdSchema } from "@domain/value-objects/task-id";
import { TaskStatusSchema } from "@domain/value-objects/task-status";

/**
 * UpdateTaskUseCaseへの入力データ
 */
export const UpdateTaskInputSchema = z.object({
  /** 更新対象タスクのID */
  id: TaskIdSchema,
  /** 新しいタイトル（省略時は変更なし） */
  title: TaskTitleSchema.optional(),
  /** 新しいステータス（省略時は変更なし） */
  status: TaskStatusSchema.optional(),
  /** 新しい属性（省略時は変更なし、nullで属性クリア） */
  attributes: TaskAttributesSchema.optional().nullable(),
});

export type UpdateTaskInput = z.infer<typeof UpdateTaskInputSchema>;
