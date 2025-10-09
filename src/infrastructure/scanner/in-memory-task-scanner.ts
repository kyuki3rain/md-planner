import type { MarkdownTaskParserInput } from "@application/ports/markdown-task-parser";
import type {
  TaskScannerOptions,
  TaskScannerPort,
  WorkspaceFolderInput,
} from "@application/ports/task-scanner";

export type InMemoryTaskScannerFile = MarkdownTaskParserInput;

export class InMemoryTaskScanner implements TaskScannerPort {
  private files: InMemoryTaskScannerFile[];

  constructor(initialFiles: readonly InMemoryTaskScannerFile[] = []) {
    this.files = [...initialFiles];
  }

  async scan(
    workspaceFolders: readonly WorkspaceFolderInput[],
    options?: TaskScannerOptions,
  ): Promise<readonly MarkdownTaskParserInput[]> {
    void workspaceFolders;
    void options;
    return [...this.files];
  }

  setFiles(files: readonly InMemoryTaskScannerFile[]): void {
    this.files = [...files];
  }
}
