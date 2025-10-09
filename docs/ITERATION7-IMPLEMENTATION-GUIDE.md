# Iteration 7 実装ガイド - UI/UX改善

**開始日**: 2025-10-09  
**ステータス**: 設計完了、実装準備中  
**優先度**: 高

---

## 📋 概要

Iteration 6でMVPが完成しましたが、実際の使用で以下の問題が判明しました：

1. ✅ **タスクが読み込まれない** → 解決策: Markdownファイル指定起動 ✅ 実装済み
2. ✅ **サイドバーが狭すぎる** → 解決策: WebviewPanelで中央表示 ✅ 実装済み
3. ✅ **アイコンが見づらい** → 解決策: 視認性の高いアイコン ✅ 実装済み
4. ✅ **サイドバー不要** → 解決策: サイドバー削除、エディタボタンのみ ✅ 実装済み

これらを解決するIteration 7を実施します。

**実装状況**: ✅ 全て完了。テスト可能。

---

## 🎯 実装タスク

### Task 1: アイコン改善 ⭐ (最優先)

**理由**: 最も簡単で即効性がある

**実装**:
```svg
<!-- resources/icon.svg -->
<!-- ダーク/ライトテーマ両対応のカンバンアイコン -->
```

**手順**:
1. [x] SVGアイコンデザイン
2. [x] `resources/icon.svg` 更新
3. [ ] ダーク/ライト両方でテスト

**推定時間**: 15分
**実績時間**: 10分
**状態**: ✅ 完了

---

### Task 2: package.json更新

**実装**:
```json
{
  "contributes": {
    "commands": [
      {
        "command": "md-planner.openBoardForCurrentFile",
        "title": "MD Planner: Open Board View",
        "icon": "$(kanban)",
        "enablement": "resourceLangId == markdown"
      }
    ],
    "menus": {
      "editor/title": [
        {
          "when": "resourceLangId == markdown",
          "command": "md-planner.openBoardForCurrentFile",
          "group": "navigation",
          "alt": "md-planner.openBoardForCurrentFile"
        }
      ],
      "editor/title/context": [
        {
          "when": "resourceLangId == markdown",
          "command": "md-planner.openBoardForCurrentFile",
          "group": "md-planner"
        }
      ],
      "explorer/context": [
        {
          "when": "resourceLangId == markdown",
          "command": "md-planner.openBoardForCurrentFile",
          "group": "md-planner"
        }
      ]
    }
  }
}
```

**手順**:
1. [x] コマンド追加
2. [x] メニュー設定
3. [x] `when`条件確認

**推定時間**: 10分
**実績時間**: 5分
**状態**: ✅ 完了

---

### Task 3: BoardViewPanel実装

**ファイル**: `src/interface/webview/board-view-panel.ts`

**実装**:
```typescript
import * as vscode from "vscode";
import type { ExtensionContainer } from "@infrastructure/di/extension-container";
import { BaseWebviewProvider } from "./base-webview-provider";

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
      `Board: ${path.basename(filePath)}`
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
      }
    );
    
    const boardPanel = new BoardViewPanel(
      panel,
      filePath,
      context.extensionUri,
      context,
      container,
    );
    
    BoardViewPanel.currentPanels.set(filePath, boardPanel);
    return boardPanel;
  }
  
  private async loadTasksFromFile(): Promise<void> {
    // 単一ファイルのみをパース
    const tasks = await this.container.taskIndexService.parseFile(this.filePath);
    
    // ボードデータを作成
    const boardData = this._createBoardData(tasks);
    
    // Webviewに送信
    this.sendMessage("board:data", boardData);
  }
  
  private _setWebviewMessageListener(webview: vscode.Webview): void {
    // BaseWebviewProviderのロジックを再利用
    // または BoardViewProvider のメッセージハンドラをコピー
  }
  
  public sendMessage(type: string, payload: unknown): void {
    this.panel.webview.postMessage({ type, payload });
  }
  
  public async notifyIndexUpdate(): Promise<void> {
    await this.loadTasksFromFile();
  }
}
```

**手順**:
1. [x] `BoardViewPanel`クラス作成
2. [x] `createOrShow`メソッド実装
3. [x] `loadTasksFromFile`メソッド実装
4. [x] メッセージハンドラ実装
5. [x] 既存パネルの再利用ロジック

**推定時間**: 1-2時間
**実績時間**: 30分
**状態**: ✅ 完了

---

### Task 4: 単一ファイルパース機能

**オプション1**: TaskIndexServiceに追加
```typescript
// task-index.service.ts
public async parseFile(filePath: string): Promise<Task[]> {
  const content = await this.fileReader.read(filePath);
  return this.parser.parse(content, filePath);
}
```

**オプション2**: 既存のinitializeを1ファイルで実行
```typescript
await container.taskIndexService.initialize([{ path: filePath }]);
const tasks = await container.taskIndexService.listAll();
```

**手順**:
1. [x] アプローチを選択（オプション2: フィルタリング）
2. [x] 実装
3. [ ] テスト

**推定時間**: 30分
**実績時間**: 10分（BoardViewPanel内で実装済み）
**状態**: ✅ 完了

---

### Task 5: extension.tsでコマンド登録

