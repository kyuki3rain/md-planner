import { describe, expect, it } from "vitest";

import { isDueDate, parseDueDate } from "./due-date";

describe("DueDate", () => {
  it("parses ISO8601 dates", () => {
    const result = parseDueDate(" 2025-10-16 ");

    expect(result.isOk()).toBe(true);
    if (result.isOk()) {
      expect(result.value).toBe("2025-10-16");
    }
  });

  it("rejects invalid values", () => {
    const result = parseDueDate("2025-13-40");

    expect(result.isErr()).toBe(true);
  });

  it("provides a type guard", () => {
    const parsed = parseDueDate("2025-01-01");

    expect(parsed.isOk()).toBe(true);
    if (parsed.isOk()) {
      expect(isDueDate(parsed.value)).toBe(true);
    }
    expect(isDueDate("not-a-date")).toBe(false);
  });
});
