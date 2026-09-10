"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, LoaderCircle } from "lucide-react";
export function QuoteResponse({
  token,
  total,
}: {
  token: string;
  total: string;
}) {
  const router = useRouter();
  const [decision, setDecision] = useState<"Accepted" | "Declined" | null>(
    null,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function submit() {
    if (!decision || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/quotes/${token}/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not save your response.",
      );
      setBusy(false);
    }
  }
  return (
    <section className="panel customer-response">
      <h2>
        {decision
          ? decision === "Accepted"
            ? "Confirm your acceptance"
            : "Decline this quote?"
          : "Shall we bring your garden plans to life?"}
      </h2>
      <p>
        {decision
          ? decision === "Accepted"
            ? `You are accepting the work listed above for ${total}. The team will agree a start date with you separately.`
            : "This will let the team know you do not want to proceed with this quote."
          : "Review the details above, then let us know your decision."}
      </p>
      <div className="action-group">
        {decision ? (
          <>
            <button
              className="button button-secondary"
              disabled={busy}
              onClick={() => {
                setDecision(null);
                setError("");
              }}
            >
              Go back
            </button>
            <button className="button" disabled={busy} onClick={submit}>
              {busy ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Check size={17} />
              )}{" "}
              {busy
                ? "Saving response…"
                : decision === "Accepted"
                  ? "Confirm acceptance"
                  : "Confirm decline"}
            </button>
          </>
        ) : (
          <>
            <button className="button" onClick={() => setDecision("Accepted")}>
              <Check size={17} /> Accept quote
            </button>
            <button
              className="button button-secondary"
              onClick={() => setDecision("Declined")}
            >
              Decline quote
            </button>
          </>
        )}
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </section>
  );
}
