# Webview表示問題の解決手順

## 問題: ボードビューが真っ暗で何も表示されない

### ✅ 解決済み

以下の2つの問題を修正しました：

1. **Webviewリソースのパス間違い** ✅
   - `main.js` → `index.js`
   - `main.css` → `index.css`

2. **アイコンファイルの不足** ✅
   - `resources/icon.svg` を作成

---

## 🔧 修正内容

### 1. base-webview-provider.ts の修正

**変更前:**
```typescript
const scriptUri = webview.asWebviewUri(
  vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "assets", "main.js"),
);

const styleUri = webview.asWebviewUri(
  vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "assets", "main.css"),
);
```

**変更後:**
```typescript
const scriptUri = webview.asWebviewUri(
  vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "assets", "index.js"),
);

const styleUri = webview.asWebviewUri(
  vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "assets", "index.css"),
);
```

### 2. アイコンファイルの作成

`resources/icon.svg` を作成しました。

---

## 🚀 再起動手順

1. **Extensionを再ビルド**
   ```bash
   cd /home/koroyasu/program/md-planner
   node esbuild.js
   ```

2. **Extension Development Hostを再読み込み**
   - 既に開いている場合: `Ctrl+R`
   - または VS Codeを再起動して `F5`

3. **ボードビューを開く**
   - `Ctrl+Shift+P` → "MD Planner: Open Board View"

4. **確認事項**
   - ✅ アイコンが表示される（青いチェックリストアイコン）
   - ✅ ボードビューに4つの列が表示される
   - ✅ タスクカードが表示される

---

## 🐛 それでも表示されない場合

### 開発者ツールで確認

1. **Extension Development Hostで開発者ツールを開く**
   - `Ctrl+Shift+I`

2. **Consoleタブを確認**
   - エラーメッセージを探す
   - 期待されるログ:
     ```
     "md-planner" is now active!
     Task index initialized successfully
     ```

3. **Networkタブを確認**
   - index.js と index.css が正しく読み込まれているか
   - ステータスが 200 (OK) であることを確認
   - ❌ 404 Not Found の場合 → ビルドが完了していない

### ビルド成果物の確認

```bash
# Webviewのビルドファイルを確認
ls -la dist/webview/assets/

# 以下のファイルが存在するはず:
# - index.css
# - index.js
# - index.html (dist/webview/に)
```

期待される出力:
```
-rw-rw-r-- 1 user user    256 Oct  9 16:46 index.css
-rw-rw-r-- 1 user user 261256 Oct  9 16:46 index.js
```

### Webviewを再ビルド

```bash
# Webviewのみを再ビルド
pnpm run build:webview

# 完全な再ビルド
rm -rf dist/
pnpm run compile
```

---

## 📋 チェックリスト

再起動前に確認:

- [ ] `node esbuild.js` を実行した
- [ ] `dist/extension.js` が存在する
- [ ] `dist/webview/assets/index.js` が存在する
- [ ] `dist/webview/assets/index.css` が存在する
- [ ] `resources/icon.svg` が存在する
- [ ] Extension Development Host を再読み込み (`Ctrl+R`)

全てチェックできたら:

- [ ] `F5` でデバッグ開始
- [ ] ワークスペースを開く
- [ ] `Ctrl+Shift+P` → "MD Planner: Open Board View"
- [ ] ボードビューが表示される ✅

---

## 🎯 正常に動作している状態

### アイコン
- サイドバーに青いチェックリストアイコンが表示される

### ボードビュー
- 4つの列が表示される:
  - Todo
  - Doing  
  - Blocked
  - Done
- 各列に「+ 新規タスク」ボタン
- タスクカードが適切に表示される

### タスクカード
- タイトル
- ファイル情報
- 期日（あれば）
- 担当者（あれば）
- タグ（あれば）
- 📄 アイコン（ファイルを開く）

---

## 💡 よくある原因

### 1. ビルドが古い
**症状**: コードを変更したが反映されない

**解決策**:
```bash
node esbuild.js && pnpm run build:webview
```

### 2. キャッシュの問題
**症状**: 何度再ビルドしても変わらない

**解決策**:
```bash
# 完全にクリーン
rm -rf dist/
rm -rf webview/dist/
pnpm run compile
```

### 3. VS Codeの再起動が必要
**症状**: `Ctrl+R` で再読み込みしても変わらない

**解決策**:
- VS Code自体を完全に閉じる
- 再度開いて `F5`

---

## 📚 関連ドキュメント

- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 包括的なトラブルシューティング
- [USAGE-GUIDE.md](./USAGE-GUIDE.md) - 使用方法ガイド
- [QUICK-START.md](./QUICK-START.md) - クイックスタート

---

**この問題は修正済みです。上記の手順で解決できるはずです！**
