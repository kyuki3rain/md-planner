# Markdownタスク管理拡張 仕様書 v1（コードネーム: **MDPlanner**）

> VS Code拡張を第一候補。ブラウザ拡張とTauri版は将来互換のサブターゲットとして設計。

---

## 0. 決定と理由（結論先出し）

* **プラットフォーム: VS Code拡張**

  * **ローカル完結**: ホスティング不要・社内申請を回避しやすい（.vsixサイドロード可）。
  * **Markdown親和性**: 既存の`.md`運用を崩さず、同一ワークスペースで完結。
  * **豊富なUI手段**: Webviewでボード/ガント/カレンダー/タイムラインを高速実装。エディタ内デコレーション/CodeLens/QuickPickを活用。
  * **拡張性**: LSP/ファイルウォッチャでクロスファイル索引、コマンド/設定/権限も単一境界で管理可能。
* **代替案**

  * **ブラウザ拡張**: File System Access APIは権限付与/持続性が煩雑、社内ポリシーで制限されがち。後方互換APIは維持。
  * **Tauriデスクトップ**: 単独ビューア/ダッシュボードとして再利用可能（Webview資産を流用）。後日パッケージ化を想定。

---

## 1. 目的 / 非目的

### 目的（MVP）

* Markdownで記述したタスクを**自動インデックス化**し、以下のUIで視覚化/編集：

  * **ボード（カンバン）**、**ガントチャート**、**タイムライン**、**カレンダー（月/週/日）**
* タスクは**ファイルが唯一の真実（SSOT）**。拡張は**解析・投影・補助編集**のみ。
* ローカルのみで動作、**ネットワークアクセスは既定で0**。

### 非目的（MVPの外）

* クラウド同期/チーム同時編集/コメントスレッド。
* 完全なPMスイート（バーンダウン、ベロシティ、リリーストラッキング等）。
* 高度な権限/監査ログ。

---

## 2. 主要ユースケース（抜粋）

1. TODO.mdをベースに、今週の**ボード**でWIP管理 → ドラッグ&ドロップで`status`更新。
2. リリース計画を**ガント**で引く → 期日/開始/見積を直接編集 → Markdownへ反映。
3. 期限が近い順に**タイムライン**で俯瞰し、オーバーラップを解消。
4. `project:clean-snap tag:api due<=next.week`で**クエリビュー**を保存 → クイックアクセス。
5. タスク行で`@due(2025-11-01)`と入力 → **インライン補完/バリデーション** → カレンダーに即反映。

---

## 3. データモデル & 記法

### 3.1 タスク行（基本）

* Markdownチェックボックス + 属性ブロック（YAML風の簡易KV）を推奨。

```
- [ ] APIのエンドポイント設計 {id: T-8Y7J1, project: clean-snap, assignee: @yuki,
  start: 2025-10-12, due: 2025-10-16, est: 8h, prio: P2,
  tags: [backend, spec], depends: [T-8Y7GZ], status: todo}
```

* **最小仕様**: `- [ ]`/`- [x]` + 自由テキスト。属性は任意（ガント/ボードは属性なしでも可）。
* **ID**: 初回解析時に**ULID風短縮ID**を自動採番・挿入（設定で自動付与ON/OFF）。

### 3.2 対応属性（MVP）

* `id` (string), `status` (todo|doing|blocked|done|archived)
* `start` (ISO日付 or `today+3d`), `due` (日付), `est` (例: `30m|2h|1d`)
* `prio` (`P0`..`P3`), `assignee` (`@me`既定), `project` (string)
* `tags` (list<string>), `depends` (list<id>), `repeat` (RRULE 文字列)
* `progress` (`0..100%`)

### 3.3 代替短縮記法（任意）

* 関数風：`@due(2025-10-31) @start(2025-10-28) @prio(P1)`
* 時間相対：`@due(today+2w) @start(next.mon)`

### 3.4 ドキュメントスコープ設定（Frontmatter）

