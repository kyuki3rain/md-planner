import { z } from "zod";

import { TaskIdSchema } from "@domain/value-objects/task-id";

/**
 * DeleteTaskUseCaseへの入力データ
 */
export const DeleteTaskInputSchema = z.object({
  /** 削除対象タスクのID */
  id: TaskIdSchema,
});

export type DeleteTaskInput = z.infer<typeof DeleteTaskInputSchema>;
