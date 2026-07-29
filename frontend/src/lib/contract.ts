// ── Horologe contract client ────────────────────────────────────────────
// Thin typed wrapper around genlayer-js for the deployed Horologe registry.
// Reads use an ephemeral read account. Writes are signed by the user's
// connected wallet (MetaMask/Rabby/…): we pass the wallet ADDRESS plus its
// EIP-1193 provider, and genlayer-js routes eth_sendTransaction through the
// wallet. No private key ever touches the page.
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { TransactionStatus } from "genlayer-js/types";
import {
  AUTHENTICATED_PROVENANCE_ENABLED,
  CONTRACT_ADDRESS,
  RPC_URL,
} from "./deployment";

type Hex = `0x${string}`;
const TIMEOUT_MS = 300_000;

// Brands accepted by the contract at mint time (mirror of KNOWN_BRANDS).
export const KNOWN_BRANDS = [
  "Rolex", "Patek Philippe", "Audemars Piguet", "Vacheron Constantin",
  "Richard Mille", "Omega", "Cartier", "IWC", "Jaeger-LeCoultre",
  "Breguet", "Blancpain", "Lange & Soehne", "F.P. Journe",
  "Greubel Forsey", "Hublot", "Tudor",
] as const;

// Appraisal grade vocabulary (mirror of GRADE_VALUES).
export const GRADE_VALUES = [
  "AUTHENTIC", "SERVICED", "INCONCLUSIVE", "COUNTERFEIT",
] as const;
export type Grade = (typeof GRADE_VALUES)[number];

// Human label for each EntryKind value emitted by the contract.
export const KIND_NAMES: Record<number, string> = {
  1: "MINT", 2: "APPRAISAL", 3: "CO_APPRAISAL", 4: "SERVICE",
  5: "TRANSFER", 6: "VERIFICATION", 7: "AUTHENTICATION", 8: "METADATA_UPDATE",
};

export interface ProvenanceEntry {
  seq: number;
  chain_index: number;
  piece_id: string;
  kind: number;
  kind_name: string;
  actor: string;
  prev_hash: string;
  payload: string;
  fee_paid: number;
}

export interface PieceMeta {
  piece_id: string;
  serial_hash: string;
  brand: string;
  model: string;
  claimed_year: number;
  minter: string;
  current_owner: string;
  ref_uri: string;
  minted_at_seq: number;
  pool_balance: number;
}

export interface AppraiserMeta {
  addr: string;
  registered: boolean;
  license_uri?: string;
  license_verified?: boolean;
  appraisals_filed?: number;
  co_appraisals_filed?: number;
  last_active_seq?: number;
}

export interface ServiceCenterMeta {
  shop_id: string;
  registered: boolean;
  addr?: string;
  license_uri?: string;
  license_verified?: boolean;
  services_recorded?: number;
  last_active_seq?: number;
}

// ── clients ──────────────────────────────────────────────────────────────
let _readClient: ReturnType<typeof createClient> | null = null;
function readClient() {
  if (!_readClient) {
    _readClient = createClient({ chain: studionet, account: createAccount() });
  }
  return _readClient;
}
function writeClient(ctx: WriteCtx) {
  if (!AUTHENTICATED_PROVENANCE_ENABLED) {
    throw new Error(
      "Writes are disabled: the configured contract is the legacy pre-hardening deployment. " +
      "Redeploy the v2 contract and set VITE_SECURITY_RELEASE=authenticated-provenance-v2.",
    );
  }
  // Passing the ADDRESS (a string, not an Account object) makes genlayer-js
  // route signing methods (eth_sendTransaction, …) to `provider` — the
  // connected wallet — rather than to a local private key.
  return createClient({
    chain: studionet,
    endpoint: RPC_URL,
    account: ctx.address,
    provider: ctx.provider as never,
  });
}

// A write context built from the user's connected wallet.
export interface WriteCtx {
  address: Hex;
  provider: unknown; // EIP-1193 provider from the wallet connector
}

