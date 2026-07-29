import { Link, useLocation } from "react-router-dom";
import { NETWORK } from "../lib/deployment";
import s from "../styles/Nav.module.css";

// Shared masthead across both routes. The brand mark always returns to the
// landing page; the CTA flips between "Open the Registry" (on the landing)
// and "Back to the front" (inside the workspace).
export function Nav({ pieceCount }: { pieceCount?: number }) {
  const { pathname } = useLocation();
  const onRegistry = pathname.startsWith("/registry");

  return (
    <nav className={s.nav}>
      <Link to="/" className={s.brand} aria-label="Horologe — home">
        <span className={s.mark} />
        <span className={s.word}>HOROLOGE</span>
      </Link>

      <span className={s.meta}>
        <span className={s.live}>· {NETWORK} · live</span>
        {onRegistry && typeof pieceCount === "number" && (
          <span className={s.count}>
            {pieceCount} piece{pieceCount === 1 ? "" : "s"} on file
          </span>
        )}
      </span>

      <Link to={onRegistry ? "/" : "/registry"} className={s.cta}>
        {onRegistry ? "← The front" : "Open the Registry →"}
      </Link>
    </nav>
  );
}
