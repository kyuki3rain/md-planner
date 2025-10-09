import { z } from "zod";

import type { NeverthrowResult } from "@shared/result";
import { err } from "@shared/result";
import type { Brand } from "@shared/types";
import { type ZodValidationError, parseWithSchema } from "@shared/validation";

export type DueDate = Brand<string, "DueDate">;

const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function isValidCalendarDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  const [, year, month, day] = match;
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);

  if (m < 1 || m > 12) {
    return false;
  }
  if (d < 1 || d > 31) {
    return false;
  }

  const utcDate = new Date(Date.UTC(y, m - 1, d));
  return (
    utcDate.getUTCFullYear() === y && utcDate.getUTCMonth() === m - 1 && utcDate.getUTCDate() === d
  );
}

export function sanitizeDueDate(value: string): string {
  return value.trim();
}

const dueDateSchema = z
  .string()
  .min(1, { message: "DueDate must not be empty" })
  .refine((value) => ISO_DATE_PATTERN.test(value), {
    message: "DueDate must use YYYY-MM-DD format",
  })
  .refine(isValidCalendarDate, {
    message: "DueDate must be a real calendar date",
  })
  .transform((value) => value as DueDate);

export const DueDateSchema = dueDateSchema;

export type DueDateError = ZodValidationError;

export function parseDueDate(value: string): NeverthrowResult<DueDate, DueDateError> {
  const sanitized = sanitizeDueDate(value);
  return parseWithSchema(dueDateSchema, sanitized, { subject: "DueDate" });
}

export function isDueDate(value: unknown): value is DueDate {
  if (typeof value !== "string") {
    return false;
  }
  const parsed = parseDueDate(value);
  return parsed.isOk();
}

export function ensureDueDate(
  value: unknown,
): NeverthrowResult<DueDate, DueDateError | { message: string }> {
  if (typeof value !== "string") {
    return err({ message: "DueDate must be provided as a string" });
  }
  return parseDueDate(value);
}

export function formatDueDate(value: DueDate): string {
  return value;
}
