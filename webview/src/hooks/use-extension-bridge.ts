import { useEffect } from "react";
import { extensionBridge } from "../bridge/extension-bridge";

/**
 * Extensionからのメッセージを購読するフック
 */
export function useExtensionMessage<T = unknown>(
  type: string,
  handler: (payload: T) => void,
): void {
  useEffect(() => {
    const unsubscribe = extensionBridge.subscribe(type, handler);
    return unsubscribe;
  }, [type, handler]);
}

/**
 * Extensionにメッセージを送信するフック
 */
export function useExtensionBridge() {
  return {
    sendMessage: extensionBridge.sendMessage.bind(extensionBridge),
    subscribe: extensionBridge.subscribe.bind(extensionBridge),
    saveState: extensionBridge.saveState.bind(extensionBridge),
    getState: extensionBridge.getState.bind(extensionBridge),
  };
}
