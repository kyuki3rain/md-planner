import type { Task } from "@domain/entities/task";
import type { TaskRepository } from "@domain/repositories/task-repository";

import type { BuildTaskIndexInput } from "@application/dto/build-task-index.input";
import type {
  BuildTaskIndexIssue,
  BuildTaskIndexOutput,
} from "@application/dto/build-task-index.output";
import type { TaskIndexSettingsPort } from "@application/ports/task-index-settings";
import type {
  TaskScannerOptions,
  TaskScannerPort,
  WorkspaceFolderInput,
} from "@application/ports/task-scanner";

type BuildTaskIndexExecutor = {
  execute(input: BuildTaskIndexInput): Promise<BuildTaskIndexOutput>;
};

type TaskIndexServiceDependencies = {
  readonly scanner: TaskScannerPort;
  readonly buildIndexUseCase: BuildTaskIndexExecutor;
  readonly repository: TaskRepository;
  readonly settings?: TaskIndexSettingsPort;
};

export class TaskIndexService {
  private initialized = false;

  private issues: BuildTaskIndexIssue[] = [];

  constructor(private readonly dependencies: TaskIndexServiceDependencies) {}

  async initialize(
    workspaceFolders: readonly WorkspaceFolderInput[],
    options?: TaskScannerOptions,
  ): Promise<void> {
    // 再初期化を許可
    const settingsOptions = await this.dependencies.settings?.getScannerOptions();
    const mergedOptions = mergeScannerOptions(options, settingsOptions);

    const files = await this.dependencies.scanner.scan(workspaceFolders, mergedOptions);
    const input: BuildTaskIndexInput = {
      files,
    };

    const result = await this.dependencies.buildIndexUseCase.execute(input);

    this.issues = [...result.issues];
    this.initialized = true;
  }

  async listAll(): Promise<readonly Task[]> {
    this.ensureInitialized();
    return this.dependencies.repository.listAll();
  }

  getIssues(): readonly BuildTaskIndexIssue[] {
    return this.issues;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error("TaskIndexService is not initialized");
    }
  }
}

function mergeScannerOptions(
  primary?: TaskScannerOptions,
  fallback?: TaskScannerOptions,
): TaskScannerOptions | undefined {
  const include = primary?.include ?? fallback?.include;
  const exclude = primary?.exclude ?? fallback?.exclude;

  if (!include && !exclude) {
    return undefined;
  }

  return {
    ...(include ? { include } : {}),
    ...(exclude ? { exclude } : {}),
  } satisfies TaskScannerOptions;
}
