import type { Task } from "@domain/entities/task";

import type { MarkdownTaskParserIssue } from "@application/ports/markdown-task-parser";

export type BuildTaskIndexIssue = MarkdownTaskParserIssue & {
  readonly filePath: string;
};

export type BuildTaskIndexOutput = {
  readonly tasks: readonly Task[];
  readonly issues: readonly BuildTaskIndexIssue[];
};
