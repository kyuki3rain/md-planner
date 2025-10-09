import { TaskFactory } from "@domain/services/task-factory";

import type { TaskIndexSettingsPort } from "@application/ports/task-index-settings";
import type { TaskScannerOptions } from "@application/ports/task-scanner";
import { TaskIndexService } from "@application/services/task-index.service";
import { BuildTaskIndexUseCase } from "@application/usecases/build-task-index.usecase";

import { InMemoryTaskIndex } from "@infrastructure/index/memory-task-index";
import { MarkdownTaskParser } from "@infrastructure/parsers/markdown-task-parser";
import { FileSystemTaskScanner } from "@infrastructure/scanner/file-system-task-scanner";

type TaskIndexServiceFactoryOptions = {
  readonly scannerDefaults?: TaskScannerOptions;
  readonly settings?: TaskIndexSettingsPort;
};

export function createTaskIndexService(
  options: TaskIndexServiceFactoryOptions = {},
): TaskIndexService {
  const index = new InMemoryTaskIndex();
  const parser = new MarkdownTaskParser(new TaskFactory());
  const buildIndexUseCase = new BuildTaskIndexUseCase({ parser, writer: index });
  const scanner = new FileSystemTaskScanner(options.scannerDefaults);

  return new TaskIndexService({
    scanner,
    buildIndexUseCase,
    repository: index,
    settings: options.settings,
  });
}
