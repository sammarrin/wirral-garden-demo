"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Inbox, ArrowUpRight, Leaf } from "lucide-react";
import { Brand } from "./brand";
export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <Link href="/dashboard">
        <Brand dark />
      </Link>
      <div className="workspace-label">YOUR WORKSPACE</div>
      <nav>
        <Link
          className={pathname === "/dashboard" ? "active" : ""}
          href="/dashboard"
        >
          <LayoutDashboard size={19} /> Overview
        </Link>
        <Link
          className={pathname.startsWith("/dashboard/leads") ? "active" : ""}
          href="/dashboard/leads"
        >
          <Inbox size={19} /> All leads
        </Link>
      </nav>
      <div className="sidebar-bottom">
        <div className="quote-page-card">
          <Leaf size={23} />
          <strong>Your next job starts here.</strong>
          <p>See the page your customers use to get in touch.</p>
          <Link href="/">
            View quote page <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="owner-profile">
          <span>WG</span>
          <div>
            Wirral Garden Co.<small>Demo workspace</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
