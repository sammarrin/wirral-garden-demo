import Link from "next/link";
import { ArrowUpRight, Inbox } from "lucide-react";
import type { Lead } from "@/lib/db";
import { initials, shortDate } from "@/lib/format";
import { StatusBadge } from "./status-badge";
export function LeadTable({ leads }: { leads: Lead[] }) {
  if (!leads.length)
    return (
      <div className="empty-state">
        <Inbox size={32} />
        <h3>No leads to show</h3>
        <p>
          Try a different search or status. New quote requests will appear here.
        </p>
      </div>
    );
  return (
    <div className="table-scroll">
      <table className="lead-table">
        <thead>
          <tr>
            <th>Customer</th>
            <th>Project</th>
            <th>Status</th>
            <th>Received</th>
            <th>
              <span className="sr-only">Open lead</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => (
            <tr key={lead.id}>
              <td>
                <Link className="customer" href={`/dashboard/leads/${lead.id}`}>
                  <span className="avatar">{initials(lead.name)}</span>
                  <span>
                    <strong>{lead.name}</strong>
                    <small>{lead.location}</small>
                  </span>
                </Link>
              </td>
              <td>{lead.service}</td>
              <td>
                <StatusBadge status={lead.status} />
              </td>
              <td className="muted">{shortDate(lead.createdAt)}</td>
              <td>
                <Link
                  href={`/dashboard/leads/${lead.id}`}
                  aria-label={`Open ${lead.name}`}
                  className="row-link"
                >
                  <ArrowUpRight size={19} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
