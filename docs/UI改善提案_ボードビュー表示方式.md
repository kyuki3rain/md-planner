# UI/UX改善提案 - ボードビュー表示方式の変更

**日付**: 2025-10-09  
**ステータス**: 提案 → 承認済み  
**優先度**: 高

---

## 📋 問題点

### 1. タスクが読み込まれない
**現状**:
- ワークスペース全体を自動スキャンする設計
- 実際には初期状態で何も読み込まれていない
- ユーザーがどのファイルのタスクを見ているのか不明確

**課題**:
- どのMarkdownファイルを対象にするか明確でない
- 大量のファイルがある場合、パフォーマンス問題
- ユーザーの意図と異なるタスクが表示される可能性

### 2. サイドバー表示が狭すぎる
**現状**:
- WebviewViewとしてサイドバーに表示
- カンバンボードには横幅が必要
- ドラッグ&ドロップの操作性が悪い

**課題**:
- タスクカードの情報が見切れる
- 4列のカンバンボードには不適切
- 実用性に欠ける

### 3. アイコンが見づらい
**現状**:
- SVGアイコンが真っ白に見える
- 識別しにくい

---

## 💡 解決策

### Solution 1: Markdown Previewスタイルの起動方式

**コンセプト**: Markdownファイルと紐付いたボードビューを開く

**実装方法**:

1. **エディタタイトルバーにボタン追加**
   - Markdownファイルを開いているとき
   - 右上に「📊 Open Board View」ボタン
   - クリックで現在のファイルのタスクをボードで表示

2. **コンテキストメニュー**
   - Markdownファイルを右クリック
   - 「MD Planner: Open Board View」メニュー項目
   - 選択したファイルのタスクを表示

3. **コマンドパレット**
   - `Ctrl+Shift+P` → "MD Planner: Open Board View for Current File"
   - アクティブなMarkdownファイルのタスクを表示

**メリット**:
- ✅ どのファイルを対象にしているか明確
- ✅ Markdown Previewと同じUXで直感的
- ✅ 不要なファイルをスキャンしない（パフォーマンス向上）
- ✅ 複数ファイルを同時に開いて比較可能

### Solution 2: 中央エディタエリアでの表示

**コンセプト**: WebviewPanelで広い作業スペースを確保

**変更点**:

**Before**: WebviewView（サイドバー）
```typescript
vscode.window.registerWebviewViewProvider()
```

**After**: WebviewPanel（中央エディタエリア）
```typescript
vscode.window.createWebviewPanel()
```

**実装詳細**:

1. **WebviewPanel作成**
   - ViewColumn.One（またはActive）で中央に表示
   - タブとして扱われる
   - 最大化、分割表示が可能

2. **サイドバーは補助的に残す**
   - TreeViewでファイル一覧
   - クリックでボードを開く
   - 全体概要の表示

**メリット**:
- ✅ カンバンボードに十分な横幅
- ✅ タスク情報が見やすい
- ✅ ドラッグ&ドロップの操作性向上
- ✅ 複数ボードを並べて表示可能

### Solution 3: 視認性の高いアイコン

**要件**:
- シンプルで分かりやすい
- ダーク/ライトテーマ両対応
- サイズが小さくても識別可能

**デザイン案**:
- カンバンボード風（3列の縦線 + カード）
- チェックリスト + カレンダー
- MarkdownアイコンM + タスクチェック

---

## 🎯 新しいUX設計

### ユーザーフロー

```
1. Markdownファイルを開く
   ↓
2. エディタ右上の「📊」ボタンをクリック
   OR
   コマンドパレット → "MD Planner: Open Board"
   ↓
3. 中央にボードビューが開く
   - 現在のファイルのタスクを表示
   - カンバン形式（4列）
   ↓
4. タスクをドラッグ&ドロップで管理
   ↓
5. 自動的にMarkdownファイルに反映
```

### 複数ファイルの管理

**パターンA: 個別ファイルごとのボード**
- 各Markdownファイル → 独立したボードビュー
- タブで切り替え
- ファイルとボードが1:1対応

