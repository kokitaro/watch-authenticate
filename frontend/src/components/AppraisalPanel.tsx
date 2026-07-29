import { useState } from "react";
import { motion } from "framer-motion";
import {
  GRADE_VALUES, type Grade,
  appendAppraisal, registerAppraiser,
} from "../lib/contract";
import type { WalletState } from "../lib/useWallet";
import s from "../styles/Panel.module.css";

export function AppraisalPanel({
  wallet,
  pieceId,
  onDone,
}: {
  wallet: WalletState;
  pieceId: string;
  onDone: () => void;
}) {
  const [candidate, setCandidate] = useState("");
  const [licenseUri, setLicenseUri] = useState("");
  const [photosUri, setPhotosUri] = useState("");
  const [grade, setGrade] = useState<Grade>(GRADE_VALUES[0]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const blocked = !wallet.isConnected || wallet.wrongChain;

  function guard(): string | null {
    if (!wallet.isConnected || !wallet.address) return "Connect your wallet first.";
    if (wallet.wrongChain) return "Wrong network — switch to GenLayer Studionet (chain 61999).";
    return null;
  }

  async function register() {
    setErr(""); setOk("");
    const g = guard();
    if (g) return setErr(g);
    if (!/^0x[0-9a-fA-F]{40}$/.test(candidate.trim())) {
      return setErr("Enter the appraiser wallet that the registry owner will approve.");
    }
    if (!licenseUri.trim()) return setErr("A license URI is required to register.");
    setBusy("register");
    try {
      const provider = await wallet.getProvider();
      await registerAppraiser(
        { address: wallet.address!, provider },
        { candidate: candidate.trim(), licenseUri: licenseUri.trim() },
      );
      setOk("Appraiser approved with a wallet-bound active credential.");
    } catch (e) {
      setErr(String((e as Error).message || e).slice(0, 280));
    } finally {
      setBusy("");
    }
  }

  async function appraise(e: React.FormEvent) {
    e.preventDefault();
    setErr(""); setOk("");
    const g = guard();
    if (g) return setErr(g);
    if (!pieceId) return setErr("Select a piece from the registry first.");
    if (!photosUri.trim()) return setErr("A photos URI is required (it is fetched on-chain).");
    setBusy("appraise");
    try {
      const provider = await wallet.getProvider();
      await appendAppraisal(
        { address: wallet.address!, provider },
        { pieceId, photosUri: photosUri.trim(), grade, notes },
      );
      setOk(`Appraisal appended to ${pieceId}.`);
      onDone();
    } catch (e) {
      setErr(String((e as Error).message || e).slice(0, 280));
    } finally {
      setBusy("");
    }
  }

  return (
    <motion.div
      className={s.panel}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.5 }}
    >
      <h3 className={s.panelTitle}>Appraise</h3>
      <p className={s.panelNote}>
        Only owner-approved appraisers may append an APPRAISAL link. Validators fetch
        the image bytes, inspect the actual watch with a multimodal model, and agree on
        both the evidence digest and result before the link is written.
      </p>

      <div className={s.walletWrap}>
        <div className={s.field}>
          <label className={s.label}>appraiser wallet (owner approval)</label>
          <input value={candidate} onChange={(e) => setCandidate(e.target.value)} placeholder="0x…" />
        </div>
        <div className={s.field}>
          <label className={s.label}>wallet-bound license uri</label>
          <input value={licenseUri} onChange={(e) => setLicenseUri(e.target.value)} placeholder="https://registry.example/license.json" />
        </div>
        <button type="button" onClick={register} disabled={busy !== "" || blocked}>
          {busy === "register" ? "approving…" : "approve appraiser →"}
        </button>
      </div>

      <form onSubmit={appraise} style={{ marginTop: "1rem" }}>
        <div className={s.field}>
          <label className={s.label}>piece (selected from registry)</label>
          <input value={pieceId} readOnly placeholder="— pick a piece below —" />
        </div>
        <div className={s.field}>
          <label className={s.label}>direct watch image uri</label>
          <input value={photosUri} onChange={(e) => setPhotosUri(e.target.value)} placeholder="https://…/dial.jpg" />
        </div>
        <div className={s.grid2}>
          <div className={s.field}>
            <label className={s.label}>your grade</label>
            <select value={grade} onChange={(e) => setGrade(e.target.value as Grade)}>
              {GRADE_VALUES.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>
          <div className={s.field}>
            <label className={s.label}>notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="movement, hallmarks, dial period…" />
          </div>
        </div>
        <div className={s.actions}>
          <button type="submit" className={s.btnPrimary} disabled={busy !== "" || !pieceId || blocked}>
            {busy === "appraise" ? "appraising…" : "append_appraisal →"}
          </button>
        </div>
      </form>

      {blocked && <p className={s.warn}>{wallet.wrongChain ? "Switch to GenLayer Studionet to file." : "Connect a wallet to file an appraisal."}</p>}
      {ok && <p className={s.statusOk}>{ok}</p>}
      {err && <pre className="err-pre">{err}</pre>}
    </motion.div>
  );
}
