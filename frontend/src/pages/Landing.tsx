import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import gsap from "gsap";
import { Nav } from "../components/Nav";
import { Globe } from "../components/Globe";
import {
  KNOWN_BRANDS, KIND_NAMES, getRecentActivity, type ProvenanceEntry,
} from "../lib/contract";
import {
  AUTHENTICATED_PROVENANCE_ENABLED,
  CONTRACT_ADDRESS,
  NETWORK,
} from "../lib/deployment";
import s from "../styles/Landing.module.css";

const STEPS = [
  { n: "01", verb: "mint piece", body: "Open an append-only chain for a physical watch. The minter becomes its first owner; a genesis MINT link is written." },
  { n: "02", verb: "appraise", body: "An owner-approved appraiser files a grade. Validators inspect the actual image bytes and agree on the evidence digest and result before sealing the link." },
  { n: "03", verb: "co-appraise", body: "A second appraiser may dissent. The disagreement is reconciled on-chain into an authoritative grade with a dissent strength." },
  { n: "04", verb: "service", body: "A registered service center logs work done and parts replaced. Coherence with the brand is checked before the entry lands." },
  { n: "05", verb: "transfer", body: "The current owner passes the piece to a new address. Custody moves; the spine grows. Nothing is ever erased." },
];

const FAQ = [
  { q: "Does Horologe certify that a watch is genuine?", a: "No. Horologe is a registry, not a verdict. It stores signed, hash-linked entries — appraisals, services, transfers, authentications. Each reader weighs the chain and decides for themselves." },
  { q: "Who can write to a piece's chain?", a: "Minting is open. Appraisals, services, and house authentications require owner-approved credentials bound to the caller wallet; transfers require the current owner. Anyone may add a community verification claim." },
  { q: "What makes the chain tamper-evident?", a: "Every entry carries the hash of the entry before it. Altering any past link would break every hash that follows, so the spine is append-only by construction." },
  { q: "Why is there a fee on each entry?", a: "Each append pays a single unit into the piece's own pool. It keeps the chain honest about cost and accumulates a small balance against the object's record." },
];

function shortAddr(a: string): string {
  return a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || "—";
}

