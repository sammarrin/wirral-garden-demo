"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, Copy, ArrowUpRight, LoaderCircle } from "lucide-react";
import type { QuoteState } from "@/lib/quote-values";
export function QuoteOwnerActions({
  id,
  token,
  state,
  version,
  replaces,
}: {
  id: string;
  token: string;
  state: QuoteState;
  version: number;
  replaces: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");
  async function finalise() {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/quotes/${id}/finalise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not finalise quote.");
    } finally {
      setBusy(false);
    }
  }
  async function copy() {
    const url = `${window.location.origin}/quotes/${token}`;
    setLink(url);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }
  return (
    <section className="panel quote-owner-actions">
      <div>
        <h2>{state === "Draft" ? "Ready to send?" : "Customer quote link"}</h2>
        <p>
          {state === "Draft"
            ? `Finalising locks the quote and marks the lead “Quote Sent”. ${replaces ? "It also replaces the previously sent quote. " : ""}No email is sent automatically.`
            : "Open the customer page to view or respond to this quote. Anyone with this link can access this quotation."}
        </p>
      </div>
      <div className="action-group">
        {state === "Draft" ? (
          <>
            <Link
              className="button button-secondary"
              href={`/dashboard/quotes/${id}/edit`}
            >
              Edit draft
            </Link>
            <button className="button" disabled={busy} onClick={finalise}>
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Send size={17} />
              )}{" "}
              {busy ? "Finalising…" : "Finalise & mark sent"}
            </button>
          </>
        ) : (
          <>
            <button className="button button-secondary" onClick={copy}>
              <Copy size={16} />
              {copied ? "Link copied" : "Copy customer link"}
            </button>
            <Link className="button" href={`/quotes/${token}`}>
              Open customer quote <ArrowUpRight size={17} />
            </Link>
          </>
        )}
      </div>
      {link && (
        <label className="copied-link">
          Customer link
          <input readOnly value={link} onFocus={(e) => e.target.select()} />
          <span role="status" className="hint">
            {copied ? "Link copied." : "Select and copy this link."}
          </span>
        </label>
      )}
      {error && (
        <p className="error-message" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
