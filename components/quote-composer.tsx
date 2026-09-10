"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Plus, Trash2, ArrowRight, LoaderCircle } from "lucide-react";
import {
  quoteDraftSchema,
  calculateItems,
  money,
  type QuoteDraft,
  type Quote,
} from "@/lib/quote-values";
import { today } from "@/lib/validation";
export function QuoteComposer({
  leadId,
  quote,
}: {
  leadId: string;
  quote?: Quote;
}) {
  const router = useRouter();
  const key = useRef<string | null>(null);
  const [items, setItems] = useState<QuoteDraft["items"]>(
    quote
      ? quote.items.map((i) => ({
          description: i.description,
          quantity: String(i.quantityHundredths / 100),
          price: (i.unitPricePence / 100).toFixed(2),
        }))
      : [{ description: "", quantity: "1", price: "" }],
  );
  const [notes, setNotes] = useState(quote?.notes || "");
  const [validUntil, setValidUntil] = useState(quote?.validUntil || "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const calculations = calculateItems(
    items.map((i) => ({
      ...i,
      quantity: /^\d+(\.\d{1,2})?$/.test(i.quantity) ? i.quantity : "0",
      price: /^\d+(\.\d{1,2})?$/.test(i.price) ? i.price : "0",
    })),
  );
  const total = calculations.reduce((s, i) => s + i.totalPence, 0);
  function change(
    index: number,
    field: keyof QuoteDraft["items"][number],
    value: string,
  ) {
    setItems(
      items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    );
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const parsed = quoteDraftSchema.safeParse({ items, notes, validUntil });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setError("");
    setBusy(true);
    key.current ??= crypto.randomUUID();
    try {
      const response = await fetch(
        quote ? `/api/quotes/${quote.id}` : `/api/leads/${leadId}/quotes`,
        {
          method: quote ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...parsed.data,
            requestKey: key.current,
            version: quote?.version,
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push(`/dashboard/quotes/${data.id}`);
      router.refresh();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Could not save the draft.",
      );
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="panel quote-composer">
      <fieldset disabled={busy}>
        <div className="panel-title-row">
          <h2>What’s included</h2>
          <span className="muted">Prices in GBP (£)</span>
        </div>
        <p className="hint">
          Use quantity 1 for a fixed-price job, or enter units such as square
          metres.
        </p>
        <div className="quote-line-items">
          {items.map((item, i) => (
            <div className="quote-line-item" key={i}>
              <label>
                Description
                <input
                  aria-label={`Item ${i + 1} description`}
                  required
                  maxLength={500}
                  value={item.description}
                  placeholder="e.g. Garden clearance"
                  onChange={(e) => change(i, "description", e.target.value)}
                />
              </label>
              <label>
                Quantity
                <input
                  aria-label={`Item ${i + 1} quantity`}
                  type="number"
                  min="0.01"
                  max="10000"
                  step="0.01"
                  required
                  value={item.quantity}
                  onChange={(e) => change(i, "quantity", e.target.value)}
                />
              </label>
              <label>
                Unit price (£)
                <input
                  aria-label={`Item ${i + 1} price`}
                  type="number"
                  min="0"
                  max="100000"
                  step="0.01"
                  required
                  value={item.price}
                  placeholder="0.00"
                  onChange={(e) => change(i, "price", e.target.value)}
                />
              </label>
              <div className="line-amount">
                <span>Amount</span>
                <strong>{money(calculations[i].totalPence)}</strong>
              </div>
              <button
                type="button"
                className="remove-item"
                disabled={items.length === 1}
                aria-label={`Remove item ${i + 1}`}
                onClick={() => setItems(items.filter((_, n) => n !== i))}
              >
                <Trash2 size={17} />
              </button>
            </div>
          ))}
        </div>
        <button
          className="button button-secondary"
          type="button"
          disabled={items.length >= 30}
          onClick={() =>
            setItems([...items, { description: "", quantity: "1", price: "" }])
          }
        >
          <Plus size={17} /> Add line item
        </button>
        <div className="composer-bottom">
          <div>
            <label>
              Customer notes <span className="optional">(optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={5000}
                rows={4}
                placeholder="What’s included, access requirements or details to agree…"
              />
              <span className="hint">
                These notes appear on the customer’s quote. Private lead notes
                stay private.
              </span>
            </label>
            <label>
              Valid until <span className="optional">(optional)</span>
              <input
                type="date"
                min={today()}
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </label>
          </div>
          <div className="quote-totals">
            <div>
              <span>Subtotal</span>
              <span>{money(total)}</span>
            </div>
            <div className="quote-total">
              <strong>Total</strong>
              <strong>{money(total)}</strong>
            </div>
            <small>No additional tax or fees added.</small>
          </div>
        </div>
      </fieldset>
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
      <div className="composer-actions">
        <Link href={`/dashboard/leads/${leadId}`} className="back-link">
          Back to lead
        </Link>
        <button className="button" disabled={busy}>
          {busy ? (
            <LoaderCircle className="spin" size={17} />
          ) : (
            <ArrowRight size={17} />
          )}{" "}
          {busy ? "Saving draft…" : "Save draft & review"}
        </button>
      </div>
      <p className="hint">
        Saving a draft does not change the lead’s status. Review it before
        finalising.
      </p>
    </form>
  );
}
