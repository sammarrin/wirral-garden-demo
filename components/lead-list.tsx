"use client";
import { useState } from "react";
import { Search, X } from "lucide-react";
import type { Lead } from "@/lib/db";
import { statuses } from "@/lib/validation";
import { LeadTable } from "./lead-table";
export function LeadList({
  leads,
  initialStatus,
}: {
  leads: Lead[];
  initialStatus: string;
}) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const result = leads.filter(
    (l) =>
      (status === "All" || l.status === status) &&
      [l.name, l.email, l.phone, l.location, l.description, l.service]
        .join(" ")
        .toLowerCase()
        .includes(query.toLowerCase().trim()),
  );
  return (
    <section className="panel">
      <div className="list-toolbar">
        <div className="search-field">
          <Search size={18} />
          <input
            aria-label="Search leads"
            placeholder="Search customers, locations or jobs…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button aria-label="Clear search" onClick={() => setQuery("")}>
              <X size={16} />
            </button>
          )}
        </div>
        <label className="filter-label">
          Status
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option>All</option>
            {statuses.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <div className="list-count" aria-live="polite">
        {result.length} {result.length === 1 ? "lead" : "leads"}
        {status !== "All" ? ` · ${status}` : ""}
        {(query || status !== "All") && (
          <button
            onClick={() => {
              setQuery("");
              setStatus("All");
            }}
          >
            Clear filters
          </button>
        )}
      </div>
      <LeadTable leads={result} />
    </section>
  );
}
