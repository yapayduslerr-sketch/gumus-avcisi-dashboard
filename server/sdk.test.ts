import { afterEach, describe, expect, it, vi } from "vitest";
import { authenticateRequest } from "./_core/sdk";

describe("Forge session authentication", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("maps a platform cron session to isCron and taskUid", async () => {
    process.env.BUILT_IN_FORGE_API_URL = "https://forge.test";
    process.env.BUILT_IN_FORGE_API_KEY = "test-key";
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ openId: "cron_source", expiresAt: null }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ openId: "cron_source", name: "Heartbeat", taskUid: "task_123" }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const request = { header: (name: string) => name === "cookie" ? "app_session_id=platform-session" : undefined } as never;
    await expect(authenticateRequest(request)).resolves.toMatchObject({ isCron: true, taskUid: "task_123" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
