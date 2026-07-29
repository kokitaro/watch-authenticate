import { useState } from "react";
import { motion } from "framer-motion";
import {
  GRADE_VALUES, type Grade,
  appendCoAppraisal, appendService, appendTransfer,
  appendVerification, appendAuthentication,
  registerServiceCenter, registerAuthenticationHouse, updatePieceMetadata,
} from "../lib/contract";
import type { WalletState } from "../lib/useWallet";
import s from "../styles/Panel.module.css";

// Shared guard + status hook for every write panel below. Keeps each panel
// small while preserving the "connect first / right chain" discipline.
function useWriteGuard(wallet: WalletState) {
  const blocked = !wallet.isConnected || wallet.wrongChain;
  function guard(): string | null {
    if (!wallet.isConnected || !wallet.address) return "Connect your wallet first.";
    if (wallet.wrongChain) return "Wrong network — switch to GenLayer Studionet (chain 61999).";
    return null;
  }
  return { blocked, guard };
}

const card = {
  initial: { opacity: 0, y: 18 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.5 },
} as const;

// ── Co-appraisal ───────────────────────────────────────────────────────────
export function CoAppraisalPanel({ wallet, pieceId, onDone }: {
  wallet: WalletState; pieceId: string; onDone: () => void;
}) {
  const { blocked, guard } = useWriteGuard(wallet);
  const [seq, setSeq] = useState("");
  const [grade, setGrade] = useState<Grade>(GRADE_VALUES[0]);
  const [basis, setBasis] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(""); const [ok, setOk] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk("");
    const g = guard(); if (g) return setErr(g);
    if (!pieceId) return setErr("Select a piece from the registry first.");
    if (!seq.trim()) return setErr("Reference the seq of the original APPRAISAL entry.");
    setBusy(true);
    try {
      const provider = await wallet.getProvider();
      await appendCoAppraisal(
        { address: wallet.address!, provider },
        { pieceId, referencesSeq: Math.floor(Number(seq) || 0), grade, basis },
      );
      setOk(`Co-appraisal appended to ${pieceId}.`); onDone();
    } catch (e) { setErr(String((e as Error).message || e).slice(0, 280)); }
    finally { setBusy(false); }
  }

  return (
    <motion.form className={s.panel} onSubmit={submit} {...card}>
      <h3 className={s.panelTitle}>Co-appraise</h3>
      <p className={s.panelNote}>
        A second registered appraiser dissents from a prior APPRAISAL. The contract
        reconciles both into an authoritative grade with a dissent strength.
      </p>
      <div className={s.grid2}>
        <div className={s.field}>
          <label className={s.label}>references seq (original appraisal)</label>
          <input value={seq} onChange={(e) => setSeq(e.target.value)} inputMode="numeric" placeholder="e.g. 4" />
        </div>
        <div className={s.field}>
          <label className={s.label}>your grade</label>
          <select value={grade} onChange={(e) => setGrade(e.target.value as Grade)}>
            {GRADE_VALUES.map((gx) => <option key={gx} value={gx}>{gx}</option>)}
          </select>
        </div>
      </div>
      <div className={s.field}>
        <label className={s.label}>basis for dissent</label>
        <input value={basis} onChange={(e) => setBasis(e.target.value)} placeholder="why you disagree…" />
      </div>
      <div className={s.actions}>
        <button type="submit" className={s.btnPrimary} disabled={busy || !pieceId || blocked}>
          {busy ? "filing…" : "append_co_appraisal →"}
        </button>
      </div>
      {blocked && <p className={s.warn}>Connect to GenLayer Studionet to co-appraise.</p>}
      {ok && <p className={s.statusOk}>{ok}</p>}
      {err && <pre className="err-pre">{err}</pre>}
    </motion.form>
  );
}

