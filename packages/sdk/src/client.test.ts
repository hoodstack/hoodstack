import { isHoodStackError } from "@hoodstack/errors";
import { describe, expect, it, vi } from "vitest";

import { HoodStackClient } from "./index.js";

function stub(handler: (url: string, init: RequestInit) => Response) {
  return vi.fn(async (url: string, init?: RequestInit) =>
    handler(url, init ?? {}),
  ) as unknown as typeof globalThis.fetch;
}

const ok = (data: unknown) =>
  new Response(JSON.stringify({ ok: true, requestId: "r1", data }), { status: 200 });

const fail = (status: number, code: string) =>
  new Response(
    JSON.stringify({ ok: false, requestId: "r1", error: { code, message: "nope" } }),
    { status },
  );

describe("HoodStackClient", () => {
  it("requires an api key", () => {
    expect(() => new HoodStackClient({ apiKey: "" })).toThrow();
  });

  it("sends the bearer token and unwraps data", async () => {
    let seenAuth = "";
    const fetchImpl = stub((_url, init) => {
      seenAuth = (init.headers as Record<string, string>)["authorization"] ?? "";
      return ok({ status: "ok", chain: { id: 46630, name: "Robinhood Chain Testnet" } });
    });
    const client = new HoodStackClient({ apiKey: "hs_test_abc", fetch: fetchImpl });

    const health = await client.health();
    expect(seenAuth).toBe("Bearer hs_test_abc");
    expect(health.chain.id).toBe(46630);
  });

  it("builds query parameters for reads", async () => {
    let seenUrl = "";
    const fetchImpl = stub((url) => {
      seenUrl = url;
      return ok({ address: "0xabc", balanceFormatted: "1 ETH", nonce: 0, isContract: false });
    });
    const client = new HoodStackClient({
      apiKey: "hs_test_abc",
      baseUrl: "https://example.com/",
      fetch: fetchImpl,
    });

    const account = await client.data.account("0xABC");
    expect(seenUrl).toBe("https://example.com/api/v1/data/account?address=0xABC");
    expect(account.balanceFormatted).toBe("1 ETH");
  });

  it("posts a JSON body for rpc and simulate", async () => {
    let seenBody = "";
    const fetchImpl = stub((_url, init) => {
      seenBody = String(init.body);
      return ok({ chainId: 46630, method: "eth_blockNumber", result: "0x1" });
    });
    const client = new HoodStackClient({ apiKey: "hs_test_abc", fetch: fetchImpl });

    const res = await client.rpc("eth_blockNumber");
    expect(JSON.parse(seenBody)).toEqual({ method: "eth_blockNumber", params: [] });
    expect(res.result).toBe("0x1");
  });

  it("throws a typed HoodStackError on an error envelope", async () => {
    const fetchImpl = stub(() => fail(401, "HS_INVALID_API_KEY"));
    const client = new HoodStackClient({ apiKey: "bad", fetch: fetchImpl });

    await expect(client.health()).rejects.toSatisfy(isHoodStackError);
    await expect(client.health()).rejects.toMatchObject({ code: "HS_INVALID_API_KEY" });
  });

  it("throws a retryable error when the network fails", async () => {
    const fetchImpl = stub(() => {
      throw new Error("network down");
    });
    const client = new HoodStackClient({ apiKey: "hs_test_abc", fetch: fetchImpl });

    await expect(client.gas()).rejects.toMatchObject({
      code: "HS_PROVIDER_UNAVAILABLE",
      retryable: true,
    });
  });
});
