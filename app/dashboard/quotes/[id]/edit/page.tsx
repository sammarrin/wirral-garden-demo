import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getQuote } from "@/lib/quotes";
import { quoteNumber } from "@/lib/quote-values";
import { QuoteComposer } from "@/components/quote-composer";
export default async function EditQuote({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const quote = getQuote(id);
  if (!quote) notFound();
  return (
    <>
      <Link href={`/dashboard/quotes/${id}`} className="back-link">
        <ArrowLeft size={16} /> Back to preview
      </Link>
      <div className="page-heading">
        <div>
          <div className="eyebrow">QUOTE DRAFT</div>
          <h1>Edit {quoteNumber(quote.number)}</h1>
          <p>Prepared for {quote.customerName}</p>
        </div>
      </div>
      {quote.state === "Draft" ? (
        <QuoteComposer leadId={quote.leadId} quote={quote} />
      ) : (
        <div className="panel detail-panel">
          <h2>This quote has been finalised.</h2>
          <p>
            Its contents are kept as a permanent record. Return to the lead to
            create a replacement if needed.
          </p>
        </div>
      )}
    </>
  );
}