// ── Service ─────────────────────────────────────────────────────────────────
export function ServicePanel({ wallet, pieceId, onDone }: {
  wallet: WalletState; pieceId: string; onDone: () => void;
}) {
  const { blocked, guard } = useWriteGuard(wallet);
  const [shopRegId, setShopRegId] = useState("");
  const [shopCandidate, setShopCandidate] = useState("");
  const [shopLicense, setShopLicense] = useState("");
  const [shopId, setShopId] = useState("");
  const [workDone, setWorkDone] = useState("");
  const [parts, setParts] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState(""); const [ok, setOk] = useState("");

  async function register() {
    setErr(""); setOk("");
    const g = guard(); if (g) return setErr(g);
    if (!shopRegId.trim()) return setErr("A shop_id is required to register.");
    if (!/^0x[0-9a-fA-F]{40}$/.test(shopCandidate.trim())) {
      return setErr("Enter the service-center wallet that the registry owner will approve.");
    }
    if (!shopLicense.trim()) return setErr("A wallet-bound license URI is required.");
    setBusy("register");
    try {
      const provider = await wallet.getProvider();
      await registerServiceCenter(
        { address: wallet.address!, provider },
        {
          shopId: shopRegId.trim(),
          candidate: shopCandidate.trim(),
          licenseUri: shopLicense.trim(),
        },
      );
      setOk(`Approved service center "${shopRegId.trim()}".`);
    } catch (e) { setErr(String((e as Error).message || e).slice(0, 280)); }
    finally { setBusy(""); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk("");
    const g = guard(); if (g) return setErr(g);
    if (!pieceId) return setErr("Select a piece from the registry first.");
    if (!shopId.trim()) return setErr("Enter the registered shop_id.");
    if (!workDone.trim()) return setErr("Describe the work done.");
    setBusy("service");
    try {
      const provider = await wallet.getProvider();
      await appendService(
        { address: wallet.address!, provider },
        { pieceId, shopId: shopId.trim(), workDone, partsReplaced: parts },
      );
      setOk(`Service logged on ${pieceId}.`); onDone();
    } catch (e) { setErr(String((e as Error).message || e).slice(0, 280)); }
    finally { setBusy(""); }
  }

  return (
    <motion.div className={s.panel} {...card}>
      <h3 className={s.panelTitle}>Service</h3>
      <p className={s.panelNote}>
        An owner-approved, wallet-bound service center logs work and parts. The
        contract checks the record is coherent with the brand before writing it.
      </p>
      <div className={s.walletWrap}>
        <div className={s.field}>
          <label className={s.label}>shop_id (to register)</label>
          <input value={shopRegId} onChange={(e) => setShopRegId(e.target.value)} placeholder="e.g. geneva-atelier" />
        </div>
        <div className={s.field}>
          <label className={s.label}>service-center wallet</label>
          <input value={shopCandidate} onChange={(e) => setShopCandidate(e.target.value)} placeholder="0x…" />
        </div>
        <div className={s.field}>
          <label className={s.label}>wallet-bound license uri</label>
          <input value={shopLicense} onChange={(e) => setShopLicense(e.target.value)} placeholder="https://…/license.json" />
        </div>
        <button type="button" onClick={register} disabled={busy !== "" || blocked}>
          {busy === "register" ? "approving…" : "approve service center →"}
        </button>
      </div>
      <form onSubmit={submit} style={{ marginTop: "1rem" }}>
        <div className={s.grid2}>
          <div className={s.field}>
            <label className={s.label}>piece (selected)</label>
            <input value={pieceId} readOnly placeholder="— pick a piece —" />
          </div>
          <div className={s.field}>
            <label className={s.label}>shop_id (registered)</label>
            <input value={shopId} onChange={(e) => setShopId(e.target.value)} placeholder="geneva-atelier" />
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label}>work done</label>
          <input value={workDone} onChange={(e) => setWorkDone(e.target.value)} placeholder="full movement overhaul…" />
        </div>
        <div className={s.field}>
          <label className={s.label}>parts replaced</label>
          <input value={parts} onChange={(e) => setParts(e.target.value)} placeholder="mainspring, gaskets…" />
        </div>
        <div className={s.actions}>
          <button type="submit" className={s.btnPrimary} disabled={busy !== "" || !pieceId || blocked}>
            {busy === "service" ? "logging…" : "append_service →"}
          </button>
        </div>
      </form>
      {blocked && <p className={s.warn}>Connect to GenLayer Studionet to log service.</p>}
      {ok && <p className={s.statusOk}>{ok}</p>}
      {err && <pre className="err-pre">{err}</pre>}
    </motion.div>
  );
}

// ── Transfer ────────────────────────────────────────────────────────────────
export function TransferPanel({ wallet, pieceId, onDone }: {
  wallet: WalletState; pieceId: string; onDone: () => void;
}) {
  const { blocked, guard } = useWriteGuard(wallet);
  const [newOwner, setNewOwner] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(""); const [ok, setOk] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk("");
    const g = guard(); if (g) return setErr(g);
    if (!pieceId) return setErr("Select a piece from the registry first.");
    if (!/^0x[0-9a-fA-F]{40}$/.test(newOwner.trim())) return setErr("Enter a valid 0x… owner address.");
    setBusy(true);
    try {
      const provider = await wallet.getProvider();
      await appendTransfer(
        { address: wallet.address!, provider },
        { pieceId, newOwner: newOwner.trim(), note },
      );
      setOk(`Transfer recorded on ${pieceId}.`); onDone();
    } catch (e) { setErr(String((e as Error).message || e).slice(0, 280)); }
    finally { setBusy(false); }
  }

  return (
    <motion.form className={s.panel} onSubmit={submit} {...card}>
      <h3 className={s.panelTitle}>Transfer</h3>
      <p className={s.panelNote}>
        Only the current owner may pass a piece on. Custody moves to the new address;
        the spine keeps every prior hand.
      </p>
      <div className={s.field}>
        <label className={s.label}>new owner address</label>
        <input value={newOwner} onChange={(e) => setNewOwner(e.target.value)} placeholder="0x…" />
      </div>
      <div className={s.field}>
        <label className={s.label}>note</label>
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="sale, gift, estate…" />
      </div>
      <div className={s.actions}>
        <button type="submit" className={s.btnPrimary} disabled={busy || !pieceId || blocked}>
          {busy ? "transferring…" : "append_transfer →"}
        </button>
      </div>
      {blocked && <p className={s.warn}>Connect to GenLayer Studionet to transfer.</p>}
      {ok && <p className={s.statusOk}>{ok}</p>}
      {err && <pre className="err-pre">{err}</pre>}
    </motion.form>
  );
}

