import type { Request, Response, NextFunction } from "express";
import { GoDaddyError } from "../godaddy.js";
import { ZodError } from "zod";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      details: err.flatten().fieldErrors,
    });
  }

  if (
    err instanceof Error &&
    "status" in err &&
    typeof (err as Error & { status: unknown }).status === "number"
  ) {
    const status = (err as Error & { status: number }).status;
    return res.status(status).json({ error: err.message });
  }

  if (err instanceof GoDaddyError) {
    const status = err.status >= 400 && err.status < 600 ? err.status : 502;
    return res.status(status).json({
      error: err.message,
      provider: "godaddy",
      details: err.body,
    });
  }

  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}
