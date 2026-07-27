import { createClient, isHoodStackError, type HoodStackClient } from "@hoodstack/sdk";

/**
 * The CLI's pure core: parse args, dispatch to the SDK, and return the output as
 * data rather than printing it. Keeping I/O out of here makes every command
 * testable with an injected client and no process or network.
 */

export type Client = Pick<HoodStackClient, "health" | "gas" | "rpc" | "data" | "tx">;
export type ClientFactory = (options: { apiKey: string; baseUrl?: string }) => Client;

export interface RunOptions {
  env?: Record<string, string | undefined>;
  clientFactory?: ClientFactory;
}

export interface RunResult {
  code: number;
  out: string;
  err: string;
}

export const USAGE = `HoodStack CLI

Usage: hoodstack <command> [args] [--key <apiKey>] [--base <url>]

Commands:
  health                     Verify your key and show its chain
  gas                        Current gas price and base fee
  account <address>          Balance, nonce, and contract detection
  token <address> [holder]   ERC-20 metadata and an optional holder balance
  tx <hash>                  A transaction with its receipt
  block [number|latest]      A block header
  rpc <method> [jsonParams]  A read-only JSON-RPC call
  simulate --to <addr> [--value <wei>] [--data <hex>]

The API key is read from HOODSTACK_API_KEY or --key.`;

export async function run(argv: string[], options: RunOptions = {}): Promise<RunResult> {
  const env = options.env ?? {};
  const create = options.clientFactory ?? createClient;
  const { positionals, flags } = parseArgs(argv);
  const command = positionals[0];

  if (!command || command === "help" || flags["help"] === true) {
    return { code: 0, out: USAGE, err: "" };
  }

  const apiKey = strFlag(flags["key"]) ?? env["HOODSTACK_API_KEY"];
  if (!apiKey) {
    return { code: 1, out: "", err: "No API key. Set HOODSTACK_API_KEY or pass --key." };
  }

  const baseUrl = strFlag(flags["base"]);
  const client = create({ apiKey, ...(baseUrl ? { baseUrl } : {}) });

  try {
    const data = await dispatch(client, command, positionals.slice(1), flags);
    return { code: 0, out: JSON.stringify(data, null, 2), err: "" };
  } catch (error) {
    if (isHoodStackError(error)) {
      return { code: 1, out: "", err: `${error.code}: ${error.message}` };
    }
    return { code: 1, out: "", err: error instanceof Error ? error.message : "Command failed." };
  }
}

async function dispatch(
  client: Client,
  command: string,
  args: string[],
  flags: Record<string, string | true>,
): Promise<unknown> {
  switch (command) {
    case "health":
      return client.health();
    case "gas":
      return client.gas();
    case "account":
      return client.data.account(required(args[0], "account <address>"));
    case "token":
      return client.data.token(required(args[0], "token <address> [holder]"), args[1]);
    case "tx":
      return client.data.transaction(required(args[0], "tx <hash>"));
    case "block": {
      const raw = args[0];
      return client.data.block(!raw || raw === "latest" ? "latest" : Number(raw));
    }
    case "rpc": {
      const method = required(args[0], "rpc <method> [jsonParams]");
      const params = args[1] ? (JSON.parse(args[1]) as unknown[]) : [];
      return client.rpc(method, params);
    }
    case "simulate": {
      const to = required(strFlag(flags["to"]), "simulate --to <address>");
      const value = strFlag(flags["value"]);
      const data = strFlag(flags["data"]);
      return client.tx.simulate({
        to,
        ...(value ? { valueWei: value } : {}),
        ...(data ? { data } : {}),
      });
    }
    default:
      throw new Error(`Unknown command "${command}". Run "hoodstack help".`);
  }
}

function required(value: string | undefined, usage: string): string {
  if (!value) throw new Error(`Usage: hoodstack ${usage}`);
  return value;
}

function strFlag(value: string | true | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function parseArgs(argv: string[]): {
  positionals: string[];
  flags: Record<string, string | true>;
} {
  const positionals: string[] = [];
  const flags: Record<string, string | true> = {};
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (token === undefined) continue;
    if (token.startsWith("--")) {
      const name = token.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        flags[name] = next;
        i++;
      } else {
        flags[name] = true;
      }
    } else {
      positionals.push(token);
    }
  }
  return { positionals, flags };
}
