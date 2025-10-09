import type { TaskCardData } from "../types/board";

interface TaskCardProps {
  task: TaskCardData;
  onClick?: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging = false }: TaskCardProps) {
  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onClick?.();
        }
      }}
      style={{
        padding: "12px",
        backgroundColor: isDragging
          ? "var(--vscode-list-hoverBackground)"
          : "var(--vscode-sideBar-background)",
        border: "1px solid var(--vscode-panel-border)",
        borderRadius: "4px",
        cursor: "pointer",
        transition: "all 0.2s",
        opacity: isDragging ? 0.5 : 1,
      }}
    >
      {/* タイトル */}
      <div
        style={{
          fontWeight: "500",
          marginBottom: "8px",
          color: "var(--vscode-foreground)",
          fontSize: "13px",
        }}
      >
        {task.title}
      </div>

      {/* メタデータセクション */}
      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
        {/* 期日 */}
        {task.dueDate && (
          <div
            style={{
              fontSize: "11px",
              color: "var(--vscode-descriptionForeground)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>📅</span>
            <span>{task.dueDate}</span>
          </div>
        )}

        {/* 担当者 */}
        {task.assignee && (
          <div
            style={{
              fontSize: "11px",
              color: "var(--vscode-descriptionForeground)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>👤</span>
            <span>{task.assignee}</span>
          </div>
        )}

        {/* プロジェクト */}
        {task.project && (
          <div
            style={{
              fontSize: "11px",
              color: "var(--vscode-descriptionForeground)",
              display: "flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <span>📁</span>
            <span>{task.project}</span>
          </div>
        )}

        {/* タグ */}
        {task.tags && task.tags.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "4px",
              flexWrap: "wrap",
              marginTop: "4px",
            }}
          >
            {task.tags.map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: "10px",
                  padding: "2px 6px",
                  backgroundColor: "var(--vscode-badge-background)",
                  color: "var(--vscode-badge-foreground)",
                  borderRadius: "3px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* フッター: ファイル情報 */}
      <div
        style={{
          marginTop: "8px",
          paddingTop: "8px",
          borderTop: "1px solid var(--vscode-panel-border)",
          fontSize: "10px",
          color: "var(--vscode-descriptionForeground)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ opacity: 0.7 }}>
          {task.filePath.split("/").pop()} : {task.lineNumber}
        </span>
        <span style={{ opacity: 0.5 }}>{task.id}</span>
      </div>
    </div>
  );
}
