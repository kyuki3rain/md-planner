import type { ExtensionContainer } from "@infrastructure/di/extension-container";
import type * as vscode from "vscode";
import { BaseWebviewProvider } from "./base-webview-provider";

/**
 * ボードビュー用のWebviewプロバイダー
 */
export class BoardViewProvider extends BaseWebviewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "md-planner.boardView";

  private _view?: vscode.WebviewView;

  constructor(
    extensionUri: vscode.Uri,
    context: vscode.ExtensionContext,
    private readonly _container: ExtensionContainer,
  ) {
    super(extensionUri, context);
  }

  /**
   * WebviewViewを解決
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    webviewView.webview.html = this._getHtmlForWebview(
      webviewView.webview,
      "MD Planner - Board View",
    );

    // メッセージハンドラの登録
    this._setWebviewMessageListener(webviewView.webview);
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
    try {
      console.log("Board load requested");

      // TaskIndexServiceからタスクを取得
      const tasks = await this._container.taskIndexService.listAll();

      // タスクをstatusでグループ化
      const groupedTasks = this._groupTasksByStatus(tasks);

      const boardData = {
        columns: [
          {
            id: "todo",
            label: "Todo",
            tasks: groupedTasks.todo.map((task) => this._taskToCardData(task)),
          },
          {
            id: "doing",
            label: "Doing",
            tasks: groupedTasks.doing.map((task) => this._taskToCardData(task)),
          },
          {
            id: "blocked",
            label: "Blocked",
            tasks: groupedTasks.blocked.map((task) => this._taskToCardData(task)),
          },
          {
            id: "done",
            label: "Done",
            tasks: groupedTasks.done.map((task) => this._taskToCardData(task)),
          },
        ],
      };

      this.sendMessage("board:data", boardData);
    } catch (error) {
      console.error("Failed to load board data:", error);
      this.sendMessage("board:error", { message: "Failed to load tasks" });
    }
  }

  /**
   * タスクをstatusでグループ化
   */
  private _groupTasksByStatus(tasks: readonly import("@domain/entities/task").Task[]) {
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

    return grouped;
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
      // VS Code Workspaceを使ってファイルを開く
      const vscode = await import("vscode");
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
    };

    if (!data.title || !data.filePath) {
      console.error("title and filePath are required for task:create");
      return;
    }

    try {
      const result = await this._container.createTaskUseCase.execute({
        title: data.title,
        filePath: data.filePath,
        // attributesは型チェック後に渡す
        // TODO: 適切な型変換を実装
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
        attributes?: Record<string, unknown>;
      };
    };

    if (!data.id || !data.updates) {
      console.error("id and updates are required for task:update");
      return;
    }

    try {
      const updateInput: {
        id: import("@domain/value-objects/task-id").TaskId;
        title?: string;
        status?: "todo" | "doing" | "blocked" | "done" | "archived";
      } = {
        id: data.id as import("@domain/value-objects/task-id").TaskId,
      };

      if (data.updates.title) {
        updateInput.title = data.updates.title;
      }
      if (data.updates.status) {
        updateInput.status = data.updates.status;
      }

      const result = await this._container.updateTaskUseCase.execute(updateInput);

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
      const result = await this._container.deleteTaskUseCase.execute({
        id: data.id as import("@domain/value-objects/task-id").TaskId,
      });

      if (result.isOk()) {
        console.log("Task deleted successfully:", data.id);
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
    if (this._view) {
      this._view.webview.postMessage({ type, payload });
    }
  }

  /**
   * タスクインデックスが更新されたことをWebviewに通知
   * FileWatcherServiceから呼び出される
   */
  public async notifyIndexUpdate(): Promise<void> {
    console.log("Task index updated, reloading board...");
    await this._handleBoardLoad();
  }
}
