import { useCallback, useEffect, useState } from "react";
import { Nav } from "../components/Nav";
import { PieceCard } from "../components/PieceCard";
import { CustodyTimeline } from "../components/CustodyTimeline";
import { MintPiecePanel } from "../components/MintPiecePanel";
import { AppraisalPanel } from "../components/AppraisalPanel";
import {
  CoAppraisalPanel, ServicePanel, TransferPanel,
  VerificationPanel, AuthenticationPanel, UpdateMetadataPanel,
} from "../components/WritePanels";
import { Connect } from "../components/Connect";
import { Lookups } from "../components/Lookups";
import { useWallet } from "../lib/useWallet";
import {
  discoverPieces, getPiece, getCustodyChain, getChainLength, getLatestEntry,
  type PieceMeta, type ProvenanceEntry,
} from "../lib/contract";
import {
  AUTHENTICATED_PROVENANCE_ENABLED,
  CONTRACT_ADDRESS,
  NETWORK,
} from "../lib/deployment";
import s from "../styles/App.module.css";

type DeskTab =
  | "mint" | "appraise" | "co_appraise" | "service"
  | "transfer" | "verify" | "authenticate" | "metadata";

const TABS: { id: DeskTab; label: string }[] = [
  { id: "mint", label: "mint" },
  { id: "appraise", label: "appraise" },
  { id: "co_appraise", label: "co-appraise" },
  { id: "service", label: "service" },
  { id: "transfer", label: "transfer" },
  { id: "verify", label: "verify" },
  { id: "authenticate", label: "authenticate" },
  { id: "metadata", label: "dossier" },
];

