import type { Task } from "@domain/entities/task";

/**
 * UpdateTaskUseCaseの実行結果
 */
export type UpdateTaskOutput = {
  /** 更新されたタスク */
  task: Task;
};
