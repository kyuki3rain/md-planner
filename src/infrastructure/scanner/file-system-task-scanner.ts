import { readFile, readdir } from "node:fs/promises";
import { join, posix, resolve, sep } from "node:path";

import type { MarkdownTaskParserInput } from "@application/ports/markdown-task-parser";
import type {
  TaskScannerOptions,
  TaskScannerPort,
  WorkspaceFolderInput,
} from "@application/ports/task-scanner";

const DEFAULT_INCLUDE = ["**/*.md"] as const;
const DEFAULT_EXCLUDE = ["**/node_modules/**", "**/.git/**"] as const;

type NormalizedOptions = {
  readonly include: readonly string[];
  readonly exclude: readonly string[];
};

export class FileSystemTaskScanner implements TaskScannerPort {
  constructor(private readonly defaults: TaskScannerOptions = {}) {}

  async scan(
    workspaceFolders: readonly WorkspaceFolderInput[],
    options?: TaskScannerOptions,
  ): Promise<readonly MarkdownTaskParserInput[]> {
    const normalized = this.normalizeOptions(options);
    const includeMatchers = normalized.include.map(globToRegExp);
    const excludeMatchers = normalized.exclude.map(globToRegExp);

    const results: MarkdownTaskParserInput[] = [];
    const seen = new Set<string>();

    for (const folder of workspaceFolders) {
      const basePath = resolve(folder.path);
      if (seen.has(basePath)) {
        continue;
      }
      seen.add(basePath);

      const files = await this.collectFiles(basePath, includeMatchers, excludeMatchers);
      results.push(...files);
    }

    return results.sort((left, right) => left.filePath.localeCompare(right.filePath));
  }

  private normalizeOptions(options?: TaskScannerOptions): NormalizedOptions {
    const include = options?.include ?? this.defaults.include ?? DEFAULT_INCLUDE;
    const exclude = options?.exclude ?? this.defaults.exclude ?? DEFAULT_EXCLUDE;

    return {
      include: include.length > 0 ? [...include] : [...DEFAULT_INCLUDE],
      exclude: exclude.length > 0 ? [...exclude] : [...DEFAULT_EXCLUDE],
    } satisfies NormalizedOptions;
  }

  private async collectFiles(
    basePath: string,
    includeMatchers: readonly RegExp[],
    excludeMatchers: readonly RegExp[],
  ): Promise<MarkdownTaskParserInput[]> {
    const files: MarkdownTaskParserInput[] = [];

    const walkQueue: { dir: string; relativeDir: string }[] = [{ dir: basePath, relativeDir: "" }];

    while (walkQueue.length > 0) {
      const current = walkQueue.pop();
      if (!current) {
        continue;
      }

      const entries = await readdir(current.dir, { withFileTypes: true });
      for (const entry of entries) {
        const absolutePath = join(current.dir, entry.name);
        const relativePath = current.relativeDir
          ? join(current.relativeDir, entry.name)
          : entry.name;
        const normalizedPath = toPosix(relativePath);

        if (entry.isDirectory()) {
          if (
            matches(normalizedPath, excludeMatchers) ||
            matches(`${normalizedPath}/`, excludeMatchers)
          ) {
            continue;
          }
          walkQueue.push({ dir: absolutePath, relativeDir: relativePath });
          continue;
        }

        if (!entry.isFile()) {
          continue;
        }

        if (!matches(normalizedPath, includeMatchers)) {
          continue;
        }

        if (matches(normalizedPath, excludeMatchers)) {
          continue;
        }

        const content = await readFile(absolutePath, "utf8");
        // 絶対パスを使用（相対パスではなく）
        files.push({ filePath: absolutePath, content });
      }
    }

    return files;
  }
}

function toPosix(value: string): string {
  if (!value) {
    return value;
  }
  return value.split(sep).join(posix.sep);
}

function globToRegExp(pattern: string): RegExp {
  let regexSource = "";

  for (let index = 0; index < pattern.length; ) {
    const char = pattern[index] ?? "";

    if (char === "*") {
      const next = pattern[index + 1] ?? "";
      if (next === "*") {
        const afterNext = pattern[index + 2] ?? "";
        if (afterNext === "/") {
          regexSource += "(?:.*/)?";
          index += 3;
          continue;
        }

        regexSource += ".*";
        index += 2;
        continue;
      }

      regexSource += "[^/]*";
      index += 1;
      continue;
    }

    if (char === "?") {
      regexSource += ".";
      index += 1;
      continue;
    }

    regexSource += escapeRegExp(char);
    index += 1;
  }

  return new RegExp(`^${regexSource}$`);
}

function matches(value: string, patterns: readonly RegExp[]): boolean {
  const variants = value ? [value, value.startsWith("./") ? value : `./${value}`] : [value];
  return patterns.some((pattern) => variants.some((variant) => pattern.test(variant)));
}

function escapeRegExp(value: string): string {
  return value.replace(/[-\\^$+?.()|[\]{}]/g, "\\$&");
}
