import { Sprout } from "lucide-react";
export function Brand({ dark = false }: { dark?: boolean }) {
  return (
    <span className={`brand ${dark ? "brand-light" : ""}`}>
      <span className="brand-icon">
        <Sprout size={24} />
      </span>
      <span>
        Wirral Garden Co.<small>GARDENS WITH PURPOSE</small>
      </span>
    </span>
  );
}
