import type { BoardColumn } from "../types/board";

interface BoardColumnProps {
  column: BoardColumn;
  onTaskClick?: (taskId: string) => void;
}

export function BoardColumnComponent({ column, onTaskClick }: BoardColumnProps) {
  return (
    <div
      style={{
        flex: "1 1 300px",
        minWidth: "300px",
        backgroundColor: "var(--vscode-editor-background)",
        border: "1px solid var(--vscode-panel-border)",
        borderRadius: "4px",
        padding: "12px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div
        style={{
          fontWeight: "600",
          fontSize: "14px",
          marginBottom: "8px",
          color: "var(--vscode-foreground)",
        }}
      >
        {column.label} ({column.tasks.length})
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {column.tasks.length === 0 ? (
          <div
            style={{
              padding: "20px",
              textAlign: "center",
              color: "var(--vscode-descriptionForeground)",
              fontSize: "12px",
            }}
          >
            タスクがありません
          </div>
        ) : (
          column.tasks.map((task) => (
            <div
              key={task.id}
              onClick={() => onTaskClick?.(task.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  onTaskClick?.(task.id);
                }
              }}
              style={{
                padding: "12px",
                backgroundColor: "var(--vscode-sideBar-background)",
                border: "1px solid var(--vscode-panel-border)",
                borderRadius: "4px",
                cursor: "pointer",
                transition: "background-color 0.2s",
              }}
            >
              <div
                style={{
                  fontWeight: "500",
                  marginBottom: "4px",
                  color: "var(--vscode-foreground)",
                }}
              >
                {task.title}
              </div>

              {task.dueDate && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--vscode-descriptionForeground)",
                    marginTop: "4px",
                  }}
                >
                  📅 {task.dueDate}
                </div>
              )}

              {task.assignee && (
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--vscode-descriptionForeground)",
                    marginTop: "4px",
                  }}
                >
                  👤 {task.assignee}
                </div>
              )}

              {task.tags && task.tags.length > 0 && (
                <div
                  style={{
                    marginTop: "8px",
                    display: "flex",
                    gap: "4px",
                    flexWrap: "wrap",
                  }}
                >
                  {task.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        padding: "2px 6px",
                        backgroundColor: "var(--vscode-badge-background)",
                        color: "var(--vscode-badge-foreground)",
                        fontSize: "10px",
                        borderRadius: "3px",
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
