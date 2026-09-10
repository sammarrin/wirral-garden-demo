import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Clock, FileText } from "lucide-react";
import { publicQuote } from "@/lib/quotes";
import { money, quoteExpired } from "@/lib/quote-values";
import { QuoteDocument } from "@/components/quote-document";
import { QuoteResponse } from "@/components/quote-response";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your quotation | Wirral Garden Co.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};
export default async function CustomerQuote({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const quote = publicQuote(token);
  if (!quote) notFound();
  const expired = quoteExpired(quote);
  return (
    <main className="customer-quote-page">
      <div className="customer-quote-intro">
        <FileText size={18} />
        <span>A quotation from Wirral Garden Co.</span>
      </div>
      <QuoteDocument quote={quote} />
      {quote.state === "Sent" && !expired ? (
        <QuoteResponse token={token} total={money(quote.totalPence)} />
      ) : (
        <section className="panel customer-response" role="status">
          {quote.state === "Accepted" ? (
            <Check size={26} />
          ) : (
            <Clock size={26} />
          )}
          <h2>
            {quote.state === "Accepted"
              ? "Thank you. Your quote is accepted."
              : quote.state === "Declined"
                ? "Your decision has been recorded."
                : quote.state === "Superseded"
                  ? "This quote has been replaced."
                  : "This quote has expired."}
          </h2>
          <p>
            {quote.state === "Accepted"
              ? "The team can now arrange the next steps with you. No payment has been taken."
              : quote.state === "Declined"
                ? "The team has been updated that you do not want to proceed."
                : quote.state === "Superseded"
                  ? "Please use the latest quote link provided by the team. This version can no longer be accepted or declined."
                  : "Please contact the team for an updated quotation."}
          </p>
        </section>
      )}
    </main>
  );
}
