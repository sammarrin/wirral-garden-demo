import { Brand } from "./brand";
import { money, quoteNumber, quoteLabel, type Quote } from "@/lib/quote-values";
export function QuoteDocument({ quote }: { quote: Quote }) {
  const date = (value: string) =>
    new Date(
      value.length === 10 ? `${value}T12:00:00Z` : value,
    ).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "Europe/London",
    });
  return (
    <article className="panel quote-document">
      <div className="document-top">
        <Brand />
        <span
          className={`quote-state quote-state-${quoteLabel(quote).toLowerCase()}`}
        >
          {quoteLabel(quote)}
        </span>
      </div>
      <div className="document-heading">
        <div>
          <div className="eyebrow">YOUR GARDEN PROJECT</div>
          <h1>Your quotation</h1>
          <p>
            Prepared with care for <strong>{quote.customerName}</strong>.
          </p>
        </div>
        <div className="quote-reference">
          <strong>{quoteNumber(quote.number)}</strong>
          <span>
            {quote.sentAt ? "Issued" : "Created"}{" "}
            {date(quote.sentAt || quote.createdAt)}
          </span>
        </div>
      </div>
      <div className="quote-address">
        <span className="eyebrow">PREPARED FOR</span>
        <strong>{quote.customerName}</strong>
        <span>{quote.customerLocation}</span>
      </div>
      <div className="table-scroll">
        <table className="quote-items-table">
          <thead>
            <tr>
              <th>Description</th>
              <th>Qty</th>
              <th>Unit price</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, i) => (
              <tr key={i}>
                <td>{item.description}</td>
                <td>{item.quantityHundredths / 100}</td>
                <td>{money(item.unitPricePence)}</td>
                <td>{money(item.totalPence)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="quote-totals">
        <div>
          <span>Subtotal</span>
          <span>{money(quote.totalPence)}</span>
        </div>
        <div className="quote-total">
          <strong>Total</strong>
          <strong>{money(quote.totalPence)}</strong>
        </div>
        <small>All amounts in GBP. No additional tax or fees added.</small>
      </div>
      {quote.notes && (
        <section className="document-notes">
          <h2>A few details</h2>
          <p>{quote.notes}</p>
        </section>
      )}
      <div className="quote-validity">
        <strong>
          {quote.validUntil
            ? `Valid until ${date(quote.validUntil)} (inclusive)`
            : "No expiry date specified"}
        </strong>
        <p>
          A start date will be agreed separately. Accepting this quote does not
          take a payment or book a visit.
        </p>
      </div>
      {quote.respondedAt && (
        <div className="quote-response-record">
          {quote.state === "Accepted" ? "Accepted" : "Declined"} on{" "}
          {date(quote.respondedAt)}
        </div>
      )}
      <footer className="document-footer">
        Wirral Garden Co. <span>Thoughtful gardens. Locally grown.</span>
      </footer>
    </article>
  );
}
