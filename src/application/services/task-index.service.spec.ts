import { describe, expect, it, vi } from "vitest";

import { TaskFactory } from "@domain/services/task-factory";

import { InMemoryTaskIndex } from "@infrastructure/index/memory-task-index";
import { MarkdownTaskParser } from "@infrastructure/parsers/markdown-task-parser";

import type { TaskIndexSettingsPort } from "@application/ports/task-index-settings";
import type {
  TaskScannerOptions,
  TaskScannerPort,
  WorkspaceFolderInput,
} from "@application/ports/task-scanner";
import { BuildTaskIndexUseCase } from "@application/usecases/build-task-index.usecase";

import { TaskIndexService } from "./task-index.service";

class StubTaskScanner implements TaskScannerPort {
  constructor(private readonly files: readonly { path: string; content: string }[]) {}

  async scan(workspaceFolders: readonly WorkspaceFolderInput[], options?: TaskScannerOptions) {
    void workspaceFolders;
    void options;
    return this.files.map((file) => ({
      filePath: file.path,
      content: file.content,
    }));
  }
}

describe("TaskIndexService", () => {
  function createService(files: readonly { path: string; content: string }[]) {
    const parser = new MarkdownTaskParser(new TaskFactory());
    const index = new InMemoryTaskIndex();
    const buildIndex = new BuildTaskIndexUseCase({ parser, writer: index });
    const scanner = new StubTaskScanner(files);
    const service = new TaskIndexService({
      scanner,
      buildIndexUseCase: buildIndex,
      repository: index,
    });
    return { service, index };
  }

  it("initializes by scanning files and building the index", async () => {
    const { service } = createService([
      {
        path: "tasks/a.md",
        content: "- [ ] Task A {id: T-AAA11}",
      },
      {
        path: "tasks/b.md",
        content: "- [x] Task B {id: T-BBB22}",
      },
    ]);

    await service.initialize([{ path: "/workspace" }]);

    const tasks = await service.listAll();
    expect(tasks).toHaveLength(2);
    expect(service.getIssues()).toHaveLength(0);
  });

  it("collects issues from the build use case", async () => {
    const { service } = createService([
      {
        path: "tasks/a.md",
        content: "- [ ] Missing id",
      },
    ]);

    await service.initialize([{ path: "/workspace" }]);

    expect(service.getIssues()).toHaveLength(1);
    expect(service.getIssues()[0]?.filePath).toBe("tasks/a.md");
  });

  it("prevents double initialization", async () => {
    const { service } = createService([]);

    await service.initialize([{ path: "/workspace" }]);

    await expect(service.initialize([{ path: "/workspace" }])).rejects.toThrow(
      /already initialized/i,
    );
  });

  it("throws when listAll is called before initialization", async () => {
    const { service } = createService([]);

    await expect(service.listAll()).rejects.toThrow(/not initialized/i);
  });

  it("requests scanner with workspace folders", async () => {
    const scan = vi.fn<Parameters<TaskScannerPort["scan"]>, ReturnType<TaskScannerPort["scan"]>>(
      async () => [],
    );

    const service = new TaskIndexService({
      scanner: { scan },
      buildIndexUseCase: new BuildTaskIndexUseCase({
        parser: new MarkdownTaskParser(new TaskFactory()),
        writer: new InMemoryTaskIndex(),
      }),
      repository: new InMemoryTaskIndex(),
    });

    const folders: WorkspaceFolderInput[] = [{ path: "/workspace" }];
    await service.initialize(folders);

    expect(scan).toHaveBeenCalledWith(folders, undefined);
  });

  it("passes scanner options through initialization", async () => {
    const scan = vi.fn<Parameters<TaskScannerPort["scan"]>, ReturnType<TaskScannerPort["scan"]>>(
      async () => [],
    );

    const service = new TaskIndexService({
      scanner: { scan },
      buildIndexUseCase: new BuildTaskIndexUseCase({
        parser: new MarkdownTaskParser(new TaskFactory()),
        writer: new InMemoryTaskIndex(),
      }),
      repository: new InMemoryTaskIndex(),
    });

    const folders: WorkspaceFolderInput[] = [{ path: "/workspace" }];
    const options = { include: ["**/*.md"], exclude: ["**/node_modules/**"] } as const;
    await service.initialize(folders, options);

    expect(scan).toHaveBeenCalledWith(folders, options);
  });

  it("uses settings-derived scanner options when none are provided", async () => {
    const scan = vi.fn<Parameters<TaskScannerPort["scan"]>, ReturnType<TaskScannerPort["scan"]>>(
      async () => [],
    );

    const folders: WorkspaceFolderInput[] = [{ path: "/workspace" }];
    const include = ["**/*.tasks.md"] as const;
    const exclude = ["**/skip/**"] as const;

    const getScannerOptions = vi.fn<
      Parameters<TaskIndexSettingsPort["getScannerOptions"]>,
      ReturnType<TaskIndexSettingsPort["getScannerOptions"]>
    >(async () => ({ include, exclude }));

    const service = new TaskIndexService({
      scanner: { scan },
      buildIndexUseCase: new BuildTaskIndexUseCase({
        parser: new MarkdownTaskParser(new TaskFactory()),
        writer: new InMemoryTaskIndex(),
      }),
      repository: new InMemoryTaskIndex(),
      settings: { getScannerOptions },
    });

    await service.initialize(folders);

    expect(getScannerOptions).toHaveBeenCalledOnce();
    expect(scan).toHaveBeenCalledWith(folders, { include, exclude });
  });

  it("prefers explicit options over settings values when merging", async () => {
    const scan = vi.fn<Parameters<TaskScannerPort["scan"]>, ReturnType<TaskScannerPort["scan"]>>(
      async () => [],
    );

    const folders: WorkspaceFolderInput[] = [{ path: "/workspace" }];

    const settingsOptions = {
      include: ["**/*.md"],
      exclude: ["**/temp/**"],
    } as const;

    const getScannerOptions = vi.fn<
      Parameters<TaskIndexSettingsPort["getScannerOptions"]>,
      ReturnType<TaskIndexSettingsPort["getScannerOptions"]>
    >(async () => settingsOptions);

    const service = new TaskIndexService({
      scanner: { scan },
      buildIndexUseCase: new BuildTaskIndexUseCase({
        parser: new MarkdownTaskParser(new TaskFactory()),
        writer: new InMemoryTaskIndex(),
      }),
      repository: new InMemoryTaskIndex(),
      settings: { getScannerOptions },
    });

    const initializeOptions = { include: ["**/*.tasks.md"] } as const;
    await service.initialize(folders, initializeOptions);

    expect(getScannerOptions).toHaveBeenCalledOnce();
    expect(scan).toHaveBeenCalledWith(folders, {
      include: initializeOptions.include,
      exclude: settingsOptions.exclude,
    });
  });
});
