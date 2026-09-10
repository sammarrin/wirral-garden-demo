import { Sidebar } from "@/components/sidebar";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { sessionName, validSession } from "@/lib/auth";
import { OwnerControls } from "@/components/owner-controls";
export const dynamic = "force-dynamic";
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!validSession((await cookies()).get(sessionName)?.value))
    redirect("/login");
  return (
    <div className="dashboard-shell">
      <Sidebar />
      <div className="dashboard-area">
        <header className="dashboard-topbar">
          <span>
            Wirral Garden Co. <span className="muted">/ Workspace</span>
          </span>
          <OwnerControls />
        </header>
        <main className="dashboard-main">{children}</main>
      </div>
    </div>
  );
}
