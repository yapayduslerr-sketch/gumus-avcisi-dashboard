import { createHmac } from "node:crypto";
import { describe, expect, it, afterEach } from "vitest";
import { authenticateScheduledRequest } from "./scheduledAuth";

function token(secret: string, claims: Record<string, unknown>) {
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const header = encode({ alg: "HS256", typ: "JWT" });
  const payload = encode(claims);
  const signature = createHmac("sha256", secret).update(`${header}.${payload}`).digest("base64url");
  return `${header}.${payload}.${signature}`;
}

describe("scheduled request authentication", () => {
  const oldNodeEnv = process.env.NODE_ENV;
  const oldJwtSecret = process.env.JWT_SECRET;
  afterEach(() => {
    process.env.NODE_ENV = oldNodeEnv;
    process.env.JWT_SECRET = oldJwtSecret;
  });

  it("accepts only a signed cron session in production", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "test-secret";
    const session = token("test-secret", { openId: "cron_update", taskUid: "task_123" });
    const request = { header: (name: string) => name === "cookie" ? `app_session_id=${session}` : undefined } as never;
    expect(authenticateScheduledRequest(request)).toEqual({ ok: true, taskUid: "task_123" });
  });

  it("rejects a normal user session in production", () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "test-secret";
    const session = token("test-secret", { openId: "user_123", taskUid: "task_123" });
    const request = { header: (name: string) => name === "cookie" ? `app_session_id=${session}` : undefined } as never;
    expect(authenticateScheduledRequest(request).ok).toBe(false);
  });
});
