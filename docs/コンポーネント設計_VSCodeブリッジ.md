# VS Codeブリッジコンポーネント詳細設計

## 1. 目的
- VS Code拡張のエントリポイントとして、Webview、コマンド、イベント処理の橋渡しを行う。

## 2. 構成
- `extension.ts`: エクスポート`activate`, `deactivate`。サービス初期化。
- `CommandRegistry`: コマンドIDとハンドラの登録。
- `WebviewManager`: 各ビュー用Webviewパネルの生成/再利用。
- `MessageRouter`: Webview <-> Extension間メッセージ通信の振り分け。
- `StateRepository`: VS Code `Memento`/`workspaceState`へのアクセスラッパー。
- `StatusBarController`: ステータスバー項目を管理。

## 3. 初期化シーケンス
1. `activate(context)` → `bootstrap()`呼び出し。
2. `ServiceContainer`を生成し、`TaskIndexService`, `PatchService`, `SettingsService`を初期化。
3. `CommandRegistry.register()`で仕様書付録BのコマンドをVS Codeへ登録。
4. 必要に応じてWebviewプリロード (Boardビューは最初の呼び出し時に作成)。
5. ファイルウォッチャを起動し、インデックス初回同期を開始。

## 4. Webview管理
- `WebviewManager`が`getPanel(viewId)`で既存パネルを返却、未作成なら新規作成。
- `resolveWebviewView`でサイドバー(WebviewView)を提供。
- Webviewに与える初期HTMLはViteビルド成果物を読み込み。Content Security Policyを設定。

## 5. メッセージプロトコル
- 共通インターフェース:
```
type ExtensionMessage =
  | { type: 'index:update', payload: TaskChanges }
  | { type: 'settings:update', payload: Settings }
  | { type: 'command:execute', payload: CommandRequest }
  | { type: 'patch:result', payload: PatchResult }
  | { type: 'task:created', payload: TaskSummary }
  | { type: 'task:deleted', payload: { id: string, fileUri: string } };

type WebviewMessage =
  | { type: 'view:ready', viewId: string }
  | { type: 'query:run', payload: QueryOptions }
  | { type: 'task:mutate', payload: TaskMutation }
  | { type: 'task:create', payload: NewTaskPayload }
  | { type: 'task:delete', payload: { id: string } }
  | { type: 'ui:event', payload: UIEvent };
```
- `MessageRouter`がtypeベースでハンドラに振り分け。
  - `'task:create'` → `PatchService.createTask`を実行し、結果を`task:created`で返却。
  - `'task:mutate'` → `PatchService.applyTaskMutation`。
  - `'task:delete'` → `PatchService.deleteTask`を呼び出し、成功時に`task:deleted`を送信。

## 6. コマンド連携
- `CommandRegistry`が以下を提供:
  - `MarkBoard: Open Board`: `WebviewManager.show('board')`
  - `...` (仕様書付録Bに準拠)
- クイックピックや入力ボックスを用いたコマンドは`CommandContext`でサービスへ依存注入。

## 7. 設定管理
- `SettingsService`: `workspace.getConfiguration('markboard')`を監視。
- 更新時にWebviewへ`settings:update`をブロードキャスト。
- 初期値は仕様書9章の設定を既定値として読み込み。

## 8. エラー監視
- 重大エラーは`window.showErrorMessage`でユーザー通知。
- ログは`OutputChannel` (`MDPlanner`) を用意し、`trace`レベルも出力可能に。

## 9. テスト観点
- `CommandRegistry`登録テスト (ID存在、アクション呼び出し)。
- Webviewメッセージ往復の統合テスト (PlaywrightでUI→メッセージ→レスポンス)。
- 設定変更 → Webview更新の結合テスト。
