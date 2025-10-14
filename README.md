# MDPlanner - Markdown Task Management for VS Code

[![TypeScript](https://img.shields.io/badge/TypeScript-5.7.3-blue)](https://www.typescriptlang.org/)
[![Tests](https://img.shields.io/badge/Tests-69%2F69%20passing-brightgreen)](./docs/残タスクリスト.md)
[![Build](https://img.shields.io/badge/Build-passing-brightgreen)]()
[![MVP](https://img.shields.io/badge/Status-MVP%20Complete-success)](./MVP-COMPLETION-SUMMARY.md)

**MDPlanner**は、Markdownファイルに埋め込まれたタスクを抽出し、カンバンボードで視覚的に管理できるVS Code拡張機能です。

---

## ✨ 主要機能

### 📋 タスク管理
- Markdownファイルからタスクを自動抽出
- タスク作成・編集・削除
- ステータス管理 (Todo/Doing/Blocked/Done)
- タスク属性 (期日、担当者、プロジェクト、タグ等)

### 🎨 カンバンボード
- ドラッグ&ドロップでタスク移動
- ステータス列でタスクを整理
- リッチなタスクカード表示
- VS Codeテーマ対応

### ⚡ リアルタイム更新
- ファイル変更を自動検知
- タスクインデックスを自動更新
- ボードビューを自動リフレッシュ

### 🔗 エディタ統合
- タスクカードクリックでファイルを開く
- 該当行へ自動ジャンプ
- Markdownファイルへの自動反映

---

## 🚀 使い方

### 🎮 デバッグモードで試す（推奨）

1. **F5キーを押す**
   - 新しいウィンドウ「Extension Development Host」が開きます

2. **ワークスペースを開く**
   - File → Open Folder
   - `test-workspace` または任意のMarkdownフォルダー

3. **ボードビューを開く**
   - `Ctrl+Shift+P` → "MD Planner: Open Board View"
   - または左サイドバーの **MD PLANNER** アイコンをクリック

4. **タスクを操作**
   - ドラッグ&ドロップでステータス変更
   - カードクリックで編集
   - 「+ 新規タスク」で作成

📖 詳細: [USAGE-GUIDE.md](./USAGE-GUIDE.md) | [QUICK-START.md](./QUICK-START.md)

### 📦 本番環境にインストール

```bash
# VSIXパッケージを作成
pnpm run package
pnpm run vsce:package

# インストール
code --install-extension md-planner-0.0.1.vsix
```

---

## 🚀 使い方

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd md-planner

# 依存関係をインストール
pnpm install

# ビルド
pnpm run compile
```

### 開発モード

```bash
# ビルドウォッチモード
pnpm run watch

# テスト実行
pnpm test

# Lintチェック
pnpm run lint
```

### デバッグ

1. VS Codeで`F5`キーを押す
2. 新しいExtension Development Hostウィンドウが開く
3. `Ctrl+Shift+P` → "MD Planner: Open Board View" を実行

---

## 📝 Markdownタスク記法

```markdown
# プロジェクト

## タスクリスト

- [ ] タスクタイトル
  @due(2025-12-31) @assignee(username) @project(MyProject) #tag1 #tag2
```

**対応属性**:
- `@due(YYYY-MM-DD)` - 期日
- `@assignee(name)` - 担当者
- `@project(name)` - プロジェクト
- `@depends(id)` - 依存タスク
- `#tag` - タグ

詳細: [仕様書ver1.md](./docs/仕様書ver1.md)

---

## 🏗 アーキテクチャ

**Clean Architecture**を採用し、テスト可能で拡張性の高い設計を実現：

```
src/
├── domain/          # ドメイン層 (エンティティ、値オブジェクト)
├── application/     # アプリケーション層 (UseCase、DTO)
├── infrastructure/  # インフラ層 (パーサー、ファイルシステム)
└── interface/       # インターフェース層 (Webview、Extension)
```

詳細: [実装計画.md](./docs/実装計画.md)

---

## 📊 品質指標

- ✅ **テスト**: 69/69 passing (100%)
- ✅ **TypeScript型エラー**: 0件
- ✅ **Lintエラー**: 0件
- ✅ **ビルド**: 成功
- ✅ **コードカバレッジ**: 100% (コア機能)

---

## 📚 ドキュメント

### 仕様・設計
- [仕様書ver1.md](./docs/仕様書ver1.md) - 全体仕様
- [実装計画.md](./docs/実装計画.md) - 開発ロードマップ
- [コード規約.md](./docs/コード規約.md) - コーディング標準
- [残タスクリスト.md](./docs/残タスクリスト.md) - 進捗管理

### 完了レポート
- [Iteration 1](./docs/iteration3-completion-report.md) - タスクインデックス
- [Iteration 2](./docs/iteration3-completion-report.md) - CRUD & パッチ
- [Iteration 3](./docs/iteration3-completion-report.md) - ボードビュー基盤
- [Iteration 4](./docs/iteration4-completion-report.md) - Extension統合
- [Iteration 5](./docs/iteration5-completion-report.md) - UI/UX改善
- [Iteration 6](./docs/iteration6-completion-report.md) - リアルタイム更新

### コンポーネント設計
- [VSCodeブリッジ](./docs/コンポーネント設計_VSCodeブリッジ.md)
- [Webview共通UI](./docs/コンポーネント設計_Webview共通UI.md)
- [タスクインデックス](./docs/コンポーネント設計_タスクインデックス.md)
- [パッチサービス](./docs/コンポーネント設計_パッチサービス.md)
- [バリデーション診断](./docs/コンポーネント設計_バリデーション診断.md)

---

## 🔮 今後の予定

### 将来イテレーション (M1-M3)
- バリデーション診断 (Diagnostics API)
- エディタ内機能 (CodeLens, Hover, 補完)
- ガントチャートビュー
- タイムラインビュー
- クエリビュー
- カレンダービュー
- 繰り返しタスク (RRULE)

詳細: [残タスクリスト.md](./docs/残タスクリスト.md)

---

## 🛠 技術スタック

### Frontend
- React 19.0.0
- TypeScript 5.7.3
- Vite 7.1.9
- Zustand 5.0.3
- @dnd-kit 7.0.0

### Backend
- VS Code Extension API 1.96.0
- TypeScript 5.7.3
- Vitest 1.6.1
- Biome 1.9.4

---

## 📄 ライセンス

MIT

---

## 🙏 謝辞

このプロジェクトは、Clean Architecture、Domain-Driven Design、Test-Driven Developmentの原則に基づいて開発されました。

---

**Enjoy MDPlanner! 🎉**
