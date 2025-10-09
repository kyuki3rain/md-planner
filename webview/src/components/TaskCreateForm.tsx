import { useState } from "react";

interface TaskCreateFormProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (task: {
    title: string;
    filePath: string;
    status?: string;
    assignee?: string;
    dueDate?: string;
    tags?: string[];
    project?: string;
  }) => void;
  defaultFilePath?: string;
}

export function TaskCreateForm({
  isOpen,
  onClose,
  onCreate,
  defaultFilePath = "",
}: TaskCreateFormProps) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("todo");
  const [assignee, setAssignee] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [tags, setTags] = useState("");
  const [project, setProject] = useState("");

  const resetForm = () => {
    setTitle("");
    setStatus("todo");
    setAssignee("");
    setDueDate("");
    setTags("");
    setProject("");
  };

  const handleCreate = () => {
    if (!title || !defaultFilePath) return;

    onCreate({
      title,
      filePath: defaultFilePath, // 常に現在のファイルパスを使用
      status,
      assignee: assignee || undefined,
      dueDate: dueDate || undefined,
      tags: tags ? tags.split(",").map((t) => t.trim()) : undefined,
      project: project || undefined,
    });

    resetForm();
    onClose();
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
      onKeyDown={(e) => e.key === "Escape" && onClose()}
    >
      <div
        style={{
          backgroundColor: "var(--vscode-editor-background)",
          border: "1px solid var(--vscode-panel-border)",
          borderRadius: "6px",
          padding: "24px",
          minWidth: "500px",
          maxWidth: "600px",
          maxHeight: "80vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            fontSize: "18px",
            fontWeight: "600",
            color: "var(--vscode-foreground)",
          }}
        >
          新しいタスクを作成
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* タイトル */}
          <div>
            <label
              htmlFor="task-title"
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "12px",
                fontWeight: "500",
                color: "var(--vscode-foreground)",
              }}
            >
              タイトル *
            </label>
            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="タスクのタイトルを入力"
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border: "1px solid var(--vscode-input-border)",
                borderRadius: "4px",
                fontSize: "13px",
              }}
            />
          </div>

          {/* ステータス */}
          <div>
            <label
              htmlFor="task-status"
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "12px",
                fontWeight: "500",
                color: "var(--vscode-foreground)",
              }}
            >
              ステータス
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border: "1px solid var(--vscode-input-border)",
                borderRadius: "4px",
                fontSize: "13px",
              }}
            >
              <option value="todo">Todo</option>
              <option value="doing">Doing</option>
              <option value="blocked">Blocked</option>
              <option value="done">Done</option>
            </select>
          </div>

          {/* 担当者 */}
          <div>
            <label
              htmlFor="task-assignee"
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "12px",
                fontWeight: "500",
                color: "var(--vscode-foreground)",
              }}
            >
              担当者
            </label>
            <input
              id="task-assignee"
              type="text"
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="@username"
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border: "1px solid var(--vscode-input-border)",
                borderRadius: "4px",
                fontSize: "13px",
              }}
            />
          </div>

          {/* 期日 */}
          <div>
            <label
              htmlFor="task-duedate"
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "12px",
                fontWeight: "500",
                color: "var(--vscode-foreground)",
              }}
            >
              期日
            </label>
            <input
              id="task-duedate"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border: "1px solid var(--vscode-input-border)",
                borderRadius: "4px",
                fontSize: "13px",
              }}
            />
          </div>

          {/* プロジェクト */}
          <div>
            <label
              htmlFor="task-project"
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "12px",
                fontWeight: "500",
                color: "var(--vscode-foreground)",
              }}
            >
              プロジェクト
            </label>
            <input
              id="task-project"
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="project-name"
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border: "1px solid var(--vscode-input-border)",
                borderRadius: "4px",
                fontSize: "13px",
              }}
            />
          </div>

          {/* タグ */}
          <div>
            <label
              htmlFor="task-tags"
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "12px",
                fontWeight: "500",
                color: "var(--vscode-foreground)",
              }}
            >
              タグ (カンマ区切り)
            </label>
            <input
              id="task-tags"
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="feature, bug, docs"
              style={{
                width: "100%",
                padding: "8px",
                backgroundColor: "var(--vscode-input-background)",
                color: "var(--vscode-input-foreground)",
                border: "1px solid var(--vscode-input-border)",
                borderRadius: "4px",
                fontSize: "13px",
              }}
            />
          </div>

          {/* ボタン */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              justifyContent: "flex-end",
              marginTop: "8px",
            }}
          >
            <button
              type="button"
              onClick={handleCancel}
              style={{
                padding: "8px 16px",
                backgroundColor: "var(--vscode-button-secondaryBackground)",
                color: "var(--vscode-button-secondaryForeground)",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={!title || !defaultFilePath}
              style={{
                padding: "8px 16px",
                backgroundColor:
                  title && defaultFilePath
                    ? "var(--vscode-button-background)"
                    : "var(--vscode-button-secondaryBackground)",
                color:
                  title && defaultFilePath
                    ? "var(--vscode-button-foreground)"
                    : "var(--vscode-button-secondaryForeground)",
                border: "none",
                borderRadius: "4px",
                cursor: title && defaultFilePath ? "pointer" : "not-allowed",
                fontSize: "13px",
                opacity: title && defaultFilePath ? 1 : 0.5,
              }}
            >
              作成
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
