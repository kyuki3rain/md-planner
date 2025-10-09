# 🎯 MDPlanner 使用方法ガイド

MDPlannerをVS Code拡張機能として使用する方法を3つ紹介します。

---

## 🚀 方法1: デバッグモードで即座に試す（推奨）

開発中やテストに最適な方法です。

### ステップ1: ビルド

```bash
cd /home/koroyasu/program/md-planner
pnpm run compile
```

### ステップ2: VS Codeで開く

プロジェクトをVS Codeで開いている状態で：

1. **F5キーを押す**
2. 新しいウィンドウ「Extension Development Host」が開きます

### ステップ3: ワークスペースを開く

Extension Development Hostウィンドウで：

1. **File → Open Folder**
2. Markdownファイルを含むフォルダーを選択
   - 例: `/home/koroyasu/program/md-planner/test-workspace`

### ステップ4: ボードビューを開く

1. **Ctrl+Shift+P** でコマンドパレットを開く
2. "md planner" と入力
3. **"MD Planner: Open Board View"** を選択

または、左サイドバーの **MD PLANNER** アイコンをクリック

### ステップ5: 使ってみる

- タスクをドラッグ&ドロップ
- タスクをクリックして編集
- 「+ 新規タスク」で作成
- Markdownファイルを編集してリアルタイム更新を確認

---

## 📦 方法2: VSIXパッケージを作成してインストール

実際のVS Codeにインストールして使用する方法です。

### ステップ1: VSIXパッケージを作成

```bash
cd /home/koroyasu/program/md-planner

# ビルド (production mode)
pnpm run package

# VSIXファイルを生成
pnpm run vsce:package
```

これで `md-planner-0.0.1.vsix` ファイルが作成されます。

### ステップ2: VS Codeにインストール

**方法A: コマンドライン**

```bash
code --install-extension md-planner-0.0.1.vsix
```

**方法B: VS Code UI**

1. VS Codeを開く
2. 拡張機能ビュー（Ctrl+Shift+X）を開く
3. 右上の「...」メニューをクリック
4. 「VSIXからのインストール...」を選択
5. `md-planner-0.0.1.vsix` を選択

### ステップ3: VS Codeを再起動

インストール後、VS Codeを再起動します。

### ステップ4: 使用開始

1. Markdownファイルを含むフォルダーを開く
2. **Ctrl+Shift+P** → "MD Planner: Open Board View"
3. ボードビューが開きます

---

## 🔧 方法3: シンボリックリンクで開発モードインストール

開発しながら実際のVS Codeでテストする方法です。

### ステップ1: 拡張機能フォルダーを確認

```bash
# VS Codeの拡張機能フォルダー
ls ~/.vscode/extensions/
```

### ステップ2: シンボリックリンクを作成

```bash
ln -s /home/koroyasu/program/md-planner ~/.vscode/extensions/md-planner-dev
```

### ステップ3: VS Codeを再起動

### ステップ4: 使用開始

通常の拡張機能と同様に使用できます。
コードを変更したら `pnpm run compile` を実行して VS Code を再読み込み（Ctrl+R）します。

---

## 🎮 基本的な使い方

### タスクファイルを準備

```markdown
# プロジェクト

## タスク

- [ ] 最初のタスク
  @due(2025-12-31) @assignee(koroyasu) @project(MDPlanner) #urgent

- [ ] ドキュメントを書く
  @due(2025-11-15) #documentation

- [x] 完了したタスク
  @project(MDPlanner)
```

### ボードビューを開く

**コマンドパレット**:
- `Ctrl+Shift+P` → "MD Planner: Open Board View"

**サイドバー**:
- 左のアクティビティバーの **MD PLANNER** アイコンをクリック

### タスクを操作

1. **ドラッグ&ドロップ**
   - タスクカードをドラッグして別の列に移動
   - Markdownファイルのステータスが自動更新

2. **編集**
   - タスクカードをクリック
   - モーダルで編集
   - 「保存」で反映

3. **新規作成**
   - 「+ 新規タスク」ボタンをクリック
   - フォームに入力して作成

