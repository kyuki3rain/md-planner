import { type NeverthrowResult, err, ok } from "@shared/result";
import type { z } from "zod";

export type ZodValidationError = {
  readonly message: string;
  readonly issues: readonly z.ZodIssue[];
};

export function parseWithSchema<Schema extends z.ZodTypeAny>(
  schema: Schema,
  data: z.input<Schema>,
  options?: { readonly subject?: string },
): NeverthrowResult<z.output<Schema>, ZodValidationError> {
  const parsed = schema.safeParse(data);

  if (parsed.success) {
    return ok(parsed.data);
  }

  const subject = options?.subject ?? "input";

  return err({
    message: `${subject} is invalid`,
    issues: parsed.error.issues,
  });
}

export function formatZodError(error: ZodValidationError): string {
  const [first] = error.issues;
  if (!first) {
    return error.message;
  }
  const path = first.path.join(".");
  const detail = first.message;
  return path ? `${error.message}: ${path} ${detail}` : `${error.message}: ${detail}`;
}
