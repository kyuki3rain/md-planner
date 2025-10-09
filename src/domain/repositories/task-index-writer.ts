import type { Task } from "@domain/entities/task";
import type { TaskId } from "@domain/value-objects/task-id";

export interface TaskIndexWriter {
  upsert(task: Task): Promise<void>;
  remove(id: TaskId): Promise<void>;
  replace(tasks: readonly Task[]): Promise<void>;
}
