"use client";
import { useState } from "react";
export function DemoReset({ enabled }: { enabled: boolean }) {
  const [confirm, setConfirm] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!enabled)
    return <p className="hint">Reset is disabled for this workspace.</p>;
  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/demo/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmation: text }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      window.location.assign("/dashboard");
    } catch (error) {
      setError(error instanceof Error ? error.message : "Reset failed.");
      setBusy(false);
    }
  }
  return (
    <div className="reset-area">
      {!confirm ? (
        <button
          className="button button-secondary"
          onClick={() => setConfirm(true)}
        >
          Reset demo data
        </button>
      ) : (
        <form onSubmit={reset}>
          <h3>Reset the entire demonstration workspace?</h3>
          <p>
            This cannot be undone. All demonstration activity will be replaced
            with the original fictional examples.
          </p>
          <label>
            Type RESET DEMO to confirm
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              autoComplete="off"
            />
          </label>
          <div className="action-group">
            <button
              type="button"
              className="button button-secondary"
              disabled={busy}
              onClick={() => {
                setConfirm(false);
                setText("");
              }}
            >
              Cancel
            </button>
            <button className="button" disabled={busy || text !== "RESET DEMO"}>
              {busy ? "Resetting…" : "Confirm reset"}
            </button>
          </div>
          {error && (
            <p role="alert" className="error-message">
              {error}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
