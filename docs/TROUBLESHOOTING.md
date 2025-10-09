# トラブルシューティング

MDPlannerの使用中に発生する可能性のある問題と解決策をまとめています。

---

## ❌ デバッグモードのエラー

### エラー: 無効な problemMatcher 参照: $esbuild-watch

**症状**:
```
エラー: 無効な problemMatcher 参照: $esbuild-watch
```

**原因**:
`.vscode/tasks.json`で参照している`$esbuild-watch`という問題マッチャーが定義されていない。

**解決策**:
✅ **既に修正済み** - `.vscode/tasks.json`を更新しました。

カスタム問題マッチャーを定義：
```json
{
  "problemMatcher": {
    "owner": "esbuild",
    "fileLocation": "relative",
    "pattern": {
      "regexp": "^(.*):(\\d+):(\\d+):\\s+(warning|error):\\s+(.*)$",
      "file": 1,
      "line": 2,
      "column": 3,
      "severity": 4,
      "message": 5
    },
    "background": {
      "activeOnStart": true,
      "beginsPattern": "^\\[watch\\] build started",
      "endsPattern": "^\\[watch\\] build (finished|failed)"
    }
  }
}
```

**再試行**:
1. VS Codeウィンドウを再読み込み: `Ctrl+R` (Extension Development Hostの場合)
2. または VS Code自体を再起動
3. `F5`キーでデバッグを再開

---

## 🔨 ビルドエラー

### Lintエラーが表示される

**症状**:
```
Found 10 errors.
check ✖ Some errors were emitted while running checks.
```

**原因**:
- package.jsonのフォーマット問題
- TaskEditModal.tsxのa11y警告（非ブロッキング）

**解決策**:

**方法1: Lintをスキップしてビルド**（開発中）
```bash
node esbuild.js && pnpm run build:webview
```

**方法2: Lintエラーを修正**
```bash
# 自動修正
pnpm run lint:fix
pnpm run format
```

**方法3: tasks.jsonを使う**
VS Codeで:
1. `Ctrl+Shift+B` でビルドタスク実行
2. または `F5` でデバッグ開始（preLaunchTaskで自動ビルド）

**注意**: a11y警告は非ブロッキングで、拡張機能の動作には影響しません。

---

## 🚫 拡張機能が起動しない

### Extension Development Hostが開かない

**症状**:
`F5`を押しても新しいウィンドウが開かない。

**原因**:
- ビルドが完了していない
- launch.jsonの設定エラー

**解決策**:

1. **ビルドを実行**:
   ```bash
   pnpm run compile
   # または
   node esbuild.js && pnpm run build:webview
   ```

2. **dist/フォルダーを確認**:
   ```bash
   ls -la dist/
   # extension.js が存在することを確認
   ```

3. **VS Codeを再起動**

4. **再度F5を押す**

### 拡張機能がアクティベートされない

**症状**:
Extension Development Hostは開くが、拡張機能が動作しない。

**解決策**:

1. **開発者ツールを開く**: `Ctrl+Shift+I`
2. **Consoleタブを確認**
3. エラーメッセージを探す:
   ```
   ✅ 正常: "md-planner" is now active!
   ❌ エラー: Failed to activate extension
   ```

4. **ワークスペースフォルダーを開く**:
   - File → Open Folder
   - Markdownファイルを含むフォルダーを選択

---

## 📋 ボードビューの問題

### ボードビューが真っ暗で何も表示されない

**症状**:
- ボードビューは開くが、画面が真っ暗
- 何の要素も表示されない
- アイコンも表示されない

**原因**:
- Webviewリソース（JS/CSS）のパスが間違っている
- ビルドファイルが存在しない
- アイコンファイルが不足

**解決策**:

✅ **既に修正済み** - 以下の修正を適用しました：

1. **base-webview-provider.tsのパス修正**
   - `main.js` → `index.js`
   - `main.css` → `index.css`

2. **アイコンファイル作成**
   - `resources/icon.svg` を作成

**再起動手順**:
```bash
# 1. 再ビルド
node esbuild.js

# 2. Extension Development Hostを再読み込み
# Ctrl+R (または VS Codeを再起動)

# 3. ボードビューを開く
# Ctrl+Shift+P → "MD Planner: Open Board View"
```

**開発者ツールで確認**:
1. `Ctrl+Shift+I` で開発者ツールを開く
2. **Console**タブ:
   - エラーメッセージがないか確認
   - 期待されるログ: "md-planner" is now active!
3. **Network**タブ:
   - index.js が 200 (OK) で読み込まれているか
   - 404エラーがないか確認

詳細: [WEBVIEW-FIX.md](./WEBVIEW-FIX.md)

### ボードビューが表示されない

**症状**:
"MD Planner: Open Board View"を実行しても何も表示されない。

**原因**:
- Webviewのビルドが完了していない
- ワークスペースが開かれていない

**解決策**:

1. **Webviewをビルド**:
   ```bash
   pnpm run build:webview
   ```

2. **dist/webview/を確認**:
   ```bash
   ls -la dist/webview/
   # index.html, assets/ が存在することを確認
   ```

3. **ワークスペースフォルダーを開く**:
   - Extension Development Hostで
   - File → Open Folder
   - 任意のフォルダーを選択

4. **コマンドパレットから再実行**:
   - `Ctrl+Shift+P`
   - "MD Planner: Open Board View"

### タスクが表示されない

**症状**:
ボードビューは開くが、タスクが表示されない。

**原因**:
- Markdownファイルが存在しない
- タスクの形式が間違っている
- インデックス構築エラー

**解決策**:

