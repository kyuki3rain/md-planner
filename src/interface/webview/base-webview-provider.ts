import * as vscode from "vscode";

/**
 * Webview プロバイダー基底クラス
 */
export abstract class BaseWebviewProvider {
  constructor(
    protected readonly _extensionUri: vscode.Uri,
    protected readonly _context: vscode.ExtensionContext,
  ) {}

  /**
   * Webview用のHTMLを生成
   */
  protected _getHtmlForWebview(webview: vscode.Webview, title: string): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "assets", "index.js"),
    );

    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "assets", "index.css"),
    );

    const nonce = this._getNonce();

    return `<!DOCTYPE html>
			<html lang="ja">
			<head>
				<meta charset="UTF-8">
				<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'unsafe-inline'; script-src 'nonce-${nonce}';">
				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<link href="${styleUri}" rel="stylesheet">
				<title>${title}</title>
			</head>
			<body>
				<div id="root"></div>
				<script type="module" nonce="${nonce}" src="${scriptUri}"></script>
			</body>
			</html>`;
  }

  /**
   * CSP用のnonceを生成
   */
  private _getNonce(): string {
    let text = "";
    const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
