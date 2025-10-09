import type { Task } from "@domain/entities/task";
import type { Result } from "neverthrow";

/**
 * Markdownファイルへのパッチ適用エラー
 */
export type PatchServiceError =
  | { type: "FILE_NOT_FOUND"; filePath: string }
  | { type: "PARSE_ERROR"; message: string }
  | { type: "TASK_NOT_FOUND"; taskId: string }
  | { type: "CONFLICT"; message: string }
  | { type: "WRITE_ERROR"; message: string };

/**
 * タスク挿入操作
 */
export type InsertTaskOperation = {
  type: "insert";
  filePath: string;
  task: Task;
  insertLine?: number; // 省略時はファイル末尾
};

/**
 * タスク更新操作
 */
export type UpdateTaskOperation = {
  type: "update";
  task: Task;
};

/**
 * タスク削除操作
 */
export type DeleteTaskOperation = {
  type: "delete";
  taskId: string;
  filePath: string;
};

export type PatchOperation = InsertTaskOperation | UpdateTaskOperation | DeleteTaskOperation;

/**
 * Markdownファイルへのタスク操作を最小差分で適用するポートインターフェース
 *
 * - ASTマップに基づく精密な位置特定
 * - 既存のフォーマットを尊重した書き込み
 * - アトミックなファイル更新
 */
export interface PatchServicePort {
  /**
   * パッチ操作をMarkdownファイルに適用
   *
   * @param operation パッチ操作
   * @returns 成功時はvoid、失敗時はエラー
   */
  applyPatch(operation: PatchOperation): Promise<Result<void, PatchServiceError>>;
}
