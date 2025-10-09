# MDPlanner クイックスタートガイド

このガイドでは、MDPlannerを実際に使用する方法を説明します。

---

## 🚀 デバッグモードで実行（開発中）

### 準備

1. **依存関係のインストール**
   ```bash
   cd /home/koroyasu/program/md-planner
   pnpm install
   ```

2. **ビルド**
   ```bash
   pnpm run compile
   ```

### 実行

1. **VS Codeでプロジェクトを開く**
   ```bash
   code .
   ```

2. **デバッグを開始**
   - `F5` キーを押す
   - または、左サイドバー「実行とデバッグ」→「実行」ボタン

3. **Extension Development Host ウィンドウが開く**
   - 新しいVS Codeウィンドウが起動します
   - タイトルバーに `[Extension Development Host]` と表示されます

4. **ワークスペースを開く**
   - File → Open Folder
   - `test-workspace` フォルダーを選択
   - または任意のMarkdownファイルを含むフォルダー

---

## 📂 テストワークスペースの準備

`test-workspace/` フォルダーにサンプルMarkdownファイルが用意されています：

```
test-workspace/
└── sample-tasks.md    # サンプルタスクファイル
```

または、独自のMarkdownファイルを作成：

```markdown
# プロジェクト

## タスク

- [ ] タスク1
  @due(2025-12-31) @assignee(username) @project(MyProject) #tag

- [ ] タスク2
  @due(2025-11-15) #important

- [x] 完了したタスク
```

---

## 🎯 MDPlannerを開く

### 方法1: コマンドパレット

1. `Ctrl+Shift+P` (Mac: `Cmd+Shift+P`)
2. "md planner" と入力
3. **"MD Planner: Open Board View"** を選択

### 方法2: サイドバー

1. 左のアクティビティバーに **MD PLANNER** アイコンが表示される
2. アイコンをクリック
3. ボードビューが開く

---

## ✨ 基本的な使い方

### 1. タスクを表示

ボードビューが開くと、4つの列が表示されます：

- **Todo** - 未着手タスク
- **Doing** - 進行中タスク
- **Blocked** - ブロック中タスク
- **Done** - 完了タスク

Markdownファイル内のタスクが自動的に読み込まれます。

### 2. タスクをドラッグ&ドロップ

- タスクカードをマウスでドラッグ
- 別の列にドロップ
- **自動的にMarkdownファイルのステータスが更新される**

例：
```markdown
# Before
- [ ] タスク1

# After (Doingに移動)
- [ ] タスク1 @status(doing)
```

### 3. タスクを編集

1. タスクカードをクリック
2. 編集モーダルが開く
3. 以下を編集可能：
   - タイトル
   - ステータス
   - 担当者
   - 期日
   - プロジェクト
   - タグ
4. 「保存」ボタンをクリック
5. **Markdownファイルが自動更新される**

### 4. 新規タスクを作成

1. 任意の列の **「+ 新規タスク」** ボタンをクリック
2. フォームに入力：
   - タイトル（必須）
   - ファイルパス（必須）
   - その他の属性
3. 「作成」ボタンをクリック
4. **指定したMarkdownファイルにタスクが追加される**

### 5. タスクをファイルで開く

1. タスクカード右上の **📄** アイコンをクリック
2. Markdownファイルがエディタで開く
3. **該当するタスクの行に自動ジャンプ**

---

## 🔄 リアルタイム更新

MDPlannerは自動的にファイル変更を検知します：

1. Markdownファイルを直接編集
   ```markdown
   - [ ] 新しいタスク @due(2025-12-01)
   ```

2. ファイルを保存 (`Ctrl+S`)

3. **約300ms後、ボードビューが自動的に更新される**✨

変更検知の対象：
- タスクの追加
- タスクの編集
- タスクの削除
- ステータスの変更
- 属性の変更

---

## 🎨 カスタマイズ

### VS Codeテーマ対応

ボードビューはVS Codeのテーマに自動的に適応します：

- ダークテーマ → ダークUIで表示
- ライトテーマ → ライトUIで表示

---

## 🐛 トラブルシューティング

### タスクが表示されない

**原因**: ワークスペースフォルダーが開かれていない

**解決方法**:
1. File → Open Folder
2. Markdownファイルを含むフォルダーを選択

### ボードビューが開かない

**原因**: ビルドが完了していない

**解決方法**:
```bash
pnpm run compile
```

### ファイル変更が反映されない

**原因**: ファイルウォッチャーのエラー

**解決方法**:
1. 開発者ツールを開く: `Ctrl+Shift+I`
2. Console タブでエラーを確認
3. Extension Development Host を再起動 (`Ctrl+R`)

### タスクの形式が認識されない

**正しい形式**:
```markdown
- [ ] タスクタイトル
  @due(YYYY-MM-DD) @assignee(name) @project(name) #tag
```

**注意点**:
- チェックボックスは `- [ ]` または `- [x]`
- 属性は次の行にインデント
- 日付形式は `YYYY-MM-DD`

---

## 📖 対応する属性

| 属性 | 形式 | 例 |
|------|------|-----|
| 期日 | `@due(YYYY-MM-DD)` | `@due(2025-12-31)` |
| 担当者 | `@assignee(name)` | `@assignee(koroyasu)` |
| プロジェクト | `@project(name)` | `@project(MDPlanner)` |
| 依存タスク | `@depends(id)` | `@depends(task-001)` |
| タグ | `#tag` | `#urgent #bug` |
| ステータス | `@status(value)` | `@status(doing)` |

詳細: [仕様書ver1.md](./docs/仕様書ver1.md)

---

## 🎓 次のステップ

### 実際のプロジェクトで使う

1. プロジェクトフォルダーを開く
2. 既存のMarkdownファイルにタスクを追加
3. ボードビューで管理

### パッケージ化してインストール

本番環境で使用する場合：

```bash
# VSIXファイルを生成
pnpm run package

# インストール
code --install-extension md-planner-0.0.1.vsix
```

### 詳細ドキュメント

- [仕様書ver1.md](./docs/仕様書ver1.md) - 完全な仕様
- [コード規約.md](./docs/コード規約.md) - コーディング標準
- [MVP-COMPLETION-SUMMARY.md](./MVP-COMPLETION-SUMMARY.md) - 機能一覧

---

## 💡 便利な使い方

### プロジェクト管理

```markdown
# プロジェクト名

## スプリント1

- [ ] 機能A実装 @due(2025-10-15) @assignee(dev1) #backend
- [ ] 機能B実装 @due(2025-10-15) @assignee(dev2) #frontend

## バグ修正

- [ ] バグ#123 @due(2025-10-10) @assignee(dev1) #bug #critical
```

### チーム管理

```markdown
# チームタスク

## @assignee(alice)のタスク

- [ ] レビュー @due(2025-10-12) #review
- [ ] ドキュメント更新 @due(2025-10-14) #docs

## @assignee(bob)のタスク

- [ ] テスト作成 @due(2025-10-13) #testing
```

### 個人タスク管理

```markdown
# TODO

- [ ] メール返信 @due(2025-10-09) #urgent
- [ ] レポート作成 @due(2025-10-15) @project(Work)
- [ ] 本を読む @project(Personal) #learning
```

---

## 🎉 楽しんでください！

MDPlannerはあなたのMarkdownベースのタスク管理を強力にサポートします。

質問やフィードバックがあれば、Issueを作成してください！
