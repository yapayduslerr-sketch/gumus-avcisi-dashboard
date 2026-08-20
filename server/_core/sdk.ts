import { TRPCError } from "@trpc/server";
import type { Request } from "express";
import type { GetUserInfoWithJwtResponse, VerifySessionResponse } from "./types/manusTypes";

const COOKIE_NAME = "app_session_id";
const CRON_OPEN_ID_PREFIX = "cron_";
const SERVICE = "webdevtoken.v1.WebDevService";

export type AuthenticatedUser = {
  openId: string;
  name: string;
  email: string | null;
  role: "user";
  taskUid?: string;
  isCron?: boolean;
};

function sessionFromRequest(request: Request) {
  const authorization = request.header("authorization") ?? "";
  if (authorization.startsWith("Bearer ")) return authorization.slice(7);
  const cookie = request.header("cookie") ?? "";
  return cookie.match(/(?:^|;\\s*)app_session_id=([^;]+)/)?.[1] ?? null;
}

async function callForge<T>(rpc: string, session: string): Promise<T> {
  const base = (process.env.BUILT_IN_FORGE_API_URL ?? "").replace(/\/+$/, "");
  const key = process.env.BUILT_IN_FORGE_API_KEY;
  if (!base || !key) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Forge auth is not configured" });
  const response = await fetch(`${base}/${SERVICE}/${rpc}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${key}`,
      "content-type": "application/json",
      "connect-protocol-version": "1",
      "x-manus-user-session": session,
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) throw new TRPCError({ code: response.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN", message: `Forge auth failed (${response.status})` });
  return response.json() as Promise<T>;
}

function buildCronUser(info: GetUserInfoWithJwtResponse): AuthenticatedUser {
  return { openId: info.openId, name: info.name || "Manus Scheduled Task", email: info.email ?? null, role: "user", taskUid: info.taskUid ?? undefined, isCron: true };
}

export async function authenticateRequest(request: Request): Promise<AuthenticatedUser> {
  const session = sessionFromRequest(request);
  if (!session) throw new TRPCError({ code: "UNAUTHORIZED", message: "Missing session" });
  const verified = await callForge<VerifySessionResponse>("VerifySession", session);
  if (!verified.openId) throw new TRPCError({ code: "FORBIDDEN", message: "Invalid session" });
  const info = await callForge<GetUserInfoWithJwtResponse>("GetUserInfoWithJwt", session);
  if (info.openId.startsWith(CRON_OPEN_ID_PREFIX)) return buildCronUser(info);
  return { openId: info.openId, name: info.name, email: info.email ?? null, role: "user" };
}
