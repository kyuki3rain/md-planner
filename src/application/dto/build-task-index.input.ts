import type { MarkdownTaskParserInput } from "@application/ports/markdown-task-parser";

export type BuildTaskIndexFileInput = MarkdownTaskParserInput;

export type BuildTaskIndexInput = {
  readonly files: readonly BuildTaskIndexFileInput[];
};