```yaml
---
defaults:
  assignee: "@me"
  prio: P2
board:
  columns: [todo, doing, blocked, done]
calendar:
  weekStart: Monday
---
```

---

## 4. ビュー仕様

### 4.1 ボード（カンバン）

* 列= `status`（既定）/任意フィールド（`project`や`tags`）で列定義。
* DnDで`status`/`tags`/`project`を更新 → **元Markdownへ即パッチ**。
* カード: タイトル/期日/見積/担当/進捗/タグ。クイックアクション（完了/ブロック/期日+1d）。

### 4.2 ガントチャート

* 横軸=日/週/月（ズーム）。縦軸=タスク/グループ（`project`やヘッダ階層）。
* `start/due/est`からバー生成。片端ドラッグで編集。
* 依存線（`depends`）を描画（MVPは可視化のみ/自動スケジューリングは次期）。
* クリティカルパスは拡張目標（M+2）。

### 4.3 タイムライン

* 期日/開始日の**スキャッタ+レーン表示**。近似オーバーラップを色/パターンで警告。

### 4.4 カレンダー

* 月/週/日。ドラッグで期間編集、クリックでクイック作成。
* icsエクスポート（ローカルファイル出力）。

### 4.5 クエリビュー

* DSLでフィルタ：

  * 例）`status:todo AND due<=today+7d AND project:clean-snap`
* 保存済みクエリをサイドバーにピン留め。

---

## 5. クエリDSL（MVP）

```
Query := Expr ( (AND|OR) Expr )*
Expr  := Field Op Value | '(' Query ')'
Field := id|status|project|assignee|prio|tag|due|start|est|progress
Op    := : | = | != | <= | < | >= | > | ~
Value := string | date | duration | percent
```

* ショートハンド: `tag:api`は`tags~"api"`。
* 日付演算: `today`, `tomorrow`, `next.mon`, `today+3d`, `startOfWeek+1d` 等。

---

## 6. エディタ内機能

* **シンタックスハイライト**（Semantic tokens）
* **CodeLens**: 依存数/期日/見積の要約、ジャンプリンク。
* **Hover**: 完全属性、相互参照、ガントサムネ。
* **補完**: `@due(`開で日付候補、`project:`で既知値補完。
* **診断**: 不整合（`due<start`、不明ID、循環依存 等）をProblemsへ出力。

---

## 7. アーキテクチャ

```
[VS Code Ext Host]
  ├─ Indexer: ワークスペース全.mdを解析（TextDocument + FS Watcher）
  ├─ TaskModel: 正規化済みグラフ（ID主キー）。CRDTは非採用（単機運用）
  ├─ PatchEngine: ASTマップに基づき最小差分でMarkdownへ書き戻し
  ├─ Commands: create/edit/toggle/move/schedule/query…
  ├─ Markdown Features: Hover/CodeLens/Diagnostics/SemanticTokens
  └─ Webview Panels: Board / Gantt / Calendar / Timeline
        └─ UI: React + Vite（Tailwind任意）
```

* **パーサ**: `markdown-it` + カスタムトークン or 独自軽量パーサ。
* **ASTマッピング**: タスク行の**行番号/カラム範囲**を保持し、パッチ時に精密更新。
* **索引**: メモリ + `.vscode/markboard.index.json`（オプション）。
* **設定**: `markboard.*`名前空間。

---

## 8. 主要コマンド（例）

* `MarkBoard: Open Board / Gantt / Timeline / Calendar`
* `MarkBoard: New Task`（テンプレ/雛形 選択）
* `MarkBoard: Toggle Done` / `Start Doing` / `Block`
* `MarkBoard: Set Due/Start/Estimate/Priority`
* `MarkBoard: Link Dependency to…`
* `MarkBoard: Run Query…`（保存/ピン留め）

---

## 9. 設定（settings.json）

```json
{
  "markboard.autoAssignId": true,
  "markboard.statusColumns": ["todo", "doing", "blocked", "done"],
  "markboard.defaultAssignee": "@me",
  "markboard.index.include": ["**/*.md"],
  "markboard.index.exclude": ["**/node_modules/**", "**/.git/**"],
  "markboard.dates.locale": "ja-JP",
  "markboard.network.enabled": false
}
```

