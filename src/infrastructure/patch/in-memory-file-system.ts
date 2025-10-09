import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";

import type {
  FileReaderPort,
  FileSystemError,
  FileWriterPort,
} from "@application/ports/file-system";

/**
 * テスト用のインメモリファイルシステム実装
 */
export class InMemoryFileSystem implements FileReaderPort, FileWriterPort {
  private files: Map<string, string> = new Map();

  async readFile(filePath: string): Promise<Result<string, FileSystemError>> {
    const content = this.files.get(filePath);
    if (content === undefined) {
      return err({ type: "FILE_NOT_FOUND", filePath });
    }
    return ok(content);
  }

  async writeFile(filePath: string, content: string): Promise<Result<void, FileSystemError>> {
    this.files.set(filePath, content);
    return ok(undefined);
  }

  /**
   * テストヘルパー: ファイルを設定
   */
  setFile(filePath: string, content: string): void {
    this.files.set(filePath, content);
  }

  /**
   * テストヘルパー: ファイルの内容を取得
   */
  getFile(filePath: string): string {
    return this.files.get(filePath) ?? "";
  }

  /**
   * テストヘルパー: ファイルが存在するか確認
   */
  hasFile(filePath: string): boolean {
    return this.files.has(filePath);
  }

  /**
   * テストヘルパー: 全ファイルをクリア
   */
  clear(): void {
    this.files.clear();
  }
}
