import { ConnectButton } from "@rainbow-me/rainbowkit";

// Standard RainbowKit connect button. When connected to the wrong network
// it renders a "Wrong network" switch prompt automatically (only studionet
// is registered in wagmiConfig). Theming comes from tokens.css ([data-rk]).
export function Connect() {
  return (
    <div className="rk-connect-slot">
      <ConnectButton
        showBalance={false}
        accountStatus={{ smallScreen: "avatar", largeScreen: "full" }}
        chainStatus={{ smallScreen: "icon", largeScreen: "full" }}
      />
    </div>
  );
}
