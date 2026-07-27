# @hoodstack/cli

The command-line interface for [HoodStack](https://www.hoodstack.io), developer
infrastructure for Robinhood Chain.

Query Robinhood Chain and your project from a terminal. Every command is a real,
authenticated call and prints JSON, with proper exit codes for scripts and CI.

## Install

```bash
npm install -g @hoodstack/cli
```

Or run without installing:

```bash
npx @hoodstack/cli health
```

## Authentication

Commands read your project API key from `HOODSTACK_API_KEY`, or the `--key` flag.

```bash
export HOODSTACK_API_KEY=hs_test_your_key
```

Create a project and key in the [dashboard](https://www.hoodstack.io/app). A test
key acts against testnet; a live key against mainnet.

## Commands

```bash
hoodstack health                      # verify your key and show its chain
hoodstack gas                         # current gas price and base fee
hoodstack account <address>           # balance, nonce, contract detection
hoodstack token <address> [holder]    # ERC-20 metadata and a holder balance
hoodstack tx <hash>                   # a transaction with its receipt
hoodstack block [number|latest]       # a block header
hoodstack rpc <method> [jsonParams]   # a read-only JSON-RPC call
hoodstack simulate --to <addr> [--value <wei>] [--data <hex>]
```

Flags: `--key <apiKey>`, `--base <url>`.

## Examples

```bash
hoodstack account 0x0000000000000000000000000000000000000000
hoodstack rpc eth_blockNumber
hoodstack simulate --to 0xRECIPIENT --value 1000000000000000
```

On success a command prints JSON and exits `0`; on error it prints the `HS_`
code and message to stderr and exits `1`.

## Documentation

[hoodstack.io/docs](https://www.hoodstack.io/docs).

## License

Apache-2.0
