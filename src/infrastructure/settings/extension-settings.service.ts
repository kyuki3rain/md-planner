import type { TaskIndexSettingsPort } from "@application/ports/task-index-settings";
import type { TaskScannerOptions } from "@application/ports/task-scanner";

type ConfigurationReader = {
  get<T>(section: string): T | undefined;
};

type ExtensionSettingsServiceDependencies = {
  readonly configuration: ConfigurationReader;
};

const INDEX_INCLUDE_KEY = "index.include";
const INDEX_EXCLUDE_KEY = "index.exclude";

export class ExtensionSettingsService implements TaskIndexSettingsPort {
  constructor(private readonly dependencies: ExtensionSettingsServiceDependencies) {}

  async getScannerOptions(): Promise<TaskScannerOptions | undefined> {
    const include = this.readStringArray(INDEX_INCLUDE_KEY);
    const exclude = this.readStringArray(INDEX_EXCLUDE_KEY);

    if (!include && !exclude) {
      return undefined;
    }

    return {
      ...(include ? { include } : {}),
      ...(exclude ? { exclude } : {}),
    } satisfies TaskScannerOptions;
  }

  private readStringArray(key: string): readonly string[] | undefined {
    const values = this.dependencies.configuration.get<unknown>(key);

    if (!Array.isArray(values)) {
      return undefined;
    }

    return values.filter((value): value is string => typeof value === "string");
  }
}
