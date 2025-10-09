import * as vscode from "vscode";

/**
 * ファイル変更時のコールバック関数型
 */
export type FileChangeCallback = (uri: vscode.Uri) => void | Promise<void>;

/**
 * ファイルウォッチャーサービス
 * Markdownファイルの変更を監視し、コールバックを実行する
 */
export class FileWatcherService {
  private watcher: vscode.FileSystemWatcher | null = null;
  private debounceTimer: NodeJS.Timeout | null = null;
  private readonly debounceDelay = 300; // ms
  private pendingChanges = new Set<string>();

  constructor(
    private readonly pattern: string,
    private readonly onChange: FileChangeCallback,
  ) {}

  /**
   * ファイルウォッチャーを開始
   */
  public start(): vscode.Disposable {
    // **/*.md パターンでMarkdownファイルを監視
    this.watcher = vscode.workspace.createFileSystemWatcher(this.pattern);

    // ファイル作成時
    const onCreateDisposable = this.watcher.onDidCreate((uri) => {
      this.scheduleUpdate(uri);
    });

    // ファイル変更時
    const onChangeDisposable = this.watcher.onDidChange((uri) => {
      this.scheduleUpdate(uri);
    });

    // ファイル削除時
    const onDeleteDisposable = this.watcher.onDidDelete((uri) => {
      this.scheduleUpdate(uri);
    });

    // クリーンアップ用のDisposable
    return vscode.Disposable.from(
      this.watcher,
      onCreateDisposable,
      onChangeDisposable,
      onDeleteDisposable,
      {
        dispose: () => {
          if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
          }
        },
      },
    );
  }

  /**
   * デバウンス処理付きで更新をスケジュール
   */
  private scheduleUpdate(uri: vscode.Uri): void {
    // 変更を記録
    this.pendingChanges.add(uri.fsPath);

    // 既存のタイマーをキャンセル
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    // 新しいタイマーをセット
    this.debounceTimer = setTimeout(async () => {
      const changes = Array.from(this.pendingChanges);
      this.pendingChanges.clear();

      // 最後の変更のみを処理（複数ファイル対応も可能）
      if (changes.length > 0) {
        const lastChange = vscode.Uri.file(changes[changes.length - 1]);
        await this.onChange(lastChange);
      }

      this.debounceTimer = null;
    }, this.debounceDelay);
  }

  /**
   * ウォッチャーを停止
   */
  public stop(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = null;
    }
    this.pendingChanges.clear();
  }
}
