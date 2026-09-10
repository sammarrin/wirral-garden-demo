import Link from "next/link";
import { FileText, ArrowUpRight, Plus } from "lucide-react";
import { leadQuotes } from "@/lib/quotes";
import { money, quoteNumber, quoteLabel } from "@/lib/quote-values";
import { dateTime } from "@/lib/format";
export function LeadQuotes({ leadId }: { leadId: string }) {
  const quotes = leadQuotes(leadId);
  return (
    <section className="panel detail-panel">
      <div className="panel-title-row">
        <h2>
          Quotes <span className="count-chip">{quotes.length}</span>
        </h2>
        {!quotes.some((q) => q.state === "Accepted") && (
          <Link className="text-link" href={`/dashboard/leads/${leadId}/quote`}>
            <Plus size={16} /> Create quote
          </Link>
        )}
      </div>
      {quotes.length ? (
        <div className="lead-quotes">
          {quotes.map((q) => (
            <Link
              className="lead-quote-row"
              key={q.id}
              href={`/dashboard/quotes/${q.id}`}
            >
              <FileText size={19} />
              <div>
                <strong>{quoteNumber(q.number)}</strong>
                <small>
                  {q.state === "Draft" ? "Created" : "Issued"}{" "}
                  {dateTime(q.sentAt || q.createdAt)}
                </small>
              </div>
              <span
                className={`quote-state quote-state-${quoteLabel(q).toLowerCase()}`}
              >
                {quoteLabel(q)}
              </span>
              <strong>{money(q.totalPence)}</strong>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty-state compact">
          <FileText />
          <p>No quotes yet. Turn this enquiry into a clear price.</p>
        </div>
      )}
    </section>
  );
}
