import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import gsap from "gsap";
import type { ProvenanceEntry } from "../lib/contract";
import s from "../styles/CustodyTimeline.module.css";

function shortAddr(a: string): string {
  return a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || "—";
}

function prettyPayload(payload: string): string {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload || "{}";
  }
}

function TimelineNode({ entry, index }: { entry: ProvenanceEntry; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={s.node} data-node>
      <span className={`${s.bead} ${entry.kind === 1 ? s.beadMint : ""}`}>{entry.chain_index}</span>
      <button
        className={s.entry}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Entry ${entry.chain_index}: ${entry.kind_name}`}
      >
        <div className={s.head}>
          <span className={s.kind}>{entry.kind_name}</span>
          <span className={s.seq}>seq #{entry.seq}</span>
          <span className={s.actor}>by {shortAddr(entry.actor)}</span>
        </div>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              className={s.detail}
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <div className={s.kv}>
                <div><b>chain_index</b> · {entry.chain_index}</div>
                <div><b>fee_paid</b> · {entry.fee_paid}</div>
                <div>
                  <b>prev_hash</b>
                  <span className={s.hashLink}>
                    {entry.prev_hash ? entry.prev_hash : "∅ genesis link (no predecessor)"}
                  </span>
                </div>
              </div>
              <pre className={s.payload}>{prettyPayload(entry.payload)}</pre>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </div>
  );
}

export function CustodyTimeline({ chain }: { chain: ProvenanceEntry[] }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const nodes = el.querySelectorAll("[data-node]");
    const ctx = gsap.context(() => {
      gsap.from(nodes, {
        opacity: 0,
        x: -22,
        duration: 0.55,
        ease: "power2.out",
        stagger: 0.08,
      });
    }, el);
    return () => ctx.revert();
  }, [chain]);

  if (!chain.length) {
    return <p className={s.empty}>This piece has no provenance links yet — its story is unwritten.</p>;
  }

  return (
    <div className={s.spine} ref={containerRef}>
      {chain.map((entry, i) => (
        <TimelineNode key={`${entry.seq}-${i}`} entry={entry} index={i} />
      ))}
    </div>
  );
}
