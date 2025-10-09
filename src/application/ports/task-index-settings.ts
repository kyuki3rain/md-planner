import type { TaskScannerOptions } from "@application/ports/task-scanner";

export interface TaskIndexSettingsPort {
  getScannerOptions(): Promise<TaskScannerOptions | undefined>;
}
