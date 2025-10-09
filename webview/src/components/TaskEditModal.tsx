import { useCallback, useEffect, useState } from "react";
import type { TaskCardData } from "../types/board";

interface TaskEditModalProps {
  task: TaskCardData | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskId: string, updates: Partial<TaskCardData>) => void;
  onDelete?: (taskId: string) => void;
}

export function TaskEditModal({ task, isOpen, onClose, onSave, onDelete }: TaskEditModalProps) {
  const [title, setTitle] = useState(task?.title || "");
  const [status, setStatus] = useState(task?.status || "todo");
  const [assignee, setAssignee] = useState(task?.assignee || "");
  const [dueDate, setDueDate] = useState(task?.dueDate || "");
  const [tags, setTags] = useState(task?.tags?.join(", ") || "");
  const [project, setProject] = useState(task?.project || "");

  // taskが変更されたら状態を更新
  const resetForm = useCallback(() => {
    if (task) {
      setTitle(task.title);
      setStatus(task.status);
      setAssignee(task.assignee || "");
      setDueDate(task.dueDate || "");
      setTags(task.tags?.join(", ") || "");
      setProject(task.project || "");
    }
  }, [task]);

  useEffect(() => {
    if (isOpen && task) {
      resetForm();
    }
  }, [isOpen, task, resetForm]);

  const handleSave = () => {
    if (!task) return;

    const updates: Partial<TaskCardData> = {
      title,
      status,
      assignee: assignee || undefined,
      dueDate: dueDate || undefined,
      tags: tags ? tags.split(",").map((t) => t.trim()) : undefined,
      project: project || undefined,
    };

    onSave(task.id, updates);
    onClose();
  };

  const handleDelete = () => {
    if (!task) return;
    if (confirm(`タスク「${task.title}」を削除しますか?`)) {
      onDelete?.(task.id);
      onClose();
    }
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  if (!isOpen || !task) {
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
      >
        <h2
          style={{
            margin: "0 0 20px 0",
            fontSize: "18px",
            fontWeight: "600",
            color: "var(--vscode-foreground)",
          }}
        >
          タスクを編集
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* タイトル */}
          <div>
            <label
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
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* 担当者 */}
          <div>
            <label
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

          {/* ファイル情報 (読み取り専用) */}
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "4px",
                fontSize: "12px",
                fontWeight: "500",
                color: "var(--vscode-foreground)",
              }}
            >
              ファイル
            </label>
            <div
              style={{
                padding: "8px",
                backgroundColor: "var(--vscode-editor-background)",
                border: "1px solid var(--vscode-panel-border)",
                borderRadius: "4px",
                fontSize: "12px",
                color: "var(--vscode-descriptionForeground)",
              }}
            >
              {task.filePath} : {task.lineNumber}
            </div>
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
            {onDelete && (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  padding: "8px 16px",
                  backgroundColor: "var(--vscode-button-secondaryBackground)",
                  color: "var(--vscode-button-secondaryForeground)",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontSize: "13px",
                  marginRight: "auto",
                }}
              >
                削除
              </button>
            )}
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
              onClick={handleSave}
              disabled={!title}
              style={{
                padding: "8px 16px",
                backgroundColor: title
                  ? "var(--vscode-button-background)"
                  : "var(--vscode-button-secondaryBackground)",
                color: title
                  ? "var(--vscode-button-foreground)"
                  : "var(--vscode-button-secondaryForeground)",
                border: "none",
                borderRadius: "4px",
                cursor: title ? "pointer" : "not-allowed",
                fontSize: "13px",
                opacity: title ? 1 : 0.5,
              }}
            >
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
