/**
 * タスクカードの表示データ
 */
export interface TaskCardData {
  id: string;
  title: string;
  status: string;
  dueDate?: string;
  assignee?: string;
  tags?: string[];
  progress?: number;
  project?: string;
  filePath: string;
  lineNumber: number;
}

/**
 * ボードの列定義
 */
export interface BoardColumn {
  id: string;
  label: string;
  tasks: TaskCardData[];
}