// ── Verification (open to anyone) ────────────────────────────────────────────
export function VerificationPanel({ wallet, pieceId, onDone }: {
  wallet: WalletState; pieceId: string; onDone: () => void;
}) {
  const { blocked, guard } = useWriteGuard(wallet);
  const [witnessUri, setWitnessUri] = useState("");
  const [statement, setStatement] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(""); const [ok, setOk] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk("");
    const g = guard(); if (g) return setErr(g);
    if (!pieceId) return setErr("Select a piece from the registry first.");
    if (!statement.trim()) return setErr("A statement is required.");
    setBusy(true);
    try {
      const provider = await wallet.getProvider();
      await appendVerification(
        { address: wallet.address!, provider },
        { pieceId, witnessUri: witnessUri.trim(), statement },
      );
      setOk(`Verification appended to ${pieceId}.`); onDone();
    } catch (e) { setErr(String((e as Error).message || e).slice(0, 280)); }
    finally { setBusy(false); }
  }

  return (
    <motion.form className={s.panel} onSubmit={submit} {...card}>
      <h3 className={s.panelTitle}>Verify (community)</h3>
      <p className={s.panelNote}>
        Anyone may post a community VERIFICATION — a witnessed attestation. It is a
        claim, not a verdict; the reader weighs it like any other link.
      </p>
      <div className={s.field}>
        <label className={s.label}>witness uri</label>
        <input value={witnessUri} onChange={(e) => setWitnessUri(e.target.value)} placeholder="https://…/evidence" />
      </div>
      <div className={s.field}>
        <label className={s.label}>statement</label>
        <input value={statement} onChange={(e) => setStatement(e.target.value)} placeholder="seen at auction, matches papers…" />
      </div>
      <div className={s.actions}>
        <button type="submit" className={s.btnPrimary} disabled={busy || !pieceId || blocked}>
          {busy ? "posting…" : "append_verification →"}
        </button>
      </div>
      {blocked && <p className={s.warn}>Connect to GenLayer Studionet to verify.</p>}
      {ok && <p className={s.statusOk}>{ok}</p>}
      {err && <pre className="err-pre">{err}</pre>}
    </motion.form>
  );
}

