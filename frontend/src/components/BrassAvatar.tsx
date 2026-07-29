import type { AvatarComponent } from "@rainbow-me/rainbowkit";

// Palette-matched account avatar for RainbowKit. Replaces the default teal
// emoji blockie with a brass disc seeded by the address, so the connected
// pill stays in the Horologe palette (bronze → brass) instead of clashing.
export const BrassAvatar: AvatarComponent = ({ address, ensImage, size }) => {
  if (ensImage) {
    return (
      <img
        src={ensImage}
        width={size}
        height={size}
        style={{ borderRadius: "50%" }}
        alt=""
      />
    );
  }
  // Seed a warm angle from the address so each wallet gets a distinct disc.
  const seed = parseInt(address.slice(2, 8), 16) || 0;
  const angle = seed % 360;
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `conic-gradient(from ${angle}deg, #6d4520, #d4a843, #e8c466, #8b5a2b, #6d4520)`,
        boxShadow: "0 0 8px rgba(212, 168, 67, 0.55)",
      }}
      aria-hidden="true"
    />
  );
};
