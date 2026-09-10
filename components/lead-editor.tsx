"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, LockKeyhole, LoaderCircle } from "lucide-react";
import { statuses, type Status } from "@/lib/validation";
export function LeadEditor({
  id,
  initialStatus,
  initialNotes,
}: {
  id: string;
  initialStatus: Status;
  initialNotes: string;
}) {
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [saved, setSaved] = useState({
    status: initialStatus,
    notes: initialNotes,
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const dirty = status !== saved.status || notes !== saved.notes;
  useEffect(() => {
    function prevent(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
      }
    }
    window.addEventListener("beforeunload", prevent);
    return () => window.removeEventListener("beforeunload", prevent);
  }, [dirty]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          notes,
          expectedStatus: saved.status,
          expectedNotes: saved.notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSaved({ status, notes });
      setMessage("Changes saved.");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save changes.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={save} className="panel editor">
      <h2>Manage this lead</h2>
      <label>
        Lead status
        <select
          disabled={busy}
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as Status);
            setMessage("");
          }}
        >
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="inline-label">
          <LockKeyhole size={15} /> Private notes
        </span>
        <textarea
          disabled={busy}
          rows={9}
          maxLength={10000}
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setMessage("");
          }}
          placeholder="Site visit details, budget, follow-up reminders…"
        />
        <span className="hint">
          For your workspace only. Not shown on the customer pages.
        </span>
      </label>
      <button className="button" disabled={busy || !dirty}>
        {busy ? (
          <LoaderCircle className="spin" size={17} />
        ) : (
          <Save size={17} />
        )}{" "}
        {busy ? "Saving…" : "Save changes"}
      </button>
      {dirty && !busy && (
        <span className="hint">You have unsaved changes.</span>
      )}
      {message && (
        <p role="status" className="saved-message">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </form>
  );
}
