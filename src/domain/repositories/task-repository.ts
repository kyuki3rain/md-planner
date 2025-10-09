import type { Task } from "@domain/entities/task";
import type { TaskId } from "@domain/value-objects/task-id";

export interface TaskRepository {
  findById(id: TaskId): Promise<Task | null>;
  listAll(): Promise<readonly Task[]>;
  listByFile(filePath: string): Promise<readonly Task[]>;
}
