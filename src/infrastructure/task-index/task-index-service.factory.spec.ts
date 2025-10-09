import { describe, expect, it } from "vitest";

import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createTaskIndexService } from "./task-index-service.factory";

describe("createTaskIndexService", () => {
  it("creates a service that indexes markdown files from the filesystem", async () => {
    const root = await mkdtemp(join(tmpdir(), "md-planner-task-index-"));
    await mkdir(join(root, "tasks"), { recursive: true });
    await writeFile(join(root, "tasks", "todo.md"), "- [ ] Initial task {id: T-ABCDE1}", "utf8");

    const service = createTaskIndexService();

    await service.initialize([{ path: root }]);

    const tasks = await service.listAll();
    expect(tasks).toHaveLength(1);
    expect(tasks[0]?.title).toBe("Initial task");
  });
});