export function Landing() {
  const [recent, setRecent] = useState<ProvenanceEntry[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const stepsRef = useRef<HTMLOListElement>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await getRecentActivity(5);
        if (alive) setRecent(r);
      } catch {
        if (alive) setRecent([]);
      } finally {
        if (alive) setLoadingStats(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    const el = stepsRef.current;
    if (!el) return;
    const items = el.querySelectorAll("[data-step]");
    const ctx = gsap.context(() => {
      gsap.from(items, {
        opacity: 0,
        y: 28,
        duration: 0.6,
        ease: "power2.out",
        stagger: 0.12,
      });
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div>
      <Nav />
      {!AUTHENTICATED_PROVENANCE_ENABLED && (
        <div style={{
          padding: "0.7rem 1rem",
          textAlign: "center",
          background: "#4a210f",
          color: "#f3d7ae",
          fontSize: "0.82rem",
          letterSpacing: "0.04em",
        }}>
          Legacy deployment is read-only. Its entries are historical claims, not
          hardened v2 authenticated provenance.
        </div>
      )}

      {/* ── Hero ──────────────────────────────────────────────────── */}
      <header className={s.hero}>
        <Globe className={s.globe} />
        <div className={s.scrim} />
        <div className={`shell ${s.heroContent}`}>
          <motion.p
            className={s.kicker}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            Horologe · registry no. 06—wren
          </motion.p>
          <motion.h1
            className={s.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.08 }}
          >
            Every watch carries <em>its history.</em>
          </motion.h1>
          <motion.p
            className={s.sub}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, delay: 0.3 }}
          >
            Append-only custody chain for luxury timepieces. Each piece opens a
            hash-linked spine — minted, appraised, serviced, transferred — and never
            forgets a single hand it passed through.
          </motion.p>
          <motion.div
            className={s.heroCtas}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.45 }}
          >
            <Link to="/registry" className={s.ctaPrimary}>Open the Registry →</Link>
            <a href="#how" className={s.ctaGhost}>How it works</a>
          </motion.div>
          <div className={s.legend}>
            <span><i className={`${s.dot} ${s.dotA}`} /> appraisers</span>
            <span><i className={`${s.dot} ${s.dotS}`} /> service centers</span>
          </div>
        </div>
        <div className={s.scrollCue}>scroll the spine ↓</div>
      </header>

      <main className="shell">
        {/* ── Why a registry, not a verdict ───────────────────────── */}
        <section className={s.section} id="why">
          <p className="eyebrow">i · the premise</p>
          <h2 className="section-title">Why a registry, <em>not a verdict</em>.</h2>
          <p className={s.manifesto}>
            Horologe does not grade your watch, and it will never hand down a single
            score to be trusted blindly. It is a registry: an immutable, append-only
            chain of signed claims — who appraised it, who serviced it, who owned it,
            who authenticated it — each link hashed to the one before. Authority is not
            asserted from above; it accumulates in the open. The object remembers, and
            you are the one who reads the record and decides what it is worth.
          </p>
        </section>

        <hr className="divider" />

        {/* ── How it works ────────────────────────────────────────── */}
        <section className={s.section} id="how">
          <p className="eyebrow">ii · the method</p>
          <h2 className="section-title">How a <em>chain</em> is built.</h2>
          <p className="lede">Five kinds of link, written in the order a piece lives its life.</p>

          <ol className={s.steps} ref={stepsRef}>
            {STEPS.map((step) => (
              <li className={s.step} data-step key={step.n}>
                <span className={s.stepNum}>{step.n}</span>
                <div>
                  <h3 className={s.stepVerb}>{step.verb}</h3>
                  <p className={s.stepBody}>{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <hr className="divider" />

        {/* ── Live stats ──────────────────────────────────────────── */}
        <section className={s.section} id="live">
          <p className="eyebrow">iii · the pulse</p>
          <h2 className="section-title">The registry, <em>moving now</em>.</h2>
          <p className="lede">
            The five most recent links written to any chain, read live from{" "}
            <code className={s.codeInline}>recent_registry_activity(5)</code>.
          </p>

          <div className={s.activity}>
            {loadingStats ? (
              <p className={s.activityEmpty}>reading the latest links…</p>
            ) : recent.length === 0 ? (
              <p className={s.activityEmpty}>
                No links yet, or the node is quiet. Open the registry to write the first.
              </p>
            ) : (
              recent.map((e, i) => (
                <motion.div
                  className={s.activityRow}
                  key={`${e.seq}-${i}`}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.45, delay: i * 0.06 }}
                >
                  <span className={s.actSeq}>#{e.seq}</span>
                  <span className={s.actKind}>{e.kind_name || KIND_NAMES[e.kind] || "ENTRY"}</span>
                  <span className={s.actPiece}>{e.piece_id || "—"}</span>
                  <span className={s.actActor}>by {shortAddr(e.actor)}</span>
                </motion.div>
              ))
            )}
          </div>
        </section>

        <hr className="divider" />

        {/* ── Brands gallery ──────────────────────────────────────── */}
        <section className={s.section} id="brands">
          <p className="eyebrow">iv · the houses</p>
          <h2 className="section-title">Houses <em>on file</em>.</h2>
          <p className="lede">The brands a piece may be minted under at the writing desk.</p>

          <div className={s.brands}>
            {KNOWN_BRANDS.map((b) => (
              <Link to="/registry" className={s.brandPill} key={b}>{b}</Link>
            ))}
          </div>
        </section>

        <hr className="divider" />

        {/* ── FAQ ─────────────────────────────────────────────────── */}
        <section className={s.section} id="faq">
          <p className="eyebrow">v · the questions</p>
          <h2 className="section-title">Read <em>before</em> you trust.</h2>

          <div className={s.faq}>
            {FAQ.map((item) => (
              <details className={s.faqItem} key={item.q}>
                <summary className={s.faqQ}>{item.q}</summary>
                <p className={s.faqA}>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* ── Footer ──────────────────────────────────────────────── */}
        <footer className={s.footer}>
          <div className={s.footRow}>
            <div>
              <span className={s.footBrand}>HOROLOGE</span> — append-only custody registry · hub 06-wren.
            </div>
            <Link to="/registry" className={s.footCta}>Open the Registry →</Link>
          </div>
          <div className={s.footMeta}>
            contract <code>{CONTRACT_ADDRESS}</code> on {NETWORK}.
          </div>
          <div className="muted">Read for yourself. The registry remembers; it does not judge.</div>
        </footer>
      </main>
    </div>
  );
}
