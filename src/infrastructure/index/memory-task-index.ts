import type { Task } from "@domain/entities/task";
import type { TaskIndexWriter } from "@domain/repositories/task-index-writer";
import type { TaskRepository } from "@domain/repositories/task-repository";
import type { TaskId } from "@domain/value-objects/task-id";

function sortTasks(tasks: Iterable<Task>): Task[] {
  return Array.from(tasks).sort((left, right) => {
    const fileComparison = left.source.filePath.localeCompare(right.source.filePath);
    if (fileComparison !== 0) {
      return fileComparison;
    }

    if (left.source.line !== right.source.line) {
      return left.source.line - right.source.line;
    }

    return left.source.column - right.source.column;
  });
}

export class InMemoryTaskIndex implements TaskRepository, TaskIndexWriter {
  private readonly tasksById = new Map<TaskId, Task>();

  private readonly tasksByFile = new Map<string, Map<TaskId, Task>>();

  async findById(id: TaskId): Promise<Task | null> {
    return this.tasksById.get(id) ?? null;
  }

  async listAll(): Promise<readonly Task[]> {
    return sortTasks(this.tasksById.values());
  }

  async listByFile(filePath: string): Promise<readonly Task[]> {
    const fileTasks = this.tasksByFile.get(filePath);
    if (!fileTasks) {
      return [];
    }
    return sortTasks(fileTasks.values());
  }

  async upsert(task: Task): Promise<void> {
    const existing = this.tasksById.get(task.id);
    if (existing) {
      this.removeFromFile(existing.source.filePath, existing.id);
    }

    this.tasksById.set(task.id, task);
    this.addToFile(task);
  }

  async remove(id: TaskId): Promise<void> {
    const existing = this.tasksById.get(id);
    if (!existing) {
      return;
    }

    this.tasksById.delete(id);
    this.removeFromFile(existing.source.filePath, id);
  }

  async replace(tasks: readonly Task[]): Promise<void> {
    this.tasksById.clear();
    this.tasksByFile.clear();

    for (const task of tasks) {
      this.tasksById.set(task.id, task);
      this.addToFile(task);
    }
  }

  private addToFile(task: Task): void {
    const existing = this.tasksByFile.get(task.source.filePath);
    if (existing) {
      existing.set(task.id, task);
      return;
    }

    const map = new Map<TaskId, Task>();
    map.set(task.id, task);
    this.tasksByFile.set(task.source.filePath, map);
  }

  private removeFromFile(filePath: string, taskId: TaskId): void {
    const fileTasks = this.tasksByFile.get(filePath);
    if (!fileTasks) {
      return;
    }

    fileTasks.delete(taskId);

    if (fileTasks.size === 0) {
      this.tasksByFile.delete(filePath);
    }
  }
}
