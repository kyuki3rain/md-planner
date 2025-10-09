import type { Result } from "neverthrow";
import { err, ok } from "neverthrow";
import * as vscode from "vscode";

import type {
  FileReaderPort,
  FileSystemError,
  FileWriterPort,
} from "@application/ports/file-system";

/**
 * VS CodeのワークスペースAPIを使用したファイルシステム実装
 */
export class VSCodeFileSystem implements FileReaderPort, FileWriterPort {
  async readFile(filePath: string): Promise<Result<string, FileSystemError>> {
    try {
      const uri = vscode.Uri.file(filePath);
      const fileData = await vscode.workspace.fs.readFile(uri);
      const content = new TextDecoder().decode(fileData);
      return ok(content);
    } catch (error) {
      if (error instanceof vscode.FileSystemError) {
        if (error.code === "FileNotFound") {
          return err({ type: "FILE_NOT_FOUND", filePath });
        }
      }
      return err({
        type: "READ_ERROR",
        message: error instanceof Error ? error.message : "Unknown read error",
      });
    }
  }

  async writeFile(filePath: string, content: string): Promise<Result<void, FileSystemError>> {
    try {
      const uri = vscode.Uri.file(filePath);
      const fileData = new TextEncoder().encode(content);
      await vscode.workspace.fs.writeFile(uri, fileData);
      return ok(undefined);
    } catch (error) {
      return err({
        type: "WRITE_ERROR",
        message: error instanceof Error ? error.message : "Unknown write error",
      });
    }
  }
}