1. **Markdownファイルを確認**:
   ```markdown
   # 正しい形式
   - [ ] タスクタイトル
     @due(2025-12-31) @assignee(username)
   
   # 間違った形式
   - タスクタイトル (チェックボックスなし)
   * [ ] タスクタイトル (ハイフンではない)
   ```

2. **開発者ツールでログを確認**:
   ```
   Ctrl+Shift+I → Console
   
   ✅ 正常: "Task index initialized successfully"
   ❌ エラー: "Failed to initialize task index"
   ```

3. **test-workspaceを使う**:
   - `test-workspace/sample-tasks.md`には正しい形式のサンプルあり
   - このフォルダーで試してみる

---

## 🔄 リアルタイム更新が動作しない

### ファイルを編集してもボードが更新されない

**症状**:
Markdownファイルを保存してもボードビューが更新されない。

**原因**:
- ファイルウォッチャーのエラー
- ワークスペース外のファイルを編集

**解決策**:

1. **開発者ツールでエラーを確認**:
   ```
   Ctrl+Shift+I → Console
   
   期待されるログ:
   "Markdown file changed, rebuilding task index..."
   "Task index rebuilt successfully"
   ```

2. **ワークスペース内のファイルを編集**:
   - 開いているワークスペースフォルダー内のファイルのみ監視される
   - 外部ファイルは監視されない

3. **Extension Development Hostを再読み込み**:
   - `Ctrl+R`
   - または VS Codeを再起動

4. **デバウンス時間を待つ**:
   - ファイル保存後、約300ms待つ
   - 連続して編集する場合、最後の変更から300ms後に更新

---

## 🎨 ドラッグ&ドロップの問題

### カードがドラッグできない

**症状**:
タスクカードをドラッグしようとしても動かない。

**原因**:
- @dnd-kitライブラリのロードエラー
- Webviewの再レンダリング問題

**解決策**:

1. **依存関係を再インストール**:
   ```bash
   pnpm install
   pnpm run build:webview
   ```

2. **ブラウザキャッシュをクリア**:
   - 開発者ツール（Ctrl+Shift+I）
   - Networkタブ → "Disable cache"にチェック

3. **Extension Development Hostを再起動**:
   - `Ctrl+R`

### ドロップしてもステータスが変わらない

**症状**:
カードを別の列にドロップできるが、Markdownファイルが更新されない。

**原因**:
- UpdateTaskUseCaseのエラー
- ファイル書き込み権限の問題

**解決策**:

1. **開発者ツールでエラーを確認**:
   ```
   Ctrl+Shift+I → Console
   
   期待されるログ:
   "Task updated successfully"
   
   エラーの例:
   "Failed to update task"
   ```

2. **ファイルの書き込み権限を確認**:
   ```bash
   ls -la your-file.md
   # 書き込み権限があることを確認
   ```

3. **ファイルが開かれている場合は閉じる**:
   - エディタで編集中のファイルを保存して閉じる
   - ドロップを再試行

---

## 🐛 その他の問題

### メモリ使用量が多い

**症状**:
Extension Development Hostのメモリ使用量が増加し続ける。

**原因**:
- 大量のMarkdownファイルをインデックス化
- ファイルウォッチャーのメモリリーク

**解決策**:

1. **小さいワークスペースでテスト**:
   - test-workspaceフォルダーを使用
   - または少数のMarkdownファイルのみを含むフォルダー

2. **不要なファイルを除外**:
   - `.vscode/settings.json`で除外設定（将来実装予定）

3. **定期的に再起動**:
   - Extension Development Hostを`Ctrl+R`で再読み込み

### パフォーマンスが遅い

**症状**:
ボードビューの動作が遅い、または応答しない。

**原因**:
- 大量のタスクをレンダリング
- インデックス再構築の頻度が高い

**解決策**:

1. **タスク数を制限**:
   - 推奨: 1ファイルあたり100タスク以下
   - 大規模プロジェクトではファイルを分割

2. **デバウンス時間の確認**:
   - ファイル変更後、約300ms待機
   - 連続編集は自動的にまとめられる

3. **Production buildを使用**:
   ```bash
   pnpm run package
   # より最適化されたビルド
   ```

---

## 📚 参考資料

### デバッグに役立つコマンド

```bash
# ビルド状態の確認
ls -la dist/
ls -la dist/webview/

# テスト実行
pnpm test

# 型チェック
pnpm run typecheck

# Lint修正
pnpm run lint:fix

# フォーマット
pnpm run format

# 完全なクリーンビルド
rm -rf dist/
pnpm run compile
```

### ログの確認方法

1. **Extension側のログ**:
   - Extension Development Host
   - `Ctrl+Shift+I` → Console
   - "md-planner"でフィルタ

2. **Webview側のログ**:
   - ボードビュー上で右クリック
   - 「検証」を選択
   - Consoleタブを確認

### よくある質問

**Q: F5で起動できない**
A: `pnpm run compile`を実行してから再試行

**Q: タスクが認識されない**
A: チェックボックス形式 `- [ ]` を確認

**Q: 変更が反映されない**
A: ワークスペース内のファイルか確認、300ms待機

**Q: エラーメッセージが表示されない**
A: 開発者ツール（Ctrl+Shift+I）を開いて確認

---

## 🆘 サポート

問題が解決しない場合:

1. **詳細ドキュメント**:
   - [USAGE-GUIDE.md](./USAGE-GUIDE.md)
   - [QUICK-START.md](./QUICK-START.md)
   - [README.md](./README.md)

2. **開発者ツールのログをコピー**:
   - エラーメッセージ全体をコピー
   - 実行した手順をメモ

3. **Issue作成**:
   - 問題の詳細説明
   - 再現手順
   - エラーログ
   - 環境情報（OS, VS Codeバージョン等）

---

**問題が解決したら、このドキュメントの改善にご協力ください！**