---

## 10. 互換・拡張

* **フィールド拡張**: 未知キーはそのまま保持しUIで編集可能。
* **別記法互換**: [ ] 行末に`(due: …)`等を併記しても解析対象。
* **他ツール連携**: 将来的に`tasks.json`/`ics`/`csv`エクスポート。

---

## 11. 反映ルール（Patch）

* **最小差分**: 既存の空白/句読点/記法を尊重（整形は任意設定）。
* **競合**: 同IDが複数ファイルで異なる場合は警告。`preferNewest`ポリシー設定。
* **改行/折返**: 80/100/120桁など整形ガイドはオプション。

---

## 12. バリデーション & 診断

* 日付形式/演算子の検査、`start<=due`、`est>=0`、未知ID参照、循環依存検出。
* Problemへ集約し、QuickFixで自動修正提案（例: `due = start + est`）。

---

## 13. パフォーマンス

* 初回索引はワークスペース上限を設定（例: 10k行/数百ファイル想定）。
* 増分パース/デバウンス。Webviewは仮想化リスト。

---

## 14. セキュリティ/プライバシー

* 既定で**外部送信なし**（テレメトリOFF）。
* ローカルファイルのみを読み書き。秘密情報を保持しない。

---

## 15. ビルド/配布

* 言語: TypeScript。バンドラ: Vite + esbuild。
* 単体/E2E: Vitest + Playwright（Webview）。
* 配布: VSIX/Marketplace。社内はVSIX配布で申請レス運用を想定。

---

## 16. ロードマップ

* **M0（1–2週）**: タスク解析/インデックス、ボード（列=status）、基本編集、最小パッチ。
* **M1（+2–3週）**: ガント/タイムライン、依存線、診断、保存クエリ。
* **M2（+2週）**: カレンダー、RRULE（繰り返し）、ICS出力。
* **M3（+2週）**: LSP連携、CodeLens/Hover、クリティカルパス（任意）。

---

## 17. Tauri/ブラウザ拡張 互換方針（将来）

* **UI資産再利用**: Webviewを独立パッケージ化（Reactライブラリ化）。
* **Tauri**: ワークスペースフォルダを選択→同一パーサでビューア起動。
* **ブラウザ拡張**: File System Accessでディレクトリ権限を取得→同一UI使用。

---

## 18. 命名候補

* **MarkBoard**, **MDFlow**, **GanttoMD**, **TodoCanvas**, **KirokuTask**。

---

## 19. 未決事項 / リスク

* 日本語の自然言語日付（`再来週の月曜`）対応範囲。
* 巨大リポジトリ（>10kファイル）での初回索引時間。
* 他Markdownツール（Obsidian等）の属性記法との方針差。

---

## 付録A: 例示スニペット

```md
# Sprint 25

- [ ] APIのエンドポイント設計 {id: T-8Y7J1, project: clean-snap, start: 2025-10-12, due: 2025-10-16, est: 8h, prio: P1, status: doing}
- [ ] テストケース作成 {id: T-8Y7K9, project: clean-snap, depends: [T-8Y7J1], est: 6h, prio: P2}
- [x] 仕様レビュー {id: T-8Y7F2, due: 2025-10-11, assignee: @yuki}
```

```md
---
board:
  columns: [todo, doing, blocked, done]
---
```

---

## 付録B: VS Codeコマンド案（仮）

* `MarkBoard: Open Board`
* `MarkBoard: Open Gantt`
* `MarkBoard: Open Timeline`
* `MarkBoard: Open Calendar`
* `MarkBoard: New Task from Template`
* `MarkBoard: Set Due…` / `Set Start…` / `Set Estimate…`
* `MarkBoard: Link Dependency…`
* `MarkBoard: Run Query…`

---

**以上。** この仕様はMVP志向で、Markdown資産の互換性とローカル完結性を最優先にしています。
