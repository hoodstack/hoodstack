import { run } from "./run.js";

/**
 * The executable entry. It is a thin shell around `run`: read argv, print the
 * result to the right stream, and set the exit code. All logic lives in `run`.
 */
async function main(): Promise<void> {
  const result = await run(process.argv.slice(2), { env: process.env });
  if (result.out) process.stdout.write(result.out + "\n");
  if (result.err) process.stderr.write(result.err + "\n");
  process.exit(result.code);
}

void main();