// ── Authentication (dealer / auction house) ──────────────────────────────────
export function AuthenticationPanel({ wallet, pieceId, onDone }: {
  wallet: WalletState; pieceId: string; onDone: () => void;
}) {
  const { blocked, guard } = useWriteGuard(wallet);
  const [house, setHouse] = useState("");
  const [houseCandidate, setHouseCandidate] = useState("");
  const [houseLicense, setHouseLicense] = useState("");
  const [lotRef, setLotRef] = useState("");
  const [statement, setStatement] = useState("");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState(""); const [ok, setOk] = useState("");

  async function register() {
    setErr(""); setOk("");
    const g = guard(); if (g) return setErr(g);
    if (!house.trim()) return setErr("Enter the stable house_id to approve.");
    if (!/^0x[0-9a-fA-F]{40}$/.test(houseCandidate.trim())) {
      return setErr("Enter the house wallet that the registry owner will approve.");
    }
    if (!houseLicense.trim()) return setErr("A wallet-bound license URI is required.");
    setBusy("register");
    try {
      const provider = await wallet.getProvider();
      await registerAuthenticationHouse(
        { address: wallet.address!, provider },
        {
          houseId: house.trim(),
          candidate: houseCandidate.trim(),
          licenseUri: houseLicense.trim(),
        },
      );
      setOk(`Approved authentication house "${house.trim()}".`);
    } catch (e) { setErr(String((e as Error).message || e).slice(0, 280)); }
    finally { setBusy(""); }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk("");
    const g = guard(); if (g) return setErr(g);
    if (!pieceId) return setErr("Select a piece from the registry first.");
    if (!house.trim()) return setErr("Enter the registered house_id.");
    setBusy("authenticate");
    try {
      const provider = await wallet.getProvider();
      await appendAuthentication(
        { address: wallet.address!, provider },
        { pieceId, house, lotRef, statement },
      );
      setOk(`Authentication appended to ${pieceId}.`); onDone();
    } catch (e) { setErr(String((e as Error).message || e).slice(0, 280)); }
    finally { setBusy(""); }
  }

  return (
    <motion.div className={s.panel} {...card}>
      <h3 className={s.panelTitle}>Authenticate</h3>
      <p className={s.panelNote}>
        Only an owner-approved house whose credential binds its wallet may post an
        AUTHENTICATION. The actor address and registered house_id are written together.
      </p>
      <div className={s.walletWrap}>
        <div className={s.field}>
          <label className={s.label}>house_id</label>
          <input value={house} onChange={(e) => setHouse(e.target.value)} placeholder="phillips-geneva" />
        </div>
        <div className={s.field}>
          <label className={s.label}>house wallet</label>
          <input value={houseCandidate} onChange={(e) => setHouseCandidate(e.target.value)} placeholder="0x…" />
        </div>
        <div className={s.field}>
          <label className={s.label}>wallet-bound license uri</label>
          <input value={houseLicense} onChange={(e) => setHouseLicense(e.target.value)} placeholder="https://…/license.json" />
        </div>
        <button type="button" onClick={register} disabled={busy !== "" || blocked}>
          {busy === "register" ? "approving…" : "approve house →"}
        </button>
      </div>
      <form onSubmit={submit} style={{ marginTop: "1rem" }}>
        <div className={s.grid2}>
          <div className={s.field}>
            <label className={s.label}>registered house_id</label>
            <input value={house} onChange={(e) => setHouse(e.target.value)} placeholder="phillips-geneva" />
          </div>
          <div className={s.field}>
            <label className={s.label}>lot ref</label>
            <input value={lotRef} onChange={(e) => setLotRef(e.target.value)} placeholder="lot 142 / 2024" />
          </div>
        </div>
        <div className={s.field}>
          <label className={s.label}>statement</label>
          <input value={statement} onChange={(e) => setStatement(e.target.value)} placeholder="catalogued, original box & papers…" />
        </div>
        <div className={s.actions}>
          <button type="submit" className={s.btnPrimary} disabled={busy !== "" || !pieceId || blocked}>
            {busy === "authenticate" ? "posting…" : "append_authentication →"}
          </button>
        </div>
      </form>
      {blocked && <p className={s.warn}>Connect to GenLayer Studionet to authenticate.</p>}
      {ok && <p className={s.statusOk}>{ok}</p>}
      {err && <pre className="err-pre">{err}</pre>}
    </motion.div>
  );
}

// ── Update metadata (owner only) ─────────────────────────────────────────────
export function UpdateMetadataPanel({ wallet, pieceId, onDone }: {
  wallet: WalletState; pieceId: string; onDone: () => void;
}) {
  const { blocked, guard } = useWriteGuard(wallet);
  const [newRefUri, setNewRefUri] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(""); const [ok, setOk] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setOk("");
    const g = guard(); if (g) return setErr(g);
    if (!pieceId) return setErr("Select a piece from the registry first.");
    if (!newRefUri.trim()) return setErr("Enter the new reference URI.");
    setBusy(true);
    try {
      const provider = await wallet.getProvider();
      await updatePieceMetadata(
        { address: wallet.address!, provider },
        { pieceId, newRefUri: newRefUri.trim() },
      );
      setOk(`Metadata updated on ${pieceId} (METADATA_UPDATE link written).`); onDone();
    } catch (e) { setErr(String((e as Error).message || e).slice(0, 280)); }
    finally { setBusy(false); }
  }

  return (
    <motion.form className={s.panel} onSubmit={submit} {...card}>
      <h3 className={s.panelTitle}>Update dossier</h3>
      <p className={s.panelNote}>
        The current owner repoints the off-chain reference URI. A METADATA_UPDATE link
        is appended — the old ref stays in the chain's memory. No fee.
      </p>
      <div className={s.field}>
        <label className={s.label}>new reference uri</label>
        <input value={newRefUri} onChange={(e) => setNewRefUri(e.target.value)} placeholder="https://…/dossier-v2" />
      </div>
      <div className={s.actions}>
        <button type="submit" className={s.btnPrimary} disabled={busy || !pieceId || blocked}>
          {busy ? "updating…" : "update_piece_metadata →"}
        </button>
      </div>
      {blocked && <p className={s.warn}>Connect to GenLayer Studionet to update.</p>}
      {ok && <p className={s.statusOk}>{ok}</p>}
      {err && <pre className="err-pre">{err}</pre>}
    </motion.form>
  );
}
