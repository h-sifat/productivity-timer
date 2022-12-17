import type { z } from "zod";

export function formatError(error: z.ZodError): string {
  const { fieldErrors, formErrors } = error.flatten();

  if (formErrors.length) return formErrors[0];
  for (const field in fieldErrors)
    if ((fieldErrors as any)[field].length)
      return `${field}: ${(fieldErrors as any)[field][0]}`;

  return "Unknown error.";
}