export function Workspace() {
  const wallet = useWallet();
  const [pieces, setPieces] = useState<{ brand: string; pieceId: string }[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [piece, setPieceMeta] = useState<PieceMeta | null>(null);
  const [chain, setChain] = useState<ProvenanceEntry[]>([]);
  const [chainLen, setChainLen] = useState(0);
  const [latest, setLatest] = useState<ProvenanceEntry | null>(null);
  const [netErr, setNetErr] = useState(false);
  const [busyMsg, setBusyMsg] = useState<string | null>(null);
  const [tab, setTab] = useState<DeskTab>("mint");

  const loadRegistry = useCallback(async () => {
    try {
      const found = await discoverPieces();
      setPieces(found);
      setNetErr(false);
      return found;
    } catch {
      setNetErr(true);
      return [];
    }
  }, []);

  const loadPiece = useCallback(async (pieceId: string) => {
    if (!pieceId) return;
    setBusyMsg(`reading chain for ${pieceId}…`);
    try {
      const [meta, ch, len, last] = await Promise.all([
        getPiece(pieceId),
        getCustodyChain(pieceId),
        getChainLength(pieceId),
        getLatestEntry(pieceId),
      ]);
      setPieceMeta(meta);
      setChain(ch);
      setChainLen(len);
      setLatest(last);
      setNetErr(false);
    } catch {
      setNetErr(true);
    } finally {
      setBusyMsg(null);
    }
  }, []);

  useEffect(() => { loadRegistry(); }, [loadRegistry]);
  useEffect(() => { if (selected) loadPiece(selected); }, [selected, loadPiece]);

  function pick(pieceId: string) {
    setSelected(pieceId);
    const el = document.getElementById("selected");
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function afterMint(pieceId: string) {
    await loadRegistry();
    pick(pieceId);
  }
  async function afterWrite() {
    if (selected) await loadPiece(selected);
  }

  function renderDesk() {
    switch (tab) {
      case "mint": return <MintPiecePanel wallet={wallet} onDone={afterMint} />;
      case "appraise": return <AppraisalPanel wallet={wallet} pieceId={selected} onDone={afterWrite} />;
      case "co_appraise": return <CoAppraisalPanel wallet={wallet} pieceId={selected} onDone={afterWrite} />;
      case "service": return <ServicePanel wallet={wallet} pieceId={selected} onDone={afterWrite} />;
      case "transfer": return <TransferPanel wallet={wallet} pieceId={selected} onDone={afterWrite} />;
      case "verify": return <VerificationPanel wallet={wallet} pieceId={selected} onDone={afterWrite} />;
      case "authenticate": return <AuthenticationPanel wallet={wallet} pieceId={selected} onDone={afterWrite} />;
      case "metadata": return <UpdateMetadataPanel wallet={wallet} pieceId={selected} onDone={afterWrite} />;
    }
  }

  return (
    <div>
      <Nav pieceCount={pieces.length} />
      {netErr && (
        <div className={s.netBanner}>reconnecting to {NETWORK}…</div>
      )}
      {!AUTHENTICATED_PROVENANCE_ENABLED && (
        <div className={s.netBanner}>
          legacy read-only deployment · entries are historical claims, not v2
          authenticated provenance
        </div>
      )}

      <main className="shell">
        {/* ── The writing desk ─────────────────────────────────────── */}
        <section className={s.section} id="console">
          <p className="eyebrow">i · the writing desk</p>
          <h2 className="section-title">Add a <em>link</em> to the record.</h2>
          <p className="lede">
            Each write is signed by a connected wallet. Privileged entries also require
            an owner-approved, credential-bound role. No private key is entered or stored.
          </p>

          <div className={s.walletRow}>
            <div className={s.connectPanel}>
              <div>
                <h3 className={s.connectTitle}>Wallet</h3>
                <p className={s.connectNote}>
                  Connect a Web3 wallet (MetaMask, Rabby, …) to sign writes. Reads need
                  no wallet — the registry is public to all.
                </p>
              </div>
              <Connect />
            </div>
          </div>

          <div className={s.deskTabs} role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`${s.deskTab} ${tab === t.id ? s.deskTabActive : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {tab !== "mint" && !selected && (
            <p className={s.deskHint}>
              Pick a piece from the register below — most writes act on a selected piece.
            </p>
          )}

          <div className={s.deskBody}>{renderDesk()}</div>
        </section>

        <hr className="divider" />

        {/* ── The registry ─────────────────────────────────────────── */}
        <section className={s.section} id="registry">
          <p className="eyebrow">ii · the register</p>
          <h2 className="section-title">Pieces under <em>chronology</em>.</h2>
          <p className="lede">
            Each entry below is a physical timepiece with its own hash-linked chain.
            Choose one to read its provenance spine.
          </p>

          {pieces.length === 0 ? (
            <p className={s.emptyReg}>
              No pieces minted yet. Open the first chain from the writing desk above.
            </p>
          ) : (
            <div className={s.registry}>
              {pieces.map(({ brand, pieceId }) => (
                <button
                  key={pieceId}
                  className={`${s.regItem} ${selected === pieceId ? s.regItemActive : ""}`}
                  onClick={() => pick(pieceId)}
                >
                  <span className={s.regBrand}>{brand}</span> · {pieceId}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── The selected piece + its timeline ─────────────────────── */}
        <section className={s.section} id="selected">
          {piece && selected ? (
            <div className={s.selectedWrap}>
              <p className="eyebrow">iii · the object</p>
              <PieceCard piece={piece} chainLength={chainLen} />

              {latest && (
                <p className={s.latestLine}>
                  latest link · <b>{latest.kind_name}</b> at seq #{latest.seq}
                  {" "}· index {latest.chain_index}
                </p>
              )}

              <div className={s.timelineHead}>
                <h3>The custody spine</h3>
                <span className="pill">{chainLen} link{chainLen === 1 ? "" : "s"}</span>
              </div>
              <CustodyTimeline chain={chain} />
            </div>
          ) : (
            <p className={s.emptyReg}>Select a piece above to unfold its chain of hands.</p>
          )}
        </section>

        <hr className="divider" />

        {/* ── The reading room (views) ─────────────────────────────── */}
        <section className={s.section} id="lookups">
          <p className="eyebrow">iv · the reading room</p>
          <h2 className="section-title">Query the <em>registry</em> directly.</h2>
          <p className="lede">
            Read any view without a wallet: an entry by index, an appraiser or service
            center's standing, or the global tail of recent activity.
          </p>
          <Lookups pieceId={selected} chainLength={chainLen} />
        </section>

        <footer className={s.footer}>
          <div>HOROLOGE — append-only custody registry · hub 06-wren.</div>
          <div>
            contract <code>{CONTRACT_ADDRESS}</code> on {NETWORK}. views:{" "}
            <code>custody_chain</code>, <code>piece</code>, <code>chain_length</code>,{" "}
            <code>latest_entry</code>, <code>entry_at</code>, <code>appraiser</code>,{" "}
            <code>service_center</code>, <code>pieces_by_brand</code>,{" "}
            <code>recent_registry_activity</code>. writes: <code>mint_piece</code>,{" "}
            <code>append_appraisal</code>, <code>append_co_appraisal</code>,{" "}
            <code>append_service</code>, <code>append_transfer</code>,{" "}
            <code>append_verification</code>, <code>append_authentication</code>,{" "}
            <code>register_appraiser</code>, <code>register_service_center</code>,{" "}
            <code>update_piece_metadata</code>.
          </div>
          <div className="muted">Read for yourself. The registry remembers; it does not judge.</div>
        </footer>
      </main>

      {busyMsg && <div className="toast">{busyMsg}</div>}
    </div>
  );
}
