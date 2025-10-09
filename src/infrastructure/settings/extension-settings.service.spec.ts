import { describe, expect, it } from "vitest";

import { ExtensionSettingsService } from "./extension-settings.service";

class StubConfiguration {
  constructor(private readonly store: Record<string, unknown> = {}) {}

  get<T>(section: string): T | undefined {
    return this.store[section] as T | undefined;
  }
}

describe("ExtensionSettingsService", () => {
  it("returns undefined when no relevant settings exist", async () => {
    const service = new ExtensionSettingsService({ configuration: new StubConfiguration() });

    await expect(service.getScannerOptions()).resolves.toBeUndefined();
  });

  it("reads include and exclude arrays from configuration", async () => {
    const service = new ExtensionSettingsService({
      configuration: new StubConfiguration({
        "index.include": ["**/*.md"],
        "index.exclude": ["**/node_modules/**"],
      }),
    });

    await expect(service.getScannerOptions()).resolves.toEqual({
      include: ["**/*.md"],
      exclude: ["**/node_modules/**"],
    });
  });

  it("filters out non-string entries", async () => {
    const service = new ExtensionSettingsService({
      configuration: new StubConfiguration({
        "index.include": ["**/*.md", 123],
        "index.exclude": [null, "**/.git/**"],
      }),
    });

    await expect(service.getScannerOptions()).resolves.toEqual({
      include: ["**/*.md"],
      exclude: ["**/.git/**"],
    });
  });
});