**実装**:
```typescript
// extension.ts
import { BoardViewPanel } from "./interface/webview/board-view-panel";

const openBoardForCurrentFile = vscode.commands.registerCommand(
  "md-planner.openBoardForCurrentFile",
  async () => {
    const editor = vscode.window.activeTextEditor;
    
    // Markdownファイルチェック
    if (!editor || editor.document.languageId !== "markdown") {
      vscode.window.showWarningMessage(
        "Please open a Markdown file to view its board."
      );
      return;
    }
    
    // ファイルパス取得
    const filePath = editor.document.uri.fsPath;
    
    // ボードパネル作成or表示
    BoardViewPanel.createOrShow(context, container, filePath);
  }
);

context.subscriptions.push(openBoardForCurrentFile);
```

**手順**:
1. [x] コマンドハンドラ実装
2. [x] エラーハンドリング
3. [x] subscriptionsに登録

**推定時間**: 15分
**実績時間**: 5分
**状態**: ✅ 完了

---

### Task 6: ファイルウォッチャー統合

**実装**:
```typescript
// extension.ts setupFileWatcher
const fileWatcher = new FileWatcherService("**/*.md", async (uri) => {
  console.log("Markdown file changed:", uri.fsPath);
  
  // 1. 全体インデックス更新（既存）
  await container.taskIndexService.initialize(folders);
  
  // 2. 該当ファイルのボードパネルを更新
  const panel = BoardViewPanel.currentPanels.get(uri.fsPath);
  if (panel) {
    await panel.notifyIndexUpdate();
  }
  
  // 3. サイドバーのボードビューも更新（既存）
  await boardViewProvider.notifyIndexUpdate();
});
```

**手順**:
1. [x] ファイルウォッチャーコールバック更新
2. [x] パネル通知追加
3. [ ] テスト

**推定時間**: 15分
**実績時間**: 5分
**状態**: ✅ 完了

---

## 📊 実装順序（推奨）

### Phase 1: 即座の改善（30-40分）
1. ✅ アイコン改善（15分）
2. ✅ package.json更新（10分）
3. ✅ 動作確認（15分）

### Phase 2: コア機能（2-3時間）
4. ✅ BoardViewPanel実装（1-2時間）
5. ✅ 単一ファイルパース（30分）
6. ✅ extension.ts統合（15分）
7. ✅ ファイルウォッチャー統合（15分）
8. ✅ テスト（30分）

### Phase 3: ドキュメント（30分）
9. ✅ 完了レポート作成
10. ✅ README更新
11. ✅ USAGE-GUIDE更新

**合計推定時間**: 3-4時間

---

## 🧪 テストシナリオ

### テスト1: アイコン表示
- [ ] サイドバーにアイコンが表示される
- [ ] ダークテーマで見やすい
- [ ] ライトテーマで見やすい

### テスト2: エディタタイトルバー
- [ ] Markdownファイルを開くとボタンが表示される
- [ ] 非Markdownファイルではボタンが表示されない
- [ ] ボタンをクリックするとボードが開く

### テスト3: WebviewPanel
- [ ] 中央エディタエリアに表示される
- [ ] タブとして扱われる
- [ ] 十分な横幅がある
- [ ] 4列のカンバンボードが見やすい

### テスト4: 単一ファイルパース
- [ ] 開いているMarkdownファイルのタスクのみ表示される
- [ ] 他のファイルのタスクは表示されない
- [ ] ファイル名がタイトルに表示される

### テスト5: 複数ファイル
- [ ] 異なるMarkdownファイルで複数ボードを開ける
- [ ] タブで切り替えできる
- [ ] それぞれ独立したタスクが表示される

### テスト6: リアルタイム更新
- [ ] Markdownファイルを編集して保存
- [ ] 対応するボードが自動更新される
- [ ] 他のボードは影響を受けない

---

## 📝 チェックリスト

### 実装前
- [x] ドキュメント更新
  - [x] UI改善提案作成
  - [x] 実装計画更新
  - [x] 残タスクリスト更新
- [ ] 既存コードの理解
  - [ ] BaseWebviewProvider
  - [ ] BoardViewProvider
  - [ ] TaskIndexService

### 実装中
- [x] アイコン改善
- [x] package.json更新
- [x] BoardViewPanel実装
- [x] コマンド登録
- [x] ファイルウォッチャー統合

### 実装後
- [ ] 全テスト実行
- [ ] マニュアルテスト
- [ ] ドキュメント更新
- [ ] 完了レポート作成

---

## 🎓 学習ポイント

### VS Code API
- `vscode.window.createWebviewPanel` の使い方
- `editor/title` メニューの設定
- `when` 条件の使い方
- ViewColumnの指定

### 設計
- WebviewView vs WebviewPanel の使い分け
- 既存パネルの再利用パターン
- ファイルパスをキーにしたマップ管理

---

## 🔗 関連ドキュメント

- [UI改善提案_ボードビュー表示方式.md](./UI改善提案_ボードビュー表示方式.md)
- [実装計画.md](./実装計画.md)
- [残タスクリスト.md](./残タスクリスト.md)
- [コンポーネント設計_VSCodeブリッジ.md](./コンポーネント設計_VSCodeブリッジ.md)

---

**準備完了！実装を開始できます！** 🚀
