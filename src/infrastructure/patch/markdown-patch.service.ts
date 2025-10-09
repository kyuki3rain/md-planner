import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import type { FileReaderPort, FileWriterPort } from "@application/ports/file-system";
import type {
  PatchOperation,
  PatchServiceError,
  PatchServicePort,
} from "@application/ports/patch-service";
import type { Task } from "@domain/entities/task";
import type { TaskAttributes } from "@domain/entities/task-attributes";

/**
 * Markdownファイルへのパッチ適用実装
 *
 * タスク行の挿入、更新、削除を行い、既存のフォーマットを可能な限り保持する
 */
export class MarkdownPatchService implements PatchServicePort {
  constructor(
    private readonly fileReader: FileReaderPort,
    private readonly fileWriter: FileWriterPort,
  ) {}

  async applyPatch(operation: PatchOperation): Promise<Result<void, PatchServiceError>> {
    switch (operation.type) {
      case "insert":
        return this.applyInsert(operation.filePath, operation.task, operation.insertLine);
      case "update":
        return this.applyUpdate(operation.task);
      case "delete":
        return this.applyDelete(operation.taskId, operation.filePath);
    }
  }

  private async applyInsert(
    filePath: string,
    task: Task,
    insertLine?: number,
  ): Promise<Result<void, PatchServiceError>> {
    const contentResult = await this.fileReader.readFile(filePath);
    if (contentResult.isErr()) {
      return err(this.mapFileSystemError(contentResult.error));
    }

    const content = contentResult.value;
    const lines = content.split("\n");
    const taskLine = this.formatTaskLine(task);

    if (insertLine !== undefined && insertLine >= 0 && insertLine <= lines.length) {
      lines.splice(insertLine, 0, taskLine);
    } else {
      // ファイル末尾に追加
      if (lines[lines.length - 1] !== "") {
        lines.push("");
      }
      lines.push(taskLine);
    }

    const newContent = lines.join("\n");
    const writeResult = await this.fileWriter.writeFile(filePath, newContent);

    if (writeResult.isErr()) {
      return err(this.mapFileSystemError(writeResult.error));
    }

    return ok(undefined);
  }

  private async applyUpdate(task: Task): Promise<Result<void, PatchServiceError>> {
    const contentResult = await this.fileReader.readFile(task.source.filePath);
    if (contentResult.isErr()) {
      return err(this.mapFileSystemError(contentResult.error));
    }

    const content = contentResult.value;
    const lines = content.split("\n");

    // タスクIDでタスク行を見つける
    const taskLineIndex = this.findTaskLineById(lines, task.id);
    if (taskLineIndex === -1) {
      return err({ type: "TASK_NOT_FOUND", taskId: task.id });
    }

    const originalLine = lines[taskLineIndex] ?? "";
    const indentation = this.extractIndentation(originalLine);
    const newTaskLine = this.formatTaskLine(task, indentation);

    lines[taskLineIndex] = newTaskLine;

    const newContent = lines.join("\n");
    const writeResult = await this.fileWriter.writeFile(task.source.filePath, newContent);

    if (writeResult.isErr()) {
      return err(this.mapFileSystemError(writeResult.error));
    }

    return ok(undefined);
  }

  private async applyDelete(
    taskId: string,
    filePath: string,
  ): Promise<Result<void, PatchServiceError>> {
    const contentResult = await this.fileReader.readFile(filePath);
    if (contentResult.isErr()) {
      return err(this.mapFileSystemError(contentResult.error));
    }

    const content = contentResult.value;
    const lines = content.split("\n");

    const taskLineIndex = this.findTaskLineById(lines, taskId);
    if (taskLineIndex === -1) {
      return err({ type: "TASK_NOT_FOUND", taskId });
    }

    lines.splice(taskLineIndex, 1);

    const newContent = lines.join("\n");
    const writeResult = await this.fileWriter.writeFile(filePath, newContent);

    if (writeResult.isErr()) {
      return err(this.mapFileSystemError(writeResult.error));
    }

    return ok(undefined);
  }

  /**
   * タスクをMarkdown行としてフォーマット
   */
  private formatTaskLine(task: Task, indentation = ""): string {
    const checkbox = task.status === "done" ? "[x]" : "[ ]";
    const attributes = this.formatAttributes(task);

    return `${indentation}- ${checkbox} ${task.title} ${attributes}`;
  }

  /**
   * タスク属性をMarkdown形式でフォーマット
   */
  private formatAttributes(task: Task): string {
    const parts: string[] = [];

    // IDは必須
    parts.push(`id: ${task.id}`);

    // statusを追加（doneの場合はチェックボックスで表現されるので省略可能だが、明示的に記述）
    if (task.status !== "todo") {
      parts.push(`status: ${task.status}`);
    }

    // その他の属性
    const attrs = task.attributes;
    if (attrs.project) {
      parts.push(`project: ${attrs.project}`);
    }
    if (attrs.assignee) {
      parts.push(`assignee: ${attrs.assignee}`);
    }
    if (attrs.due) {
      parts.push(`due: ${attrs.due}`);
    }
    if (attrs.tags && attrs.tags.length > 0) {
      parts.push(`tags: [${attrs.tags.join(", ")}]`);
    }
    if (attrs.depends && attrs.depends.length > 0) {
      parts.push(`depends: [${attrs.depends.join(", ")}]`);
    }

    return `{${parts.join(", ")}}`;
  }

  /**
   * 行内からタスクIDを探して行番号を返す
   */
  private findTaskLineById(lines: string[], taskId: string): number {
    const idPattern = new RegExp(`\\bid:\\s*${this.escapeRegex(taskId)}\\b`);
    return lines.findIndex((line) => idPattern.test(line));
  }

  /**
   * 行の先頭のインデント（空白文字）を抽出
   */
  private extractIndentation(line: string): string {
    const match = /^(\s*)/.exec(line);
    return match?.[1] ?? "";
  }

  /**
   * 正規表現の特殊文字をエスケープ
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * ファイルシステムエラーをPatchServiceErrorにマッピング
   */
  private mapFileSystemError(error: {
    type: string;
    filePath?: string;
    message?: string;
  }): PatchServiceError {
    switch (error.type) {
      case "FILE_NOT_FOUND":
        return { type: "FILE_NOT_FOUND", filePath: error.filePath ?? "" };
      case "READ_ERROR":
        return { type: "PARSE_ERROR", message: error.message ?? "Failed to read file" };
      case "WRITE_ERROR":
        return { type: "WRITE_ERROR", message: error.message ?? "Failed to write file" };
      default:
        return { type: "WRITE_ERROR", message: "Unknown file system error" };
    }
  }
}
