import { useState } from "react";
import { motion } from "framer-motion";
import { KNOWN_BRANDS, mintPiece, sha256Hex } from "../lib/contract";
import type { WalletState } from "../lib/useWallet";
import s from "../styles/Panel.module.css";

export function MintPiecePanel({
  wallet,
  onDone,
}: {
  wallet: WalletState;
  onDone: (pieceId: string) => void;
}) {
  const [pieceId, setPieceId] = useState("");
  const [serial, setSerial] = useState("");
  const [brand, setBrand] = useState<string>(KNOWN_BRANDS[0]);
  const [model, setModel] = useState("");
  const [year, setYear] = useState("2021");
  const [refUri, setRefUri] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const blocked = !wallet.isConnected || wallet.wrongChain;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr("");
    setOk("");
    if (!wallet.isConnected || !wallet.address) return setErr("Connect your wallet first.");
    if (wallet.wrongChain) return setErr("Wrong network — switch to GenLayer Studionet (chain 61999).");
    if (pieceId.trim().length < 4) return setErr("piece_id must be at least 4 characters.");
    if (!serial.trim()) return setErr("A serial reference is required.");
    setBusy(true);
    try {
      const provider = await wallet.getProvider();
      const serialHash = await sha256Hex(serial.trim());
      await mintPiece(
        { address: wallet.address, provider },
        {
          pieceId: pieceId.trim(),
          serialHash,
          brand,
          model,
          claimedYear: Math.max(0, Math.floor(Number(year) || 0)),
          refUri,
        },
      );
      setOk(`Minted ${pieceId.trim()} — chain opened.`);
      onDone(pieceId.trim());
    } catch (e) {
      setErr(String((e as Error).message || e).slice(0, 280));
    } finally {
      setBusy(false);
    }
  }

  return (
    <motion.form
      className={s.panel}
      onSubmit={submit}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className={s.panelTitle}>Mint a piece</h3>
      <p className={s.panelNote}>Open a new append-only chain. You become its first owner; a MINT link is written.</p>

      <div className={s.grid2}>
        <div className={s.field}>
          <label className={s.label}>piece_id</label>
          <input value={pieceId} onChange={(e) => setPieceId(e.target.value)} placeholder="e.g. rolex-1675-1971-a" />
        </div>
        <div className={s.field}>
          <label className={s.label}>brand</label>
          <select value={brand} onChange={(e) => setBrand(e.target.value)}>
            {KNOWN_BRANDS.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </select>
        </div>
      </div>

      <div className={s.field}>
        <label className={s.label}>serial reference (hashed client-side → serial_hash)</label>
        <input value={serial} onChange={(e) => setSerial(e.target.value)} placeholder="case-back serial / reference" />
      </div>

      <div className={s.grid2}>
        <div className={s.field}>
          <label className={s.label}>model</label>
          <input value={model} onChange={(e) => setModel(e.target.value)} placeholder="GMT-Master 1675" />
        </div>
        <div className={s.field}>
          <label className={s.label}>claimed year</label>
          <input value={year} onChange={(e) => setYear(e.target.value)} inputMode="numeric" />
        </div>
      </div>

      <div className={s.field}>
        <label className={s.label}>reference uri (dossier / papers)</label>
        <input value={refUri} onChange={(e) => setRefUri(e.target.value)} placeholder="https://…" />
      </div>

      <div className={s.actions}>
        <button type="submit" className={s.btnPrimary} disabled={busy || blocked}>
          {busy ? "minting…" : "mint_piece →"}
        </button>
      </div>
      {blocked && <p className={s.warn}>{wallet.wrongChain ? "Switch to GenLayer Studionet to mint." : "Connect a wallet to mint."}</p>}
      {ok && <p className={s.statusOk}>{ok}</p>}
      {err && <pre className="err-pre">{err}</pre>}
    </motion.form>
  );
}
