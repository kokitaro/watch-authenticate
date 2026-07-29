import { motion } from "framer-motion";
import type { PieceMeta } from "../lib/contract";
import { ThreeGlyph } from "./ThreeGlyph";
import s from "../styles/PieceCard.module.css";

function shortAddr(a: string): string {
  return a && a.length > 12 ? `${a.slice(0, 6)}…${a.slice(-4)}` : a || "—";
}

export function PieceCard({
  piece,
  chainLength,
}: {
  piece: PieceMeta;
  chainLength: number;
}) {
  return (
    <motion.article
      className={s.card}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6, boxShadow: "0 34px 70px -28px rgba(0,0,0,0.85)" }}
    >
      <div className={s.glyphWrap}>
        <motion.div
          whileHover={{ scale: 1.06, rotate: 2 }}
          transition={{ type: "spring", stiffness: 220, damping: 16 }}
        >
          <ThreeGlyph seed={piece.serial_hash || piece.piece_id} size={132} />
        </motion.div>
      </div>

      <div className={s.body}>
        <h2 className={s.brand}>{piece.brand || "Unknown brand"}</h2>
        <p className={s.model}>
          {piece.model || "—"} · claimed {piece.claimed_year || "—"}
        </p>

        <div className={s.row}>
          <span className={s.chainPill}>{chainLength} link{chainLength === 1 ? "" : "s"}</span>
          <span className="pill">piece · {piece.piece_id}</span>
          {piece.pool_balance > 0 && <span className="pill">pool {piece.pool_balance}</span>}
        </div>

        <div className={s.serialHash}>serial_hash · {piece.serial_hash || "—"}</div>

        <p className={s.metaLine}>
          minted by {shortAddr(piece.minter)} · now held by {shortAddr(piece.current_owner)}
        </p>
      </div>
    </motion.article>
  );
}
