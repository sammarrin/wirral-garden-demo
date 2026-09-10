import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getQuote, leadQuotes } from "@/lib/quotes";
import { quoteNumber } from "@/lib/quote-values";
import { QuoteDocument } from "@/components/quote-document";
import { QuoteOwnerActions } from "@/components/quote-owner-actions";
export default async function ReviewQuote({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = getQuote(id);
  if (!quote) notFound();
  return (
    <>
      <Link href={`/dashboard/leads/${quote.leadId}`} className="back-link">
        <ArrowLeft size={16} /> Back to {quote.customerName}
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">QUOTE PREVIEW</div>
          <h1>{quoteNumber(quote.number)}</h1>
          <p>
            {quote.state === "Draft"
              ? "Review the customer’s quote before finalising."
              : "The saved quotation and customer response."}
          </p>
        </div>
      </div>
      <QuoteOwnerActions
        key={`${quote.id}-${quote.state}`}
        id={quote.id}
        token={quote.token}
        state={quote.state}
        version={quote.version}
        replaces={leadQuotes(quote.leadId).some(
          (q) => q.state === "Sent" && q.id !== id,
        )}
      />
      <QuoteDocument quote={quote} />
    </>
  );
}
