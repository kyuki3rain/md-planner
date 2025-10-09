import { describe, expect, it } from "vitest";

import { InMemoryTaskScanner } from "./in-memory-task-scanner";

describe("InMemoryTaskScanner", () => {
  it("returns registered files regardless of workspace input", async () => {
    const scanner = new InMemoryTaskScanner([
      { filePath: "tasks/a.md", content: "- [ ] A" },
      { filePath: "tasks/b.md", content: "- [ ] B" },
    ]);

    const files = await scanner.scan([{ path: "/workspace" }]);

    expect(files).toHaveLength(2);
    expect(files[0]?.filePath).toBe("tasks/a.md");
  });

  it("supports replacing files after construction", async () => {
    const scanner = new InMemoryTaskScanner();

    scanner.setFiles([{ filePath: "tasks/c.md", content: "- [ ] C" }]);

    const files = await scanner.scan([{ path: "/workspace" }]);

    expect(files).toHaveLength(1);
    expect(files[0]?.filePath).toBe("tasks/c.md");
  });
});