**パターンB: 統合ビュー（将来実装）**
- サイドバーから「Open Workspace Board」
- 全ファイルのタスクを統合表示
- フィルタ機能（ファイル、プロジェクト、担当者）

---

## 📐 実装設計

### 1. package.json の変更

```json
{
  "contributes": {
    "commands": [
      {
        "command": "md-planner.openBoardForCurrentFile",
        "title": "MD Planner: Open Board View",
        "icon": "$(kanban)"
      }
    ],
    "menus": {
      "editor/title": [
        {
          "when": "resourceLangId == markdown",
          "command": "md-planner.openBoardForCurrentFile",
          "group": "navigation"
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

### 2. BoardViewPanel の実装

```typescript
export class BoardViewPanel {
  public static currentPanel: BoardViewPanel | undefined;
  
  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly filePath: string,
    private readonly container: ExtensionContainer,
  ) {
    // WebviewPanel初期化
  }
  
  public static createOrShow(
    context: vscode.ExtensionContext,
    container: ExtensionContainer,
    filePath: string,
  ): BoardViewPanel {
    // 既存パネルがあれば再利用、なければ新規作成
  }
  
  private async loadTasksFromFile(): Promise<void> {
    // 指定ファイルのみをパース
  }
}
```

### 3. コマンド登録

```typescript
// extension.ts
const openBoardCommand = vscode.commands.registerCommand(
  "md-planner.openBoardForCurrentFile",
  async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor || editor.document.languageId !== "markdown") {
      vscode.window.showWarningMessage(
        "Please open a Markdown file first."
      );
      return;
    }
    
    const filePath = editor.document.uri.fsPath;
    BoardViewPanel.createOrShow(context, container, filePath);
  }
);
```

---

## 🔄 移行計画

### Phase 1: WebviewPanelへの移行
- [ ] BoardViewPanel クラス作成
- [ ] WebviewView → WebviewPanel 置き換え
- [ ] 中央表示の動作確認

### Phase 2: ファイル指定機能
- [ ] エディタタイトルバーにボタン追加
- [ ] コマンド登録
- [ ] アクティブファイルの取得
- [ ] 単一ファイルのパース機能

### Phase 3: アイコン改善
- [ ] 新しいSVGアイコンデザイン
- [ ] ダーク/ライトテーマ対応
- [ ] package.jsonにアイコン登録

### Phase 4: サイドバーの再設計（オプション）
- [ ] TreeViewでファイル一覧
- [ ] クリックでボード表示
- [ ] 全体統計の表示

---

## 📊 比較表

| 項目 | Before（WebviewView） | After（WebviewPanel） |
|------|----------------------|----------------------|
| 表示位置 | サイドバー | 中央エディタエリア |
| 横幅 | 狭い（300-400px） | 広い（画面幅に応じる） |
| タブ管理 | なし | あり（複数開ける） |
| 分割表示 | 不可 | 可能 |
| 対象ファイル | 全体（曖昧） | 明示的に指定 |
| 起動方法 | コマンドのみ | ボタン、メニュー、コマンド |

---

## ✅ 期待される効果

### UX改善
- ✅ 直感的な操作（Markdown Previewと同じ）
- ✅ 作業スペースが広い
- ✅ 複数ファイルの並行管理が可能

### パフォーマンス
- ✅ 必要なファイルのみパース
- ✅ 初期読み込みが高速
- ✅ メモリ使用量の削減

### 機能性
- ✅ ファイルとボードの対応が明確
- ✅ ドラッグ&ドロップが快適
- ✅ 視認性の向上

---

## 📝 関連ドキュメント

- [画面設計_ボードビュー.md](./画面設計_ボードビュー.md) - 更新必要
- [コンポーネント設計_VSCodeブリッジ.md](./コンポーネント設計_VSCodeブリッジ.md) - 更新必要
- [実装計画.md](./実装計画.md) - Iteration 7として追加

---

**承認**: ✅ 2025-10-09  
**実装予定**: Iteration 7

---

## 🚀 次のステップ

1. 実装計画.mdを更新（Iteration 7追加）
2. 残タスクリスト.mdを更新
3. BoardViewPanel実装
4. package.json更新
5. アイコン作成
6. テスト & ドキュメント更新
