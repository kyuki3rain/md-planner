import { create } from "zustand";
import type { BoardColumn } from "../types/board";

/**
 * ボードビューのグローバル状態
 */
export interface BoardState {
  /** アクティブなビュー */
  activeView: string;
  /** ローディング中かどうか */
  isLoading: boolean;
  /** グループ化の基準となるフィールド */
  groupBy: string;
  /** フィルタ条件 */
  filter: string;
  /** ボードの列データ */
  columns: BoardColumn[];
  /** 現在表示中のファイルパス */
  currentFilePath: string | null;

  /** ビューを切り替える */
  setActiveView: (view: string) => void;
  /** ローディング状態を設定 */
  setLoading: (loading: boolean) => void;
  /** グループ化基準を変更 */
  setGroupBy: (field: string) => void;
  /** フィルタを変更 */
  setFilter: (filter: string) => void;
  /** 列データを設定 */
  setColumns: (columns: BoardColumn[]) => void;
  /** 現在のファイルパスを設定 */
  setCurrentFilePath: (filePath: string | null) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  activeView: "board",
  isLoading: true,
  groupBy: "status",
  filter: "",
  columns: [],
  currentFilePath: null,

  setActiveView: (view) => set({ activeView: view }),
  setLoading: (loading) => set({ isLoading: loading }),
  setGroupBy: (field) => set({ groupBy: field }),
  setFilter: (filter) => set({ filter }),
  setColumns: (columns) => set({ columns }),
  setCurrentFilePath: (filePath) => set({ currentFilePath: filePath }),
}));
