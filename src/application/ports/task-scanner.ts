import type { MarkdownTaskParserInput } from "@application/ports/markdown-task-parser";

export type WorkspaceFolderInput = {
  readonly path: string;
};

export type TaskScannerOptions = {
  readonly include?: readonly string[];
  readonly exclude?: readonly string[];
};

export interface TaskScannerPort {
  scan(
    workspaceFolders: readonly WorkspaceFolderInput[],
    options?: TaskScannerOptions,
  ): Promise<readonly MarkdownTaskParserInput[]>;
}
