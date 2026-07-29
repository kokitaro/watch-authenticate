import { useState } from "react";
import { motion } from "framer-motion";
import {
  getEntryAt, getAppraiser, getServiceCenter, getRecentActivity,
  KIND_NAMES, type ProvenanceEntry, type AppraiserMeta, type ServiceCenterMeta,
} from "../lib/contract";
import s from "../styles/Lookups.module.css";

function shortAddr(a: string): string {
  return a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || "—";
}

const card = {
  initial: { opacity: 0, y: 16 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.45 },
} as const;

// Read-only panels for the four "reading room" views. None require a wallet.
export function Lookups({ pieceId, chainLength }: { pieceId: string; chainLength: number }) {
  return (
    <div className={s.grid}>
      <EntryAtCard pieceId={pieceId} chainLength={chainLength} />
      <AppraiserCard />
      <ServiceCenterCard />
      <RecentCard />
    </div>
  );
}

function EntryAtCard({ pieceId, chainLength }: { pieceId: string; chainLength: number }) {
  const [index, setIndex] = useState("0");
  const [entry, setEntry] = useState<ProvenanceEntry | null>(null);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  async function run() {
    setErr(""); setEntry(null);
    if (!pieceId) return setErr("Select a piece first.");
    setBusy(true);
    try {
      const e = await getEntryAt(pieceId, Math.max(0, Math.floor(Number(index) || 0)));
      if (!e) setErr("No entry at that index.");
      else setEntry(e);
    } catch (e) { setErr(String((e as Error).message || e).slice(0, 200)); }
    finally { setBusy(false); }
  }

  return (
    <motion.div className={s.card} {...card}>
      <h3 className={s.cardTitle}>entry_at</h3>
      <p className={s.cardNote}>Fetch a single link by its position in the selected piece's chain{chainLength ? ` (0–${chainLength - 1})` : ""}.</p>
      <div className={s.row}>
        <input value={index} onChange={(e) => setIndex(e.target.value)} inputMode="numeric" placeholder="index" />
        <button type="button" onClick={run} disabled={busy || !pieceId}>{busy ? "…" : "read"}</button>
      </div>
      {entry && (
        <div className={s.result}>
          <div><b>{entry.kind_name}</b> · seq #{entry.seq} · index {entry.chain_index}</div>
          <div className={s.resultMeta}>by {shortAddr(entry.actor)} · fee {entry.fee_paid}</div>
          <pre className={s.payload}>{entry.payload}</pre>
        </div>
      )}
      {err && <p className={s.err}>{err}</p>}
    </motion.div>
  );
}

function AppraiserCard() {
  const [addr, setAddr] = useState("");
  const [meta, setMeta] = useState<AppraiserMeta | null>(null);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  async function run() {
    setErr(""); setMeta(null);
    if (!/^0x[0-9a-fA-F]{40}$/.test(addr.trim())) return setErr("Enter a valid 0x… address.");
    setBusy(true);
    try { setMeta(await getAppraiser(addr.trim())); }
    catch (e) { setErr(String((e as Error).message || e).slice(0, 200)); }
    finally { setBusy(false); }
  }

  return (
    <motion.div className={s.card} {...card}>
      <h3 className={s.cardTitle}>appraiser</h3>
      <p className={s.cardNote}>Look up an address's appraiser standing and filing counts.</p>
      <div className={s.row}>
        <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="0x…" />
        <button type="button" onClick={run} disabled={busy}>{busy ? "…" : "read"}</button>
      </div>
      {meta && (
        <div className={s.result}>
          <div><b>{meta.registered ? "registered" : "not registered"}</b> · {shortAddr(meta.addr)}</div>
          {meta.registered && (
            <div className={s.resultMeta}>
              verified {String(meta.license_verified)} · appraisals {meta.appraisals_filed} ·
              {" "}co {meta.co_appraisals_filed} · last seq {meta.last_active_seq}
            </div>
          )}
        </div>
      )}
      {err && <p className={s.err}>{err}</p>}
    </motion.div>
  );
}

function ServiceCenterCard() {
  const [shopId, setShopId] = useState("");
  const [meta, setMeta] = useState<ServiceCenterMeta | null>(null);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  async function run() {
    setErr(""); setMeta(null);
    if (!shopId.trim()) return setErr("Enter a shop_id.");
    setBusy(true);
    try { setMeta(await getServiceCenter(shopId.trim())); }
    catch (e) { setErr(String((e as Error).message || e).slice(0, 200)); }
    finally { setBusy(false); }
  }

  return (
    <motion.div className={s.card} {...card}>
      <h3 className={s.cardTitle}>service_center</h3>
      <p className={s.cardNote}>Resolve a registered service center by its shop_id.</p>
      <div className={s.row}>
        <input value={shopId} onChange={(e) => setShopId(e.target.value)} placeholder="geneva-atelier" />
        <button type="button" onClick={run} disabled={busy}>{busy ? "…" : "read"}</button>
      </div>
      {meta && (
        <div className={s.result}>
          <div><b>{meta.registered ? "registered" : "not registered"}</b> · {meta.shop_id}</div>
          {meta.registered && (
            <div className={s.resultMeta}>
              {shortAddr(meta.addr || "")} · verified {String(meta.license_verified)} ·
              {" "}services {meta.services_recorded} · last seq {meta.last_active_seq}
            </div>
          )}
        </div>
      )}
      {err && <p className={s.err}>{err}</p>}
    </motion.div>
  );
}

function RecentCard() {
  const [limit, setLimit] = useState("10");
  const [rows, setRows] = useState<ProvenanceEntry[]>([]);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  async function run() {
    setErr(""); setRows([]);
    const lim = Math.min(256, Math.max(1, Math.floor(Number(limit) || 1)));
    setBusy(true);
    try { setRows(await getRecentActivity(lim)); }
    catch (e) { setErr(String((e as Error).message || e).slice(0, 200)); }
    finally { setBusy(false); }
  }

  return (
    <motion.div className={`${s.card} ${s.cardWide}`} {...card}>
      <h3 className={s.cardTitle}>recent_registry_activity</h3>
      <p className={s.cardNote}>The global tail of links written across every chain, most recent first.</p>
      <div className={s.row}>
        <input value={limit} onChange={(e) => setLimit(e.target.value)} inputMode="numeric" placeholder="limit (1–256)" />
        <button type="button" onClick={run} disabled={busy}>{busy ? "…" : "read"}</button>
      </div>
      {rows.length > 0 && (
        <div className={s.recentList}>
          {rows.map((e, i) => (
            <div className={s.recentRow} key={`${e.seq}-${i}`}>
              <span className={s.recSeq}>#{e.seq}</span>
              <span className={s.recKind}>{e.kind_name || KIND_NAMES[e.kind] || "ENTRY"}</span>
              <span className={s.recPiece}>{e.piece_id || "—"}</span>
              <span className={s.recActor}>{shortAddr(e.actor)}</span>
            </div>
          ))}
        </div>
      )}
      {err && <p className={s.err}>{err}</p>}
    </motion.div>
  );
}
