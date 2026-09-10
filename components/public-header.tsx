import Link from "next/link";
import { Brand } from "./brand";
export function PublicHeader() {
  return (
    <header className="public-header">
      <Link href="/" aria-label="Wirral Garden Co. home">
        <Brand />
      </Link>
      <nav>
        <Link className="owner-link" href="/dashboard">
          Owner dashboard
        </Link>
        <Link className="button small" href="/quote">
          Request a quote <span>↗</span>
        </Link>
      </nav>
    </header>
  );
}
