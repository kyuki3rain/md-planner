import type { FileReaderPort, FileWriterPort } from "@application/ports/file-system";
import type { PatchServicePort } from "@application/ports/patch-service";
import { VSCodeFileSystem } from "@infrastructure/fs/vscode-file-system";
import { MarkdownPatchService } from "@infrastructure/patch/markdown-patch.service";

/**
 * VS Code環境用のPatchServiceを作成
 */
export function createPatchService(): PatchServicePort {
  const fileSystem = new VSCodeFileSystem();
  return new MarkdownPatchService(fileSystem, fileSystem);
}

/**
 * テスト用のPatchServiceを作成（カスタムファイルシステム）
 */
export function createPatchServiceWithFileSystem(
  fileReader: FileReaderPort,
  fileWriter: FileWriterPort,
): PatchServicePort {
  return new MarkdownPatchService(fileReader, fileWriter);
}
