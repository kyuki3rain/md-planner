import * as vscode from "vscode";
import * as path from "node:path";
import type { CreateTaskInput } from "@application/dto/create-task.input";
import type { UpdateTaskInput } from "@application/dto/update-task.input";
import type { TaskAttributesInput } from "@domain/entities/task-attributes";
import { type DueDate, ensureDueDate } from "@domain/value-objects/due-date";
import type { ExtensionContainer } from "@infrastructure/di/extension-container";
import { BaseWebviewProvider } from "./base-webview-provider";

/**
 * ボードビュー用のWebviewPanel（中央エディタエリアに表示）
 */
export class BoardViewPanel extends BaseWebviewProvider {
  public static currentPanels = new Map<string, BoardViewPanel>();

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly filePath: string,
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    private readonly container: ExtensionContainer,
  ) {
    super(extensionUri, context);

    // パネルの設定
    this.panel.webview.options = {
      enableScripts: true,
      localResourceRoots: [extensionUri],
    };

    // HTMLをセット
    this.panel.webview.html = this._getHtmlForWebview(
      this.panel.webview,
      `Board: ${path.basename(filePath)}`,
    );

    // メッセージリスナー
    this._setWebviewMessageListener(this.panel.webview);

    // パネルが閉じられたときの処理
    this.panel.onDidDispose(() => {
      BoardViewPanel.currentPanels.delete(filePath);
    });

    // 初期データロード
    this.loadTasksFromFile();
  }

  /**
   * BoardViewPanelを作成または表示
   */
  public static createOrShow(
    context: vscode.ExtensionContext,
    container: ExtensionContainer,
    filePath: string,
  ): BoardViewPanel {
    // 既存パネルがあれば表示
    const existingPanel = BoardViewPanel.currentPanels.get(filePath);
    if (existingPanel) {
      existingPanel.panel.reveal(vscode.ViewColumn.Active);
      return existingPanel;
    }

    // 新規パネル作成
    const panel = vscode.window.createWebviewPanel(
      "mdPlannerBoard",
      `Board: ${path.basename(filePath)}`,
      vscode.ViewColumn.Active,
      {
        enableScripts: true,
        localResourceRoots: [context.extensionUri],
        retainContextWhenHidden: true,
      },
    );

    const boardPanel = new BoardViewPanel(panel, filePath, context.extensionUri, context, container);

    BoardViewPanel.currentPanels.set(filePath, boardPanel);
    return boardPanel;
  }

  /**
   * 単一ファイルからタスクをロード
   */
  private async loadTasksFromFile(): Promise<void> {
    try {
      // 全タスクを取得してから、該当ファイルのタスクのみをフィルタ
      const allTasks = await this.container.taskIndexService.listAll();
      const tasks = allTasks.filter((task) => task.source.filePath === this.filePath);

      // ボードデータを作成
      const boardData = this._createBoardData(tasks);

      // Webviewに送信（currentFilePathを追加）
      this.sendMessage("board:data", { ...boardData, currentFilePath: this.filePath });
    } catch (error) {
      console.error("Failed to load tasks from file:", error);
      this.sendMessage("board:error", { message: "Failed to load tasks" });
    }
  }

  /**
   * タスクをstatusでグループ化してボードデータを作成
   */
  private _createBoardData(tasks: readonly import("@domain/entities/task").Task[]) {
    const grouped = {
      todo: [] as import("@domain/entities/task").Task[],
      doing: [] as import("@domain/entities/task").Task[],
      blocked: [] as import("@domain/entities/task").Task[],
      done: [] as import("@domain/entities/task").Task[],
    };

    for (const task of tasks) {
      const status = task.status;
      if (status in grouped) {
        grouped[status as keyof typeof grouped].push(task);
      } else {
        // 不明なstatusはtodoに分類
        grouped.todo.push(task);
      }
    }

    return {
      columns: [
        {
          id: "todo",
          label: "Todo",
          tasks: grouped.todo.map((task) => this._taskToCardData(task)),
        },
        {
          id: "doing",
          label: "Doing",
          tasks: grouped.doing.map((task) => this._taskToCardData(task)),
        },
        {
          id: "blocked",
          label: "Blocked",
          tasks: grouped.blocked.map((task) => this._taskToCardData(task)),
        },
        {
          id: "done",
          label: "Done",
          tasks: grouped.done.map((task) => this._taskToCardData(task)),
        },
      ],
    };
  }

  /**
   * TaskエンティティをWebview用のCardDataに変換
   */
  private _taskToCardData(task: import("@domain/entities/task").Task) {
    return {
      id: task.id,
      title: task.title,
      status: task.status,
      dueDate: task.attributes.due ?? undefined,
      assignee: task.attributes.assignee ?? undefined,
      tags: task.attributes.tags ?? [],
      filePath: task.source.filePath,
      lineNumber: task.source.line,
      project: task.attributes.project ?? undefined,
      depends: task.attributes.depends ?? [],
    };
  }

  /**
   * Webviewからのメッセージを処理
   */
  private _setWebviewMessageListener(webview: vscode.Webview): void {
    webview.onDidReceiveMessage((message: { type: string; payload?: unknown }) => {
      switch (message.type) {
        case "ready":
          this._handleReady();
          break;
        case "board:load":
          this._handleBoardLoad();
          break;
        case "task:open":
          this._handleTaskOpen(message.payload);
          break;
        case "task:create":
          this._handleTaskCreate(message.payload);
          break;
        case "task:update":
          this._handleTaskUpdate(message.payload);
          break;
        case "task:delete":
          this._handleTaskDelete(message.payload);
          break;
        default:
          console.warn(`Unknown message type: ${message.type}`);
      }
    });
  }

  /**
   * Webviewの準備完了を処理
   */
  private _handleReady(): void {
    console.log("Webview is ready");
    // 初期データの送信
    this._handleBoardLoad();
  }

  /**
   * ボードデータのロード要求を処理
   */
  private async _handleBoardLoad(): Promise<void> {
    await this.loadTasksFromFile();
  }

  /**
   * タスクを開く要求を処理
   */
  private async _handleTaskOpen(payload: unknown): Promise<void> {
    if (!payload || typeof payload !== "object") {
      console.error("Invalid task:open payload:", payload);
      return;
    }

    const { filePath, lineNumber } = payload as { filePath?: string; lineNumber?: number };

    if (!filePath) {
      console.error("filePath is required for task:open");
      return;
    }

    try {
      const uri = vscode.Uri.file(filePath);
      const document = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(document);

      // 行番号が指定されている場合、その行にジャンプ
      if (typeof lineNumber === "number" && lineNumber >= 0) {
        const position = new vscode.Position(lineNumber, 0);
        editor.selection = new vscode.Selection(position, position);
        editor.revealRange(
          new vscode.Range(position, position),
          vscode.TextEditorRevealType.InCenter,
        );
      }
    } catch (error) {
      console.error("Failed to open task:", error);
    }
  }

  /**
   * タスク作成リクエストを処理
   */
  private async _handleTaskCreate(payload: unknown): Promise<void> {
    if (!payload || typeof payload !== "object") {
      console.error("Invalid task:create payload:", payload);
      return;
    }

    const data = payload as {
      title?: string;
      filePath?: string;
      attributes?: Record<string, unknown>;
      assignee?: unknown;
      dueDate?: unknown;
      tags?: unknown;
      project?: unknown;
      depends?: unknown;
    };

    if (!data.title || !data.filePath) {
      console.error("title and filePath are required for task:create");
      return;
    }

    try {
      const attributesFromFields = this.extractAttributes({
        assignee: data.assignee,
        dueDate: data.dueDate,
        tags: data.tags,
        project: data.project,
        depends: data.depends,
      });

      const attributesFromPayload = this.normalizeAttributesInput(data.attributes);
      const attributes = this.mergeAttributes(attributesFromPayload, attributesFromFields);
      const dtoAttributes = this.toCreateAttributes(attributes);

      const result = await this.container.createTaskUseCase.execute({
        title: data.title,
        filePath: data.filePath,
        ...(dtoAttributes ? { attributes: dtoAttributes } : {}),
      });

      if (result.isOk()) {
        console.log("Task created successfully:", result.value.task.id);
        // ボードを再読み込み
        await this._handleBoardLoad();
      } else {
        console.error("Failed to create task:", result.error);
        this.sendMessage("task:error", { message: "Failed to create task", error: result.error });
      }
    } catch (error) {
      console.error("Exception during task creation:", error);
      this.sendMessage("task:error", { message: "Failed to create task" });
    }
  }

  /**
   * タスク更新リクエストを処理
   */
  private async _handleTaskUpdate(payload: unknown): Promise<void> {
    if (!payload || typeof payload !== "object") {
      console.error("Invalid task:update payload:", payload);
      return;
    }

    const data = payload as {
      id?: string;
      updates?: {
        title?: string;
        status?: "todo" | "doing" | "blocked" | "done" | "archived";
        assignee?: unknown;
        dueDate?: unknown;
        tags?: unknown;
        project?: unknown;
        attributes?: Record<string, unknown>;
        depends?: unknown;
      };
    };

    if (!data.id || !data.updates) {
      console.error("id and updates are required for task:update");
      return;
    }

    try {
      const updateInput: UpdateTaskInput = {
        id: data.id as import("@domain/value-objects/task-id").TaskId,
      };

      if (data.updates.title) {
        updateInput.title = data.updates.title;
      }
      if (data.updates.status) {
        updateInput.status = data.updates.status;
      }

      const attributeUpdatesFromFields = this.extractAttributes({
        assignee: data.updates.assignee,
        dueDate: data.updates.dueDate,
        tags: data.updates.tags,
        project: data.updates.project,
        depends: data.updates.depends,
      });
      const attributeUpdatesFromPayload = this.normalizeAttributesInput(data.updates.attributes);
      const mergedAttributes = this.mergeAttributes(attributeUpdatesFromPayload, attributeUpdatesFromFields);
      const dtoUpdateAttributes = this.toUpdateAttributes(mergedAttributes);

      if (dtoUpdateAttributes !== undefined) {
        updateInput.attributes = dtoUpdateAttributes;
      }

      const result = await this.container.updateTaskUseCase.execute(updateInput);

      if (result.isOk()) {
        console.log("Task updated successfully:", result.value.task.id);
        // ボードを再読み込み
        await this._handleBoardLoad();
      } else {
        console.error("Failed to update task:", result.error);
        this.sendMessage("task:error", { message: "Failed to update task", error: result.error });
      }
    } catch (error) {
      console.error("Exception during task update:", error);
      this.sendMessage("task:error", { message: "Failed to update task" });
    }
  }

  /**
   * タスク削除リクエストを処理
   */
  private async _handleTaskDelete(payload: unknown): Promise<void> {
    if (!payload || typeof payload !== "object") {
      console.error("Invalid task:delete payload:", payload);
      return;
    }

    const data = payload as { id?: string };

    if (!data.id) {
      console.error("id is required for task:delete");
      return;
    }

    try {
      const result = await this.container.deleteTaskUseCase.execute({
        id: data.id as import("@domain/value-objects/task-id").TaskId,
      });

      if (result.isOk()) {
        // ボードを再読み込み
        await this._handleBoardLoad();
      } else {
        console.error("Failed to delete task:", result.error);
        this.sendMessage("task:error", { message: "Failed to delete task", error: result.error });
      }
    } catch (error) {
      console.error("Exception during task deletion:", error);
      this.sendMessage("task:error", { message: "Failed to delete task" });
    }
  }

  /**
   * Webviewにメッセージを送信
   */
  public sendMessage(type: string, payload: unknown): void {
    this.panel.webview.postMessage({ type, payload });
  }

  /**
   * タスクインデックスが更新されたことをWebviewに通知
   * FileWatcherServiceから呼び出される
   */
  public async notifyIndexUpdate(): Promise<void> {
    await this.loadTasksFromFile();
  }

  private normalizeAttributesInput(value: unknown): TaskAttributesInput | undefined {
    if (!value || typeof value !== "object") {
      return undefined;
    }

    const record = value as Record<string, unknown>;
    return this.extractAttributes({
      assignee: record.assignee,
      dueDate: record.due ?? record.dueDate,
      tags: record.tags,
      project: record.project,
      depends: record.depends,
    });
  }

  private extractAttributes(input: {
    assignee?: unknown;
    dueDate?: unknown;
    tags?: unknown;
    project?: unknown;
    depends?: unknown;
  }): TaskAttributesInput | undefined {
    type MutableTaskAttributesInput = {
      project?: string | null;
      assignee?: string | null;
      tags?: string[] | null;
      due?: string | null;
      depends?: string[] | null;
    };

    const attributes: MutableTaskAttributesInput = {};

    if (typeof input.assignee === "string") {
      const trimmed = input.assignee.trim();
      if (trimmed.length > 0) {
        attributes.assignee = trimmed;
      }
    }

    if (typeof input.dueDate === "string") {
      const trimmed = input.dueDate.trim();
      if (trimmed.length > 0) {
        attributes.due = trimmed;
      }
    }

    if (Array.isArray(input.tags)) {
      const normalized = input.tags
        .filter((tag): tag is string => typeof tag === "string")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);
      if (normalized.length > 0) {
        attributes.tags = normalized;
      }
    }

    if (typeof input.project === "string") {
      const trimmed = input.project.trim();
      if (trimmed.length > 0) {
        attributes.project = trimmed;
      }
    }

    if (Array.isArray(input.depends)) {
      const normalized = input.depends
        .filter((dep): dep is string => typeof dep === "string")
        .map((dep) => dep.trim())
        .filter((dep) => dep.length > 0);
      if (normalized.length > 0) {
        attributes.depends = normalized;
      }
    }

    return Object.keys(attributes).length > 0
      ? (attributes as TaskAttributesInput)
      : undefined;
  }

  private mergeAttributes(
    base?: TaskAttributesInput,
    extra?: TaskAttributesInput,
  ): TaskAttributesInput | undefined {
    if (!base && !extra) {
      return undefined;
    }

    const merged = {
      ...(base ?? {}),
      ...(extra ?? {}),
    } as TaskAttributesInput;

    return Object.keys(merged).length > 0 ? merged : undefined;
  }

  private toCreateAttributes(
    attributes: TaskAttributesInput | undefined,
  ): CreateTaskInput["attributes"] | undefined {
    if (!attributes) {
      return undefined;
    }

    type NonNullCreateAttrs = NonNullable<CreateTaskInput["attributes"]>;

    // Validate due date if present
    if (attributes.due) {
      const dueResult = ensureDueDate(attributes.due as string);
      if (dueResult.isErr()) {
        this.sendMessage("task:error", { message: "Invalid due date", detail: dueResult.error });
        return undefined;
      }
    }

    const mapped: NonNullCreateAttrs = {
      tags: attributes.tags ? [...attributes.tags] : undefined,
      depends: attributes.depends
        ? attributes.depends.map((dep) => dep as import("@domain/value-objects/task-id").TaskId)
        : undefined,
      project: attributes.project ?? undefined,
      assignee: attributes.assignee ?? undefined,
      due: attributes.due ? (attributes.due as DueDate) : undefined,
    };

    return Object.keys(mapped).length > 0 ? mapped : undefined;
  }

  private toUpdateAttributes(
    attributes: TaskAttributesInput | undefined,
  ): UpdateTaskInput["attributes"] | undefined {
    if (attributes === undefined) {
      return undefined;
    }
    if (attributes === null) {
      return null;
    }

    type NonNullUpdateAttrs = Exclude<UpdateTaskInput["attributes"], undefined | null>;

    if (attributes.due) {
      const dueResult = ensureDueDate(attributes.due as unknown as string);
      if (dueResult.isErr()) {
        this.sendMessage("task:error", { message: "Invalid due date", detail: dueResult.error });
        return undefined;
      }
    }

    const mapped: NonNullUpdateAttrs = {
      tags: attributes.tags ? [...attributes.tags] : undefined,
      depends: attributes.depends
        ? attributes.depends.map((dep) => dep as import("@domain/value-objects/task-id").TaskId)
        : undefined,
      project: attributes.project ?? undefined,
      assignee: attributes.assignee ?? undefined,
      due: attributes.due ? (attributes.due as unknown as import("@domain/value-objects/due-date").DueDate) : undefined,
    };

    return Object.keys(mapped).length > 0 ? mapped : undefined;
  }
}