4. **ファイルを開く**
   - タスクカード右上の 📄 アイコンをクリック
   - Markdownファイルが開いて該当行にジャンプ

### リアルタイム更新を確認

1. Markdownファイルを別のエディタで開く
2. タスクを追加・編集
3. ファイルを保存
4. **約300ms後、ボードビューが自動更新される** ✨

---

## 🎨 対応する記法

### タスク形式

```markdown
- [ ] タスクタイトル
  @due(2025-12-31) @assignee(username) @project(ProjectName) #tag1 #tag2
```

### 対応属性

| 属性 | 形式 | 例 |
|------|------|-----|
| 期日 | `@due(YYYY-MM-DD)` | `@due(2025-12-31)` |
| 担当者 | `@assignee(name)` | `@assignee(koroyasu)` |
| プロジェクト | `@project(name)` | `@project(MDPlanner)` |
| 依存 | `@depends(id)` | `@depends(task-001)` |
| タグ | `#tag` | `#urgent #bug` |
| ステータス | `@status(value)` | `@status(doing)` |

### ステータス値

- `todo` - 未着手
- `doing` - 進行中
- `blocked` - ブロック中
- `done` - 完了
- `archived` - アーカイブ

---

## 🐛 トラブルシューティング

### 拡張機能が表示されない

**確認事項**:
1. ビルドが完了しているか: `pnpm run compile`
2. VS Codeを再起動したか
3. ワークスペースフォルダーを開いているか

### タスクが表示されない

**原因**: Markdownファイルが見つからない、または形式が間違っている

**解決方法**:
1. ワークスペースに `.md` ファイルがあるか確認
2. タスク形式が正しいか確認: `- [ ] タスク`
3. 開発者ツール（Ctrl+Shift+I）でエラーを確認

### ドラッグ&ドロップが動作しない

**解決方法**:
1. ブラウザキャッシュをクリア
2. VS Codeを再起動
3. Extension Development Hostで Ctrl+R を押して再読み込み

### ファイル変更が反映されない

**原因**: ファイルウォッチャーのエラー

**解決方法**:
1. 開発者ツール（Ctrl+Shift+I）を開く
2. Console タブでエラーを確認
3. VS Codeを再起動

---

## 📊 パフォーマンス

### ファイルサイズ制限

- 1ファイルあたり推奨最大: 10,000行
- ワークスペース推奨最大: 1,000ファイル

大規模プロジェクトでは、必要なフォルダーのみを開いてください。

### デバウンス時間

ファイル変更検知のデバウンス時間は **300ms** です。
連続した変更は1回の処理にまとめられます。

---

## 🔮 今後の機能

現在MVP（最小実行可能製品）が完成しています。
今後、以下の機能を追加予定です：

- バリデーション診断 (Diagnostics API)
- エディタ内機能 (CodeLens, Hover, 補完)
- ガントチャートビュー
- タイムラインビュー
- カレンダービュー

詳細: [残タスクリスト.md](./docs/残タスクリスト.md)

---

## 📚 ドキュメント

- [QUICK-START.md](./QUICK-START.md) - クイックスタートガイド
- [README.md](./README.md) - プロジェクト概要
- [MVP-COMPLETION-SUMMARY.md](./MVP-COMPLETION-SUMMARY.md) - MVP完成レポート
- [docs/仕様書ver1.md](./docs/仕様書ver1.md) - 完全な仕様
- [docs/コード規約.md](./docs/コード規約.md) - コーディング標準

---

## 💡 ヒント

### 効率的な使い方

1. **キーボードショートカット**
   - ボードビューを開く: `Ctrl+Shift+P` → "MD Planner"
   - ファイルを開く: タスクカードの 📄 アイコン

2. **複数プロジェクト管理**
   - プロジェクトごとにフォルダーを分ける
   - `@project()` 属性でフィルタリング

3. **チーム協業**
   - `@assignee()` で担当者を明記
   - GitでMarkdownファイルを共有
   - 各自がMDPlannerで管理

---

## 🎉 お楽しみください！

MDPlannerはあなたのMarkdownベースのタスク管理を強力にサポートします。

質問やフィードバックがあれば、Issueを作成してください！
