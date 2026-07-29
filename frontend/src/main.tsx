import React from "react";
import ReactDOM from "react-dom/client";
import "@rainbow-me/rainbowkit/styles.css";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig } from "./wagmi";
import { Router } from "./App";
import { BrassAvatar } from "./components/BrassAvatar";
import "./styles/global.css";
import "./styles/tokens.css";

const queryClient = new QueryClient();

// RainbowKit dark theme seeded with the app's brass accent; the rest of the
// modal palette is overridden in tokens.css via [data-rk] CSS variables.
const rkTheme = darkTheme({
  accentColor: "#d4a843",
  accentColorForeground: "#1a1410",
  borderRadius: "small",
  overlayBlur: "small",
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={rkTheme} modalSize="compact" avatar={BrassAvatar}>
          <Router />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>
);
