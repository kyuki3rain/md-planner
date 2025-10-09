# Webview共通UIコンポーネント詳細設計

## 1. 目的
- 各ビューに共通するUI基盤 (テーマ、データフェッチ、状態管理) を統一し再利用性を高める。

## 2. アーキテクチャ
- フロントエンド: React + Zustand + Vite。
- ルート構成: `AppShell` → `ViewRouter` → ビュー固有コンポーネント。
- `ServiceWorker` (optional) でキャッシュ、ただし初期MVPでは未使用。

## 3. コアコンポーネント
- `AppShell`: グローバルテーマ、通知、ダイアログ、モーダルポータルを提供。
- `ViewRouter`: `viewId`に応じて`BoardView`, `GanttView`, `TimelineView`, `CalendarView`, `QueryView`を切替。
- `Toolbar`: ビュー共通の右上アクション (検索、ヘルプ、設定)。
- `FilterBar`: フィルタトークン編集UI。DSLと連動。
- `TaskEditorModal`: 新規作成・編集兼用。フォームステップ、バリデーション、ライブプレビューを提供。
- `TaskDeleteDialog`: 削除確認ダイアログ。繰り返しタスクや依存を考慮した警告を表示。
- `ToastCenter`: 成功/失敗メッセージを表示。
- `LoadingOverlay`: サービス初期化中のスピナー。

## 4. データ取得
- `useExtensionBridge`: Webviewメッセージ通信のフック。
  - `sendMessage(type, payload)`で拡張へ送信。
  - `useSubscription(type, handler)`でイベント購読。
- `useTaskQuery`: DSL/フィルタから結果を取得する共通フック。
- `useSettings`: 拡張から受け取った設定をReact Contextで提供。

## 5. 状態管理
- Zustandストアをビュー毎に定義し、共通状態は`AppStore`に集約。
- `AppStore`項目: `isInitialized`, `activeView`, `theme`, `notifications`。
- ストア間通信はイベントエミッタ(`EventEmitter3`)で実装。

## 6. テーマ/スタイル
- Tailwindベースのユーティリティクラス。VS Codeテーマに同期。
- `ThemeAdapter`が`message:theme`イベントを受け取りCSS変数を更新。
- ダーク/ライトモード + ハイコントラストに対応。

## 7. エラーハンドリング
- グローバルエラー境界`ErrorBoundary`で致命的エラー時に再読み込みボタン。
- APIエラーは`ToastCenter` + `ErrorPanel`に詳細を表示。

## 8. テスト戦略
- Storybookでコンポーネント単体の外観確認。
- Vitest + React Testing Libraryでフック/状態管理テスト。
- PlaywrightでWebviewのエンドツーエンドテスト (主要ビューごと)。

## 9. パフォーマンス最適化
- 動的インポート: 重いビュー (Gantt/Calendar) を遅延読み込み。
- メモ化: `TaskCard`, `TaskRow`などリスト表示コンポーネントに`React.memo`を適用。
- 仮想リスト: `react-window`で大量データ時のレンダリングを抑制。

## 10. タスク編集フロー
- `TaskEditorModal`は`useTaskEditor`フックで制御。モード(`create`|`edit`)と初期値、対象ビューを渡す。
- 送信時は`extensionBridge.sendMessage('task:mutate', payload)`または`'task:create'/'task:delete'`を呼び出し、結果メッセージで成功/失敗を判定。
- バリデーションエラーはモーダル内に表示し、同時に`ToastCenter`へも通知。
- 削除フローは`TaskDeleteDialog`→`task:delete`→`ToastCenter`でUndoリンクを提供し、Undoは`task:create`(with snapshot)で実装。
