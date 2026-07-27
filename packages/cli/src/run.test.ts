import { HoodStackError } from "@hoodstack/sdk";
import { describe, expect, it, vi } from "vitest";

import { run, type Client, type ClientFactory } from "./run.js";

function fakeClient(overrides: Partial<Client> = {}): Client {
  return {
    health: vi.fn(async () => ({ status: "ok" })),
    gas: vi.fn(async () => ({ gasPriceGwei: "1" })),
    rpc: vi.fn(async () => ({ result: "0x1" })),
    data: {
      account: vi.fn(async () => ({ address: "0xabc", balanceFormatted: "1 ETH" })),
      transaction: vi.fn(async () => ({ found: true })),
      block: vi.fn(async () => ({ number: 1 })),
      token: vi.fn(async () => ({ symbol: "TEST" })),
    },
    tx: { simulate: vi.fn(async () => ({ success: true })) },
    ...overrides,
  } as unknown as Client;
}

const factory = (client: Client): ClientFactory => () => client;

describe("run", () => {
  it("prints usage with no command", async () => {
    const result = await run([], {});
    expect(result.code).toBe(0);
    expect(result.out).toContain("Usage: hoodstack");
  });

  it("requires an api key", async () => {
    const result = await run(["health"], { env: {} });
    expect(result.code).toBe(1);
    expect(result.err).toContain("No API key");
  });

  it("reads the key from the environment and calls health", async () => {
    const client = fakeClient();
    const result = await run(["health"], {
      env: { HOODSTACK_API_KEY: "hs_test_x" },
      clientFactory: factory(client),
    });
    expect(result.code).toBe(0);
    expect(JSON.parse(result.out)).toEqual({ status: "ok" });
    expect(client.health).toHaveBeenCalled();
  });

  it("passes the account address through", async () => {
    const client = fakeClient();
    await run(["account", "0xABC", "--key", "hs_test_x"], {
      clientFactory: factory(client),
    });
    expect(client.data.account).toHaveBeenCalledWith("0xABC");
  });

  it("errors on a missing required argument", async () => {
    const result = await run(["account", "--key", "hs_test_x"], {
      clientFactory: factory(fakeClient()),
    });
    expect(result.code).toBe(1);
    expect(result.err).toContain("Usage: hoodstack account");
  });

  it("formats a HoodStackError as code and message", async () => {
    const client = fakeClient({
      health: vi.fn(async () => {
        throw new HoodStackError("HS_INVALID_API_KEY", { message: "bad key" });
      }),
    });
    const result = await run(["health", "--key", "bad"], {
      clientFactory: factory(client),
    });
    expect(result.code).toBe(1);
    expect(result.err).toBe("HS_INVALID_API_KEY: bad key");
  });

  it("parses simulate flags", async () => {
    const client = fakeClient();
    await run(["simulate", "--to", "0xdef", "--value", "1000", "--key", "hs_test_x"], {
      clientFactory: factory(client),
    });
    expect(client.tx.simulate).toHaveBeenCalledWith({ to: "0xdef", valueWei: "1000" });
  });
});
