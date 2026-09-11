import Link from "next/link";
import { Sidebar } from "@/components/sidebar";
export const metadata = { title: "Business dashboard demo | Wirral Garden Co.", robots: { index: false } };
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <div className="dashboard-shell"><Sidebar basePath="/demo" /><div className="dashboard-area"><header className="dashboard-topbar"><span>Wirral Garden Co. / <strong>Read-only demo</strong></span><Link href="/">Customer website</Link></header><main className="dashboard-main"><p className="panel detail-panel" role="note"><strong>Explore a fictional business workspace.</strong> Sample data only. Editing, quote responses and reset are unavailable here. <Link className="text-link" href="/demo/quotes">View sample quotes →</Link></p>{children}</main></div></div>;
}
