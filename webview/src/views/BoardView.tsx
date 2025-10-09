import { DndContext, type DragEndEvent, DragOverlay, type DragStartEvent } from "@dnd-kit/core";
import { useCallback, useEffect, useState } from "react";
import { DroppableBoardColumn } from "../components/DroppableBoardColumn";
import { TaskCard } from "../components/TaskCard";
import { TaskCreateForm } from "../components/TaskCreateForm";
import { TaskEditModal } from "../components/TaskEditModal";
import { useExtensionBridge } from "../hooks/use-extension-bridge";
import { useBoardStore } from "../stores/board-store";
import type { BoardColumn, TaskCardData } from "../types/board";

export function BoardView() {
  const { isLoading, columns, currentFilePath, setColumns, setLoading, setCurrentFilePath } = useBoardStore();
  const { sendMessage, subscribe } = useExtensionBridge();

  // モーダル状態
  const [editingTask, setEditingTask] = useState<TaskCardData | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateFormOpen, setIsCreateFormOpen] = useState(false);

  // ドラッグ状態
  const [activeTask, setActiveTask] = useState<TaskCardData | null>(null);

  // Extensionからのボードデータを購読（初期化時に最初に登録）
  useEffect(() => {
    const unsubscribe = subscribe<{ columns: BoardColumn[]; currentFilePath?: string }>("board:data", (payload) => {
      if (payload?.columns) {
        setColumns(payload.columns);
        if (payload.currentFilePath) {
          setCurrentFilePath(payload.currentFilePath);
        }
        setLoading(false);
      }
    });

    return unsubscribe;
  }, [subscribe, setColumns, setLoading, setCurrentFilePath]);

  // 初期化時にデータを要求（ハンドラー登録後）
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    useEffect(() => {
    sendMessage("board:load");
  }, []); // sendMessageを依存配列から除外して1回のみ実行

  // タスククリック（編集モーダルを開く）
  const handleTaskClick = useCallback(
    (taskId: string, filePath: string, lineNumber: number) => {
      // Extensionにファイルを開くよう要求
      sendMessage("task:open", { filePath, lineNumber });

      // 編集モーダルを開く
      const task = columns.flatMap((c) => c.tasks).find((t) => t.id === taskId);
      if (task) {
        setEditingTask(task);
        setIsEditModalOpen(true);
      }
    },
    [sendMessage, columns],
  );

  // ドラッグ開始
  const handleDragStart = (event: DragStartEvent) => {
    const task = columns.flatMap((c) => c.tasks).find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  // ドラッグ終了
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as string;

    // タスクのステータスを更新
    const task = columns.flatMap((c) => c.tasks).find((t) => t.id === taskId);
    if (task && task.status !== newStatus) {
      sendMessage("task:update", {
        id: taskId,
        updates: { status: newStatus },
      });
    }
  };

  // タスク保存
  const handleSaveTask = useCallback(
    (taskId: string, updates: Partial<TaskCardData>) => {
      sendMessage("task:update", {
        id: taskId,
        updates,
      });
    },
    [sendMessage],
  );

  // タスク削除
  const handleDeleteTask = useCallback(
    (taskId: string) => {
      sendMessage("task:delete", { id: taskId });
    },
    [sendMessage],
  );

  // タスク作成
  const handleCreateTask = useCallback(
    (task: {
      title: string;
      filePath: string;
      status?: string;
      assignee?: string;
      dueDate?: string;
      tags?: string[];
      project?: string;
    }) => {
      sendMessage("task:create", task);
    },
    [sendMessage],
  );

  if (isLoading) {
    return (
      <div
        style={{
          padding: "20px",
          textAlign: "center",
          color: "var(--vscode-descriptionForeground)",
        }}
      >
        読み込み中...
      </div>
    );
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div
        style={{
          padding: "16px",
          height: "100%",
          overflow: "auto",
        }}
      >
        {/* ヘッダー */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "18px",
              fontWeight: "600",
              color: "var(--vscode-foreground)",
            }}
          >
            Board View
          </h2>
          <button
            type="button"
            onClick={() => setIsCreateFormOpen(true)}
            style={{
              padding: "6px 12px",
              backgroundColor: "var(--vscode-button-background)",
              color: "var(--vscode-button-foreground)",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "500",
            }}
          >
            + 新規タスク
          </button>
        </div>

        {/* ボード列 */}
        <div
          style={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            paddingBottom: "16px",
          }}
        >
          {columns.map((column) => (
            <DroppableBoardColumn key={column.id} column={column} onTaskClick={handleTaskClick} />
          ))}
        </div>
      </div>

      {/* ドラッグオーバーレイ */}
      <DragOverlay>{activeTask ? <TaskCard task={activeTask} isDragging /> : null}</DragOverlay>

      {/* タスク編集モーダル */}
      <TaskEditModal
        task={editingTask}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        onDelete={handleDeleteTask}
      />

      {/* タスク作成フォーム */}
      <TaskCreateForm
        isOpen={isCreateFormOpen}
        onClose={() => setIsCreateFormOpen(false)}
        onCreate={handleCreateTask}
        defaultFilePath={currentFilePath || undefined}
      />
    </DndContext>
  );
}
