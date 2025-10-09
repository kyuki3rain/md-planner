import type * as vscode from "vscode";

import { TaskFactory } from "@domain/services/task-factory";

import { TaskIndexService } from "@application/services/task-index.service";
import { BuildTaskIndexUseCase } from "@application/usecases/build-task-index.usecase";
import { CreateTaskUseCase } from "@application/usecases/create-task.usecase";
import { DeleteTaskUseCase } from "@application/usecases/delete-task.usecase";
import { UpdateTaskUseCase } from "@application/usecases/update-task.usecase";

import { VSCodeFileSystem } from "@infrastructure/fs/vscode-file-system";
import { InMemoryTaskIndex } from "@infrastructure/index/memory-task-index";
import { MarkdownTaskParser } from "@infrastructure/parsers/markdown-task-parser";
import { MarkdownPatchService } from "@infrastructure/patch/markdown-patch.service";
import { FileSystemTaskScanner } from "@infrastructure/scanner/file-system-task-scanner";

/**
 * Extension全体の依存性注入コンテナ
 */
export class ExtensionContainer {
  private _taskIndexService?: TaskIndexService;
  private _taskIndex?: InMemoryTaskIndex;
  private _createTaskUseCase?: CreateTaskUseCase;
  private _updateTaskUseCase?: UpdateTaskUseCase;
  private _deleteTaskUseCase?: DeleteTaskUseCase;

  constructor(private readonly context: vscode.ExtensionContext) {}

  /**
   * TaskIndexServiceのシングルトンインスタンスを取得
   */
  get taskIndexService(): TaskIndexService {
    if (!this._taskIndexService) {
      const index = this.getTaskIndex();
      const parser = new MarkdownTaskParser(new TaskFactory());
      const buildIndexUseCase = new BuildTaskIndexUseCase({ parser, writer: index });
      const scanner = new FileSystemTaskScanner();

      this._taskIndexService = new TaskIndexService({
        scanner,
        buildIndexUseCase,
        repository: index,
      });
    }
    return this._taskIndexService;
  }

  /**
   * CreateTaskUseCaseのシングルトンインスタンスを取得
   */
  get createTaskUseCase(): CreateTaskUseCase {
    if (!this._createTaskUseCase) {
      const fileSystem = new VSCodeFileSystem();
      const patchService = new MarkdownPatchService(fileSystem, fileSystem);
      const index = this.getTaskIndex();

      this._createTaskUseCase = new CreateTaskUseCase({
        patchService,
        indexWriter: index,
      });
    }
    return this._createTaskUseCase;
  }

  /**
   * UpdateTaskUseCaseのシングルトンインスタンスを取得
   */
  get updateTaskUseCase(): UpdateTaskUseCase {
    if (!this._updateTaskUseCase) {
      const fileSystem = new VSCodeFileSystem();
      const patchService = new MarkdownPatchService(fileSystem, fileSystem);
      const index = this.getTaskIndex();

      this._updateTaskUseCase = new UpdateTaskUseCase({
        patchService,
        repository: index,
        indexWriter: index,
      });
    }
    return this._updateTaskUseCase;
  }

  /**
   * DeleteTaskUseCaseのシングルトンインスタンスを取得
   */
  get deleteTaskUseCase(): DeleteTaskUseCase {
    if (!this._deleteTaskUseCase) {
      const fileSystem = new VSCodeFileSystem();
      const patchService = new MarkdownPatchService(fileSystem, fileSystem);
      const index = this.getTaskIndex();

      this._deleteTaskUseCase = new DeleteTaskUseCase({
        patchService,
        repository: index,
        indexWriter: index,
      });
    }
    return this._deleteTaskUseCase;
  }

  /**
   * InMemoryTaskIndexインスタンスを取得（内部用）
   * 全てのUseCaseで同じインスタンスを共有
   */
  private getTaskIndex(): InMemoryTaskIndex {
    if (!this._taskIndex) {
      this._taskIndex = new InMemoryTaskIndex();
    }
    return this._taskIndex;
  }
}
