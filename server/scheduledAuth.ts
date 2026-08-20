import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request } from "express";

type ScheduledClaims = { openId?: string; taskUid?: string; exp?: number };

function base64UrlDecode(value: string) {
  return Buffer.from(value.replace(/-/g, "+").replace(/_/g, "/"), "base64");
}

function readSessionToken(request: Request) {
  const authorization = request.header("authorization") ?? "";
  if (authorization.startsWith("Bearer ")) return authorization.slice(7);
  const cookie = request.header("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)app_session_id=([^;]+)/);
  return match?.[1] ?? null;
}

function verifyCronSession(token: string): ScheduledClaims | null {
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  try {
    const header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8")) as { alg?: string };
    if (header.alg !== "HS256") return null;
    const expected = createHmac("sha256", secret).update(`${encodedHeader}.${encodedPayload}`).digest();
    const actual = base64UrlDecode(encodedSignature);
    if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
    const claims = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8")) as ScheduledClaims;
    if (claims.exp && claims.exp * 1000 <= Date.now()) return null;
    if (!claims.openId?.startsWith("cron_") || !claims.taskUid) return null;
    return claims;
  } catch {
    return null;
  }
}

export function authenticateScheduledRequest(request: Request) {
  if (process.env.NODE_ENV !== "production") return { ok: true, taskUid: "development" };
  const token = readSessionToken(request);
  if (!token) return { ok: false as const, reason: "missing scheduled session" };
  const claims = verifyCronSession(token);
  return claims ? { ok: true as const, taskUid: claims.taskUid! } : { ok: false as const, reason: "invalid cron session" };
}
