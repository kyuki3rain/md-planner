import type { Task } from "@domain/entities/task";

export type MarkdownTaskParserInput = {
  readonly content: string;
  readonly filePath: string;
};

export type MarkdownTaskParserIssue = {
  readonly message: string;
  readonly line: number;
  readonly column: number;
  readonly detail?: unknown;
};

export type MarkdownTaskParserOutput = {
  readonly tasks: readonly Task[];
  readonly issues: readonly MarkdownTaskParserIssue[];
};

export interface MarkdownTaskParserPort {
  parse(input: MarkdownTaskParserInput): MarkdownTaskParserOutput;
}
