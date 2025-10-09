/**
 * VS Code Webview API の型定義
 */
interface VSCodeAPI {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare global {
  interface Window {
    acquireVsCodeApi(): VSCodeAPI;
  }
}

/**
 * Extension ↔ Webview 間のメッセージ型
 */
export interface ExtensionMessage<T = unknown> {
  type: string;
  payload?: T;
}

/**
 * Webviewからextensionへのメッセージ送信
 */
export class ExtensionBridge {
  private vscode: VSCodeAPI;
  private listeners: Map<string, Set<(payload: unknown) => void>>;

  constructor() {
    this.vscode = window.acquireVsCodeApi();
    this.listeners = new Map();

    // Extensionからのメッセージを購読
    window.addEventListener("message", (event) => {
      const message = event.data as ExtensionMessage;
      this._dispatchMessage(message);
    });
  }

  /**
   * Extensionにメッセージを送信
   */
  public sendMessage<T = unknown>(type: string, payload?: T): void {
    console.log('[Webview] Sending message:', type, payload);
    this.vscode.postMessage({ type, payload });
  }

  /**
   * Extensionからのメッセージを購読
   */
  public subscribe<T = unknown>(type: string, handler: (payload: T) => void): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }

    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.add(handler as (payload: unknown) => void);
    }

    // Unsubscribe function
    return () => {
      const handlers = this.listeners.get(type);
      if (handlers) {
        handlers.delete(handler as (payload: unknown) => void);
      }
    };
  }

  /**
   * メッセージを適切なリスナーにディスパッチ
   */
  private _dispatchMessage(message: ExtensionMessage): void {
    console.log('[Webview] Received message:', message.type, message.payload);
    const handlers = this.listeners.get(message.type);
    if (handlers) {
      for (const handler of handlers) {
        handler(message.payload);
      }
    } else {
      console.warn('[Webview] No handlers for message type:', message.type);
    }
  }

  /**
   * 状態を保存
   */
  public saveState(state: unknown): void {
    this.vscode.setState(state);
  }

  /**
   * 状態を取得
   */
  public getState<T = unknown>(): T | undefined {
    return this.vscode.getState() as T | undefined;
  }
}

// シングルトンインスタンス
export const extensionBridge = new ExtensionBridge();
