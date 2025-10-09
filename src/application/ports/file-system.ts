import type { Result } from "neverthrow";

/**
 * ファイルシステムエラー
 */
export type FileSystemError =
  | { type: "FILE_NOT_FOUND"; filePath: string }
  | { type: "READ_ERROR"; message: string }
  | { type: "WRITE_ERROR"; message: string };

/**
 * ファイル読み取りポート
 */
export interface FileReaderPort {
  /**
   * ファイルの内容を文字列として読み取る
   */
  readFile(filePath: string): Promise<Result<string, FileSystemError>>;
}

/**
 * ファイル書き込みポート
 */
export interface FileWriterPort {
  /**
   * ファイルに内容を書き込む
   */
  writeFile(filePath: string, content: string): Promise<Result<void, FileSystemError>>;
}