async function waitAccepted(client: any, hash: Hex) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("Transaction timed out")), TIMEOUT_MS);
  });
  try {
    await Promise.race([
      client.waitForTransactionReceipt({
        hash: hash as never,
        status: TransactionStatus.ACCEPTED,
        interval: 5000,
        retries: 60,
      }),
      timeout,
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function pick(obj: any, key: string, idx: number): any {
  if (obj == null) return undefined;
  if (Array.isArray(obj)) return obj[idx];
  if (typeof obj === "object" && key in obj) return obj[key];
  return undefined;
}

async function read(functionName: string, args: any[]): Promise<any> {
  return readClient().readContract({
    address: CONTRACT_ADDRESS,
    functionName,
    args,
  });
}

// ── normalizers ────────────────────────────────────────────────────────
function toEntry(r: any): ProvenanceEntry {
  const kind = Number(pick(r, "kind", 3) ?? 0);
  return {
    seq: Number(pick(r, "seq", 0) ?? 0),
    chain_index: Number(pick(r, "chain_index", 1) ?? 0),
    piece_id: String(pick(r, "piece_id", 2) ?? ""),
    kind,
    kind_name: String(pick(r, "kind_name", 4) ?? KIND_NAMES[kind] ?? `KIND_${kind}`),
    actor: String(pick(r, "actor", 5) ?? ""),
    prev_hash: String(pick(r, "prev_hash", 6) ?? ""),
    payload: String(pick(r, "payload", 7) ?? ""),
    fee_paid: Number(pick(r, "fee_paid", 8) ?? 0),
  };
}

function toPiece(r: any): PieceMeta {
  return {
    piece_id: String(pick(r, "piece_id", 0) ?? ""),
    serial_hash: String(pick(r, "serial_hash", 1) ?? ""),
    brand: String(pick(r, "brand", 2) ?? ""),
    model: String(pick(r, "model", 3) ?? ""),
    claimed_year: Number(pick(r, "claimed_year", 4) ?? 0),
    minter: String(pick(r, "minter", 5) ?? ""),
    current_owner: String(pick(r, "current_owner", 6) ?? ""),
    ref_uri: String(pick(r, "ref_uri", 7) ?? ""),
    minted_at_seq: Number(pick(r, "minted_at_seq", 8) ?? 0),
    pool_balance: Number(pick(r, "pool_balance", 9) ?? 0),
  };
}

// ── READS ─────────────────────────────────────────────────────────────────
export async function getCustodyChain(pieceId: string): Promise<ProvenanceEntry[]> {
  const r: any = await read("custody_chain", [pieceId]);
  if (!Array.isArray(r)) return [];
  return r.map(toEntry);
}

export async function getPiece(pieceId: string): Promise<PieceMeta> {
  return toPiece(await read("piece", [pieceId]));
}

export async function getChainLength(pieceId: string): Promise<number> {
  return Number((await read("chain_length", [pieceId])) ?? 0);
}

export async function getPiecesByBrand(brand: string): Promise<string[]> {
  const r: any = await read("pieces_by_brand", [brand]);
  return Array.isArray(r) ? r.map((x) => String(x)) : [];
}

export async function getAppraiser(addr: string): Promise<AppraiserMeta> {
  const r: any = await read("appraiser", [addr]);
  return {
    addr: String(pick(r, "addr", 0) ?? addr),
    registered: Boolean(pick(r, "registered", 1) ?? false),
    license_uri: pick(r, "license_uri", 2),
    license_verified: Boolean(pick(r, "license_verified", 3) ?? false),
    appraisals_filed: Number(pick(r, "appraisals_filed", 4) ?? 0),
    co_appraisals_filed: Number(pick(r, "co_appraisals_filed", 5) ?? 0),
    last_active_seq: Number(pick(r, "last_active_seq", 6) ?? 0),
  };
}

export async function getServiceCenter(shopId: string): Promise<ServiceCenterMeta> {
  const r: any = await read("service_center", [shopId]);
  return {
    shop_id: String(pick(r, "shop_id", 0) ?? shopId),
    registered: Boolean(pick(r, "registered", 1) ?? false),
    addr: pick(r, "addr", 2),
    license_uri: pick(r, "license_uri", 3),
    license_verified: Boolean(pick(r, "license_verified", 4) ?? false),
    services_recorded: Number(pick(r, "services_recorded", 5) ?? 0),
    last_active_seq: Number(pick(r, "last_active_seq", 6) ?? 0),
  };
}

export async function getLatestEntry(pieceId: string): Promise<ProvenanceEntry | null> {
  const r: any = await read("latest_entry", [pieceId]);
  if (!r || (typeof r === "object" && Object.keys(r).length === 0)) return null;
  return toEntry(r);
}

export async function getEntryAt(pieceId: string, index: number): Promise<ProvenanceEntry | null> {
  const r: any = await read("entry_at", [pieceId, index]);
  if (!r || (typeof r === "object" && Object.keys(r).length === 0)) return null;
  return toEntry(r);
}

export async function getRecentActivity(limit: number): Promise<ProvenanceEntry[]> {
  const r: any = await read("recent_registry_activity", [limit]);
  if (!Array.isArray(r)) return [];
  return r.filter((x) => x && (Array.isArray(x) ? x.length : Object.keys(x).length)).map(toEntry);
}

// Discover every minted piece by scanning the per-brand indices.
export async function discoverPieces(): Promise<{ brand: string; pieceId: string }[]> {
  const lists = await Promise.all(
    KNOWN_BRANDS.map(async (brand) => {
      try {
        const ids = await getPiecesByBrand(brand);
        return ids.map((pieceId) => ({ brand, pieceId }));
      } catch {
        return [];
      }
    })
  );
  return lists.flat();
}

// ── WRITES (signed by the connected wallet) ────────────────────────────────
export async function registerAppraiser(
  ctx: WriteCtx,
  args: { candidate: string; licenseUri: string },
): Promise<void> {
  const wc = writeClient(ctx);
  const h = (await wc.writeContract({
    address: CONTRACT_ADDRESS, functionName: "register_appraiser",
    args: [args.candidate.trim(), args.licenseUri.trim()], value: 0n,
  })) as Hex;
  await waitAccepted(wc, h);
}

export async function mintPiece(
  ctx: WriteCtx,
  args: { pieceId: string; serialHash: string; brand: string; model: string; claimedYear: number; refUri: string },
  fee: bigint = 1n,
): Promise<void> {
  const wc = writeClient(ctx);
  const h = (await wc.writeContract({
    address: CONTRACT_ADDRESS, functionName: "mint_piece",
    args: [args.pieceId.trim(), args.serialHash.trim(), args.brand, args.model.trim(), args.claimedYear, args.refUri.trim()],
    value: fee,
  })) as Hex;
  await waitAccepted(wc, h);
}

export async function appendAppraisal(
  ctx: WriteCtx,
  args: { pieceId: string; photosUri: string; grade: Grade; notes: string },
  fee: bigint = 1n,
): Promise<void> {
  const wc = writeClient(ctx);
  const h = (await wc.writeContract({
    address: CONTRACT_ADDRESS, functionName: "append_appraisal",
    args: [args.pieceId.trim(), args.photosUri.trim(), args.grade, args.notes.trim()],
    value: fee,
  })) as Hex;
  await waitAccepted(wc, h);
}

export async function appendVerification(
  ctx: WriteCtx,
  args: { pieceId: string; witnessUri: string; statement: string },
  fee: bigint = 1n,
): Promise<void> {
  const wc = writeClient(ctx);
  const h = (await wc.writeContract({
    address: CONTRACT_ADDRESS, functionName: "append_verification",
    args: [args.pieceId.trim(), args.witnessUri.trim(), args.statement.trim()],
    value: fee,
  })) as Hex;
  await waitAccepted(wc, h);
}

export async function appendCoAppraisal(
  ctx: WriteCtx,
  args: { pieceId: string; referencesSeq: number; grade: Grade; basis: string },
  fee: bigint = 1n,
): Promise<void> {
  const wc = writeClient(ctx);
  const h = (await wc.writeContract({
    address: CONTRACT_ADDRESS, functionName: "append_co_appraisal",
    args: [args.pieceId.trim(), args.referencesSeq, args.grade, args.basis.trim()],
    value: fee,
  })) as Hex;
  await waitAccepted(wc, h);
}

export async function appendService(
  ctx: WriteCtx,
  args: { pieceId: string; shopId: string; workDone: string; partsReplaced: string },
  fee: bigint = 1n,
): Promise<void> {
  const wc = writeClient(ctx);
  const h = (await wc.writeContract({
    address: CONTRACT_ADDRESS, functionName: "append_service",
    args: [args.pieceId.trim(), args.shopId.trim(), args.workDone.trim(), args.partsReplaced.trim()],
    value: fee,
  })) as Hex;
  await waitAccepted(wc, h);
}

export async function appendTransfer(
  ctx: WriteCtx,
  args: { pieceId: string; newOwner: string; note: string },
  fee: bigint = 1n,
): Promise<void> {
  const wc = writeClient(ctx);
  const h = (await wc.writeContract({
    address: CONTRACT_ADDRESS, functionName: "append_transfer",
    args: [args.pieceId.trim(), args.newOwner.trim(), args.note.trim()],
    value: fee,
  })) as Hex;
  await waitAccepted(wc, h);
}

export async function appendAuthentication(
  ctx: WriteCtx,
  args: { pieceId: string; house: string; lotRef: string; statement: string },
  fee: bigint = 1n,
): Promise<void> {
  const wc = writeClient(ctx);
  const h = (await wc.writeContract({
    address: CONTRACT_ADDRESS, functionName: "append_authentication",
    args: [args.pieceId.trim(), args.house.trim(), args.lotRef.trim(), args.statement.trim()],
    value: fee,
  })) as Hex;
  await waitAccepted(wc, h);
}

export async function registerServiceCenter(
  ctx: WriteCtx,
  args: { shopId: string; candidate: string; licenseUri: string },
): Promise<void> {
  const wc = writeClient(ctx);
  const h = (await wc.writeContract({
    address: CONTRACT_ADDRESS, functionName: "register_service_center",
    args: [args.shopId.trim(), args.candidate.trim(), args.licenseUri.trim()], value: 0n,
  })) as Hex;
  await waitAccepted(wc, h);
}

export async function registerAuthenticationHouse(
  ctx: WriteCtx,
  args: { houseId: string; candidate: string; licenseUri: string },
): Promise<void> {
  const wc = writeClient(ctx);
  const h = (await wc.writeContract({
    address: CONTRACT_ADDRESS, functionName: "register_authentication_house",
    args: [args.houseId.trim(), args.candidate.trim(), args.licenseUri.trim()], value: 0n,
  })) as Hex;
  await waitAccepted(wc, h);
}

export async function updatePieceMetadata(
  ctx: WriteCtx,
  args: { pieceId: string; newRefUri: string },
): Promise<void> {
  const wc = writeClient(ctx);
  const h = (await wc.writeContract({
    address: CONTRACT_ADDRESS, functionName: "update_piece_metadata",
    args: [args.pieceId.trim(), args.newRefUri.trim()], value: 0n,
  })) as Hex;
  await waitAccepted(wc, h);
}

// Compute a sha-256 hex digest of a serial reference (browser Web Crypto).
export async function sha256Hex(input: string): Promise<string> {
  try {
    const data = new TextEncoder().encode(input);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // Deterministic fallback (non-cryptographic) if subtle crypto is blocked.
    let h = 0;
    for (let i = 0; i < input.length; i++) h = (Math.imul(31, h) + input.charCodeAt(i)) | 0;
    return (h >>> 0).toString(16).padStart(64, "0");
  }
}
