import { describe, expect, it } from "vitest";

import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";

import { FileSystemTaskScanner } from "./file-system-task-scanner";

describe("FileSystemTaskScanner", () => {
  async function createWorkspace(structure: Record<string, string>) {
    const root = await mkdtemp(join(tmpdir(), "md-planner-fs-scanner-"));

    for (const [relativePath, content] of Object.entries(structure)) {
      const filePath = join(root, relativePath);
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, content, "utf8");
    }

    return root;
  }

  describe("scan", () => {
    it("collects markdown files while respecting include/exclude patterns", async () => {
      const root = await createWorkspace({
        "work/todo.md": "- [ ] Task",
        "work/notes.txt": "not markdown",
        "node_modules/skip.md": "- [ ] ignore",
      });

      const scanner = new FileSystemTaskScanner();

      const files = await scanner.scan([{ path: root }], {
        include: ["**/*.md"],
        exclude: ["**/node_modules/**"],
      });

      const paths = files.map((file) => file.filePath);
      expect(paths).toEqual(["work/todo.md"]);
      expect(files[0]?.content).toContain("Task");
    });

    it("merges results from multiple workspace folders", async () => {
      const rootA = await createWorkspace({ "a.md": "- [ ] A" });
      const rootB = await createWorkspace({ "b/b.md": "- [ ] B" });

      const scanner = new FileSystemTaskScanner();

      const files = await scanner.scan([{ path: rootA }, { path: rootB }], {
        include: ["**/*.md"],
        exclude: [],
      });

      expect(files.map((file) => file.filePath).sort()).toEqual(["a.md", "b/b.md"]);
    });
  });
});
