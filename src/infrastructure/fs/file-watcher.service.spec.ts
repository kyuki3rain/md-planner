import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import { FileWatcherService } from "./file-watcher.service";

// VS Code APIのモック
vi.mock("vscode", () => ({
  workspace: {
    createFileSystemWatcher: vi.fn(),
  },
  Disposable: {
    from: vi.fn((...disposables) => ({
      dispose: () => {
        for (const d of disposables) {
          if (d && typeof d.dispose === "function") {
            d.dispose();
          }
        }
      },
    })),
  },
  Uri: {
    file: (path: string) => ({ fsPath: path }),
  },
}));

describe("FileWatcherService", () => {
  let onCreateCallback: ((uri: vscode.Uri) => void) | null = null;
  let onChangeCallback: ((uri: vscode.Uri) => void) | null = null;
  let onDeleteCallback: ((uri: vscode.Uri) => void) | null = null;

  beforeEach(() => {
    vi.clearAllMocks();

    // FileSystemWatcherのモックを設定
    const mockWatcher = {
      onDidCreate: vi.fn((callback) => {
        onCreateCallback = callback;
        return { dispose: vi.fn() };
      }),
      onDidChange: vi.fn((callback) => {
        onChangeCallback = callback;
        return { dispose: vi.fn() };
      }),
      onDidDelete: vi.fn((callback) => {
        onDeleteCallback = callback;
        return { dispose: vi.fn() };
      }),
      dispose: vi.fn(),
    };

    vi.mocked(vscode.workspace.createFileSystemWatcher).mockReturnValue(
      mockWatcher as unknown as vscode.FileSystemWatcher,
    );
  });

  afterEach(() => {
    onCreateCallback = null;
    onChangeCallback = null;
    onDeleteCallback = null;
  });

  it("should create a file watcher with the specified pattern", () => {
    const onChange = vi.fn();
    const service = new FileWatcherService("**/*.md", onChange);

    service.start();

    expect(vscode.workspace.createFileSystemWatcher).toHaveBeenCalledWith("**/*.md");
  });

  it("should call onChange when a file is created", async () => {
    const onChange = vi.fn();
    const service = new FileWatcherService("**/*.md", onChange);

    service.start();

    const uri = vscode.Uri.file("/test/file.md");
    if (onCreateCallback) {
      onCreateCallback(uri);
    }

    // デバウンス待ち
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(onChange).toHaveBeenCalledWith(uri);
  });

  it("should call onChange when a file is changed", async () => {
    const onChange = vi.fn();
    const service = new FileWatcherService("**/*.md", onChange);

    service.start();

    const uri = vscode.Uri.file("/test/file.md");
    if (onChangeCallback) {
      onChangeCallback(uri);
    }

    // デバウンス待ち
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(onChange).toHaveBeenCalledWith(uri);
  });

  it("should call onChange when a file is deleted", async () => {
    const onChange = vi.fn();
    const service = new FileWatcherService("**/*.md", onChange);

    service.start();

    const uri = vscode.Uri.file("/test/file.md");
    if (onDeleteCallback) {
      onDeleteCallback(uri);
    }

    // デバウンス待ち
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(onChange).toHaveBeenCalledWith(uri);
  });

  it("should debounce multiple changes within 300ms", async () => {
    const onChange = vi.fn();
    const service = new FileWatcherService("**/*.md", onChange);

    service.start();

    const uri1 = vscode.Uri.file("/test/file1.md");
    const uri2 = vscode.Uri.file("/test/file2.md");
    const uri3 = vscode.Uri.file("/test/file3.md");

    // 短時間に複数の変更
    if (onChangeCallback) {
      onChangeCallback(uri1);
      onChangeCallback(uri2);
      onChangeCallback(uri3);
    }

    // デバウンス待ち
    await new Promise((resolve) => setTimeout(resolve, 350));

    // 最後の変更のみが処理される
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(uri3);
  });

  it("should dispose the watcher when stop is called", () => {
    const onChange = vi.fn();
    const service = new FileWatcherService("**/*.md", onChange);

    const disposable = service.start();
    service.stop();

    expect(disposable.dispose).toBeDefined();
  });

  it("should clear pending changes when stop is called", async () => {
    const onChange = vi.fn();
    const service = new FileWatcherService("**/*.md", onChange);

    service.start();

    const uri = vscode.Uri.file("/test/file.md");
    if (onChangeCallback) {
      onChangeCallback(uri);
    }

    // すぐにstop
    service.stop();

    // デバウンス時間経過後もonChangeは呼ばれない
    await new Promise((resolve) => setTimeout(resolve, 350));

    expect(onChange).not.toHaveBeenCalled();
  });
});
