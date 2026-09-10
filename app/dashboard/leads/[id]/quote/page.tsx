import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getLead } from "@/lib/db";
import { leadQuotes } from "@/lib/quotes";
import { QuoteComposer } from "@/components/quote-composer";
export default async function CreateQuote({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = getLead(id);
  if (!lead) notFound();
  const accepted = leadQuotes(id).some((q) => q.state === "Accepted");
  return (
    <>
      <Link href={`/dashboard/leads/${id}`} className="back-link">
        <ArrowLeft size={16} /> Back to {lead.name}
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">FROM PLANS TO A PRICE</div>
          <h1>Create quote</h1>
          <p>
            Prepared for {lead.name} · {lead.location}
          </p>
        </div>
      </div>
      {accepted ? (
        <section className="panel detail-panel">
          <h2>This lead already has an accepted quote.</h2>
          <p className="muted">
            You can view the agreed quote from the lead page.
          </p>
        </section>
      ) : (
        <QuoteComposer leadId={id} />
      )}
    </>
  );
}
