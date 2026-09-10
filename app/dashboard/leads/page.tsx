import { listLeads } from "@/lib/db";
import { LeadList } from "@/components/lead-list";
import { statuses } from "@/lib/validation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
export default async function Leads({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">KEEP EVERY OPPORTUNITY IN VIEW</div>
          <h1>All leads</h1>
          <p>From the first hello to a job well done.</p>
        </div>
        <Link href="/quote" className="button">
          Open quote form <ArrowUpRight size={17} />
        </Link>
      </div>
      <LeadList
        key={status || "All"}
        leads={listLeads()}
        initialStatus={statuses.some((s) => s === status) ? status! : "All"}
      />
    </>
  );
}
