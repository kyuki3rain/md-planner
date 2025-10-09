import type { Task } from "@domain/entities/task";

/**
 * CreateTaskUseCaseの実行結果
 */
export type CreateTaskOutput = {
  /** 作成されたタスク */
  task: Task;
};
