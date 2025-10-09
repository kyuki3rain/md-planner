import { ulid } from "ulid";
import type { Task } from "@domain/entities/task";
import type { TaskAttributesInput } from "@domain/entities/task-attributes";
import { TaskFactory } from "@domain/services/task-factory";

import type {
  MarkdownTaskParserInput,
  MarkdownTaskParserIssue,
  MarkdownTaskParserOutput,
  MarkdownTaskParserPort,
} from "@application/ports/markdown-task-parser";

type ParsedDefaults = {
  readonly attributes?: TaskAttributesInput;
  readonly status?: string;
};

type TaskLineMatch = {
  readonly checkboxToken: string;
  readonly title: string;
  readonly attributeSource?: string;
  readonly column: number;
};

const CHECKBOX_PATTERN = /^(\s*)[-*]\s\[([^\]])\]\s*(.*)$/;

export class MarkdownTaskParser implements MarkdownTaskParserPort {
  constructor(private readonly taskFactory: TaskFactory = new TaskFactory()) {}

  parse(input: MarkdownTaskParserInput): MarkdownTaskParserOutput {
    const tasks: Task[] = [];
    const issues: MarkdownTaskParserIssue[] = [];

    const lines = input.content.split(/\r?\n/);
    const frontmatterLines: string[] = [];

    let defaults: ParsedDefaults | undefined;
    let insideFrontmatter = false;
    let frontmatterProcessed = false;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex] ?? "";
      const trimmed = line.trim();

      if (!frontmatterProcessed && lineIndex === 0 && trimmed === "---") {
        insideFrontmatter = true;
        continue;
      }

      if (insideFrontmatter) {
        if (trimmed === "---") {
          insideFrontmatter = false;
          frontmatterProcessed = true;
          defaults = parseDefaults(frontmatterLines.join("\n"));
          continue;
        }
        frontmatterLines.push(line);
        continue;
      }

      const match = matchTaskLine(line);
      if (!match) {
        continue;
      }

      const attributeMap = match.attributeSource ? parseAttributeBlock(match.attributeSource) : {};

      const idValue = attributeMap.id;
      const inlineStatus = attributeMap.status;

      const filteredAttributes = omitKeys(attributeMap, ["id", "status"]);
      const attributesInput = toTaskAttributesInput(filteredAttributes);

      const defaultAttributes = defaults?.attributes;
      const defaultStatus = defaults?.status;

      const status =
        normalizeStatus(
          typeof inlineStatus === "string" && inlineStatus.length > 0
            ? inlineStatus
            : defaultStatus,
        ) ?? checkboxTokenToStatus(match.checkboxToken);

      // idが存在しない場合はULIDを生成
      const taskId = typeof idValue === "string" && idValue.length > 0 ? idValue : ulid();

      const result = this.taskFactory.create({
        id: taskId,
        title: match.title,
        status,
        attributes: attributesInput,
        defaults: defaultAttributes,
        source: {
          filePath: input.filePath,
          line: lineIndex,
          column: match.column,
        },
      });

      if (result.isOk()) {
        tasks.push(result.value);
        continue;
      }

      issues.push({
        message: result.error.message,
        line: lineIndex,
        column: match.column,
        detail: result.error,
      });
    }

    return { tasks, issues };
  }
}

function checkboxTokenToStatus(token: string): string {
  const normalized = token.trim().toLowerCase();
  if (normalized === "x" || normalized === "*" || normalized === "done") {
    return "done";
  }
  return "todo";
}

function matchTaskLine(line: string): TaskLineMatch | null {
  const match = CHECKBOX_PATTERN.exec(line);
  if (!match) {
    return null;
  }

  const [, leading, token, rest] = match;
  const column = leading.length + 2; // "- " prefix

  const { title, attributes } = splitTitleAndAttributes(rest ?? "");

  return {
    checkboxToken: token,
    title,
    attributeSource: attributes,
    column,
  } satisfies TaskLineMatch;
}

