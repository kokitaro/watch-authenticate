import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { studionet } from "./chains";

// WalletConnect projectId: use an env var if present, else a local literal.
// Injected wallets (MetaMask, Rabby, …) work regardless of this value.
const projectId =
  (import.meta.env.VITE_WALLETCONNECT_PROJECT_ID as string | undefined) ||
  "GENLAYER_LOCAL";

export const wagmiConfig = getDefaultConfig({
  appName: "Horologe",
  projectId,
  chains: [studionet],
  ssr: false,
});
