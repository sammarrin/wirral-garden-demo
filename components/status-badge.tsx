import type { Status } from "@/lib/validation";
export function StatusBadge({ status }: { status: Status }) {
  return (
    <span
      className={`status-badge status-${status.toLowerCase().replaceAll(" ", "-")}`}
    >
      <span />
      {status}
    </span>
  );
}
