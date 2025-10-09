import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { BoardColumn } from "../types/board";
import { SortableTaskCard } from "./SortableTaskCard";

interface DroppableBoardColumnProps {
  column: BoardColumn;
  onTaskClick?: (taskId: string, filePath: string, lineNumber: number) => void;
}

export function DroppableBoardColumn({ column, onTaskClick }: DroppableBoardColumnProps) {
  const { setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        flex: "1 1 300px",
        minWidth: "300px",
        maxWidth: "400px",
        backgroundColor: "var(--vscode-editor-background)",
        border: "1px solid var(--vscode-panel-border)",
        borderRadius: "4px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      {/* ヘッダー */}
      <div
        style={{
          fontWeight: "600",
          fontSize: "14px",
          marginBottom: "8px",
          color: "var(--vscode-foreground)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{column.label}</span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: "normal",
            color: "var(--vscode-descriptionForeground)",
            backgroundColor: "var(--vscode-badge-background)",
            padding: "2px 8px",
            borderRadius: "10px",
          }}
        >
          {column.tasks.length}
        </span>
      </div>

      {/* タスクリスト */}
      <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", minHeight: "100px" }}>
          {column.tasks.length === 0 ? (
            <div
              style={{
                padding: "20px",
                textAlign: "center",
                color: "var(--vscode-descriptionForeground)",
                fontSize: "12px",
                border: "2px dashed var(--vscode-panel-border)",
                borderRadius: "4px",
                marginTop: "8px",
              }}
            >
              ここにタスクをドロップ
            </div>
          ) : (
            column.tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onClick={() => onTaskClick?.(task.id, task.filePath, task.lineNumber)}
              />
            ))
          )}
        </div>
      </SortableContext>
    </div>
  );
}
