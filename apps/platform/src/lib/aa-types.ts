import type { Address, Hex } from "viem";

/**
 * Wire types for the ERC-4337 write path, shared by the server adapter and the
 * client signing UI. Kept free of `server-only` so the client can import them.
 */

export type CallRequest = { to: Address; valueWei: string; data?: Hex };

/** A UserOperation with numeric fields as hex strings, safe to send over the wire. */
export type SerializedUserOp = {
  sender: Address;
  nonce: Hex;
  factory?: Address;
  factoryData?: Hex;
  callData: Hex;
  callGasLimit: Hex;
  verificationGasLimit: Hex;
  preVerificationGas: Hex;
  maxFeePerGas: Hex;
  maxPriorityFeePerGas: Hex;
  signature: Hex;
};

export type SubmitResult = {
  userOpHash: Hex;
  transactionHash: Hex;
  success: boolean;
};
