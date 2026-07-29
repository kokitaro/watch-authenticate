import { defineChain } from "viem";
import { RPC_URL } from "./lib/deployment";

// GenLayer Studionet as a viem chain, for wagmi / RainbowKit.
// The prompt's canonical RPC is the local node (http://127.0.0.1:4000/api),
// but that node is down in this environment and the contract is deployed on
// hosted studionet, so we use the endpoint recorded in deployment.json
// (RPC_URL) as the working default and keep the local one as an alternate.
export const LOCAL_RPC = "http://127.0.0.1:4000/api";

export const studionet = defineChain({
  id: 61999,
  name: "GenLayer Studionet",
  network: "studionet",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
    public: { http: [RPC_URL] },
  },
  testnet: true,
});

// Local-node variant (use if you run GenLayer Studio at 127.0.0.1:4000).
export const studionetLocal = defineChain({
  id: 61999,
  name: "GenLayer Studionet (local)",
  network: "studionet-local",
  nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
  rpcUrls: {
    default: { http: [LOCAL_RPC] },
    public: { http: [LOCAL_RPC] },
  },
  testnet: true,
});
