// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ExtensionContainer } from "./infrastructure/di/extension-container";
import { FileWatcherService } from "./infrastructure/fs/file-watcher.service";
import { BoardViewPanel } from "./interface/webview/board-view-panel";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "md-planner" is now active!');

  // DIコンテナの初期化
  const container = new ExtensionContainer(context);

  // タスクインデックスの初期化
  await initializeTaskIndex(container);

  // ファイルウォッチャーの設定
  setupFileWatcher(context, container);

  // コマンドの登録
  const openBoardForCurrentFileDisposable = vscode.commands.registerCommand(
    "md-planner.openBoardForCurrentFile",
    async () => {
      const editor = vscode.window.activeTextEditor;

      // Markdownファイルチェック
      if (!editor || editor.document.languageId !== "markdown") {
        vscode.window.showWarningMessage("Please open a Markdown file to view its board.");
        return;
      }

      // ファイルパス取得
      const filePath = editor.document.uri.fsPath;

      // ボードパネル作成or表示
      BoardViewPanel.createOrShow(context, container, filePath);
    },
  );

  context.subscriptions.push(openBoardForCurrentFileDisposable);
}

/**
 * タスクインデックスを初期化
 */
async function initializeTaskIndex(container: ExtensionContainer): Promise<void> {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    console.warn("No workspace folders found. Task index will not be initialized.");
    return;
  }

  try {
    const folders = workspaceFolders.map((folder) => ({
      path: folder.uri.fsPath,
    }));

    await container.taskIndexService.initialize(folders);

    // インデックス構築中の問題を表示
    const issues = container.taskIndexService.getIssues();
    if (issues.length > 0) {
      console.warn(`Found ${issues.length} issues during indexing`);
      for (const issue of issues) {
        console.warn(`  Line ${issue.line}, Column ${issue.column}: ${issue.message}`);
      }
    }
  } catch (error) {
    console.error("Failed to initialize task index:", error);
    vscode.window.showErrorMessage(`Failed to initialize task index: ${error}`);
  }
}

/**
 * ファイルウォッチャーをセットアップ
 */
function setupFileWatcher(
  context: vscode.ExtensionContext,
  container: ExtensionContainer,
): void {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    console.warn("No workspace folders found. File watcher will not be initialized.");
    return;
  }

  // Markdownファイルの変更を監視
  const fileWatcher = new FileWatcherService("**/*.md", async (uri) => {
    try {
      // タスクインデックスを再構築
      const folders = workspaceFolders.map((folder) => ({
        path: folder.uri.fsPath,
      }));

      await container.taskIndexService.initialize(folders);

      // 該当ファイルのボードパネルを更新
      const panel = BoardViewPanel.currentPanels.get(uri.fsPath);
      if (panel) {
        await panel.notifyIndexUpdate();
      }
    } catch (error) {
      console.error("Failed to rebuild task index:", error);
    }
  });

  // ウォッチャーを開始
  const watcherDisposable = fileWatcher.start();
  context.subscriptions.push(watcherDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
