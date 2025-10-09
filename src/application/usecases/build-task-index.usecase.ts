import type { Task } from "@domain/entities/task";
import type { TaskIndexWriter } from "@domain/repositories/task-index-writer";

import type { BuildTaskIndexInput } from "@application/dto/build-task-index.input";
import type {
  BuildTaskIndexIssue,
  BuildTaskIndexOutput,
} from "@application/dto/build-task-index.output";
import type {
  MarkdownTaskParserOutput,
  MarkdownTaskParserPort,
} from "@application/ports/markdown-task-parser";

type BuildTaskIndexDependencies = {
  readonly parser: MarkdownTaskParserPort;
  readonly writer: TaskIndexWriter;
};

export class BuildTaskIndexUseCase {
  constructor(private readonly dependencies: BuildTaskIndexDependencies) {}

  async execute(input: BuildTaskIndexInput): Promise<BuildTaskIndexOutput> {
    const aggregatedTasks: Task[] = [];
    const aggregatedIssues: BuildTaskIndexIssue[] = [];

    for (const file of input.files) {
      const result = this.dependencies.parser.parse(file);
      this.collectTasks(result, aggregatedTasks);
      this.collectIssues(result, file.filePath, aggregatedIssues);
    }

    await this.dependencies.writer.replace(aggregatedTasks);

    return {
      tasks: aggregatedTasks,
      issues: aggregatedIssues,
    } satisfies BuildTaskIndexOutput;
  }

  private collectTasks(result: MarkdownTaskParserOutput, store: Task[]): void {
    store.push(...result.tasks);
  }

  private collectIssues(
    result: MarkdownTaskParserOutput,
    filePath: string,
    store: BuildTaskIndexIssue[],
  ): void {
    if (result.issues.length === 0) {
      return;
    }

    for (const issue of result.issues) {
      store.push({ ...issue, filePath });
    }
  }
}
