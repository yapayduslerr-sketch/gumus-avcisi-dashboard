import type { Request } from "express";

export function isAuthorizedScheduledRequest(request: Request) {
  if (process.env.NODE_ENV !== "production") return true;
  const expected = process.env.SCHEDULED_UPDATE_TOKEN;
  if (!expected) return false;
  const authorization = request.header("authorization") ?? "";
  return authorization === `Bearer ${expected}`;
}