function splitTitleAndAttributes(source: string): {
  readonly title: string;
  readonly attributes?: string;
} {
  const braceStart = source.indexOf("{");
  if (braceStart === -1) {
    return { title: source.trim() };
  }

  const closingBrace = source.lastIndexOf("}");
  const attributes =
    closingBrace !== -1 ? source.slice(braceStart, closingBrace + 1) : source.slice(braceStart);
  const title = source.slice(0, braceStart).trim();

  return { title, attributes };
}

type AttributeMap = Record<string, unknown>;

function parseAttributeBlock(raw: string | undefined): AttributeMap {
  if (!raw) {
    return {};
  }

  const trimmed = raw.trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) {
    return {};
  }

  const inner = trimmed.slice(1, -1).trim();
  if (inner.length === 0) {
    return {};
  }

  const entries = splitTopLevel(inner, ",");
  const result: AttributeMap = {};

  for (const entry of entries) {
    const colonIndex = entry.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }

    const rawKey = entry.slice(0, colonIndex).trim();
    const rawValue = entry.slice(colonIndex + 1).trim();

    if (!rawKey) {
      continue;
    }

    result[rawKey] = parseAttributeValue(rawValue);
  }

  return result;
}

function parseAttributeValue(rawValue: string): unknown {
  if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
    return splitTopLevel(rawValue.slice(1, -1), ",")
      .map((value) => stripWrappingQuotes(value.trim()))
      .filter((value) => value.length > 0);
  }

  return stripWrappingQuotes(rawValue);
}

function splitTopLevel(source: string, separator: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = "";

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index] ?? "";

    if (char === "[") {
      depth += 1;
    } else if (char === "]" && depth > 0) {
      depth -= 1;
    }

    if (char === separator && depth === 0) {
      result.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    result.push(current.trim());
  }

  return result;
}

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

function normalizeStatus(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }
  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  return trimmed.toLowerCase();
}

function omitKeys<T extends Record<string, unknown>>(
  input: T,
  keys: readonly string[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (keys.includes(key)) {
      continue;
    }
    result[key] = value;
  }
  return result;
}

function toTaskAttributesInput(map: Record<string, unknown>): TaskAttributesInput | undefined {
  const result: Record<string, string | readonly string[]> = {};

  if (typeof map.project === "string") {
    result.project = map.project;
  }
  if (typeof map.assignee === "string") {
    result.assignee = map.assignee;
  }
  if (Array.isArray(map.tags)) {
    const filtered = map.tags.filter(isString);
    if (filtered.length > 0) {
      result.tags = filtered;
    }
  }
  if (typeof map.due === "string") {
    result.due = map.due;
  }
  if (Array.isArray(map.depends)) {
    const filtered = map.depends.filter(isString);
    if (filtered.length > 0) {
      result.depends = filtered;
    }
  }

  return Object.keys(result).length > 0 ? (result as TaskAttributesInput) : undefined;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function parseDefaults(raw: string): ParsedDefaults | undefined {
  if (!raw.trim()) {
    return undefined;
  }

  const lines = raw.split(/\r?\n/);
  const defaultsMap: Record<string, unknown> = {};
  let status: string | undefined;
  let capturingDefaults = false;

  for (const line of lines) {
    if (!capturingDefaults) {
      if (line.trim().startsWith("defaults:")) {
        capturingDefaults = true;
      }
      continue;
    }

    if (!line.startsWith("  ")) {
      break;
    }

    const trimmed = line.trim();
    const colonIndex = trimmed.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    if (!key) {
      continue;
    }

    if (key === "status") {
      status = normalizeStatus(stripWrappingQuotes(value));
      continue;
    }

    defaultsMap[key] = parseAttributeValue(value);
  }

  const attributes = toTaskAttributesInput(defaultsMap);

  if (!attributes && !status) {
    return undefined;
  }

  return {
    attributes,
    status,
  } satisfies ParsedDefaults;
}
