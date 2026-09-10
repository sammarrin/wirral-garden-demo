import Link from "next/link";
import {
  ArrowUpRight,
  Inbox,
  Send,
  Trophy,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { listLeads } from "@/lib/db";
import { LeadTable } from "@/components/lead-table";
import { statuses } from "@/lib/validation";
import { quoteStats } from "@/lib/quotes";
import { money } from "@/lib/quote-values";
export default function Dashboard() {
  const leads = listLeads();
  const quotes = quoteStats();
  const count = (s: string) => leads.filter((l) => l.status === s).length;
  const won = count("Won");
  const conversion = leads.length ? Math.round((won / leads.length) * 100) : 0;
  const cards = [
    {
      label: "New leads",
      value: count("New"),
      note: "Ready for a first conversation",
      Icon: Inbox,
      status: "New",
    },
    {
      label: "Quotes sent",
      value: count("Quote Sent"),
      note: "Leads at quote-sent stage",
      Icon: Send,
      status: "Quote Sent",
    },
    {
      label: "Jobs won",
      value: won,
      note: "Customers ready to get started",
      Icon: Trophy,
      status: "Won",
    },
    {
      label: "Conversion rate",
      value: `${conversion}%`,
      note: "Jobs won ÷ all leads",
      Icon: TrendingUp,
      status: "",
    },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">YOUR BUSINESS, AT A GLANCE</div>
          <h1>Good things are growing.</h1>
          <p>Here’s what’s happening with your garden enquiries.</p>
        </div>
        <Link href="/quote" className="button">
          Open quote form <ArrowUpRight size={17} />
        </Link>
      </div>
      <div className="stats-grid">
        {cards.map(({ label, value, note, Icon, status }) => (
          <Link
            href={`/dashboard/leads${status ? `?status=${encodeURIComponent(status)}` : ""}`}
            className="stat-card"
            key={label}
          >
            <div>
              <span>{label}</span>
              <Icon size={19} />
            </div>
            <strong>{value}</strong>
            <small>{note}</small>
          </Link>
        ))}
      </div>
      <section className="panel quote-summary" aria-label="Quote pipeline">
        <div>
          <span>Awaiting response</span>
          <strong>
            {quotes.pending} {quotes.pending === 1 ? "quote" : "quotes"}
          </strong>
        </div>
        <div>
          <span>Open quote value</span>
          <strong>{money(quotes.pendingPence)}</strong>
        </div>
        <div>
          <span>Accepted quote value</span>
          <strong>{money(quotes.acceptedPence)}</strong>
        </div>
        <p>
          Open value excludes drafts, expired and replaced quotes. Accepted
          value records agreed quotes, not payments.
        </p>
      </section>
      <div className="overview-grid">
        <section className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <h2>
                Recent enquiries{" "}
                <span className="count-chip">{leads.length}</span>
              </h2>
              <p>A fresh look at the latest opportunities.</p>
            </div>
            <Link className="text-link" href="/dashboard/leads">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <LeadTable leads={leads.slice(0, 6)} />
        </section>
        <section className="panel pipeline">
          <div className="eyebrow">FROM ENQUIRY TO JOB</div>
          <h2>Your pipeline</h2>
          <p>{leads.length} leads, one clear picture.</p>
          <div className="pipeline-segment">
            {statuses.map((s) => (
              <span
                key={s}
                className={`segment-${s.toLowerCase().replaceAll(" ", "-")}`}
                style={{ flex: count(s) }}
              />
            ))}
          </div>
          {statuses.map((s) => (
            <Link
              key={s}
              href={`/dashboard/leads?status=${encodeURIComponent(s)}`}
              className="pipeline-row"
            >
              <span>
                <i
                  className={`segment-${s.toLowerCase().replaceAll(" ", "-")}`}
                />
                {s}
              </span>
              <strong>{count(s)}</strong>
            </Link>
          ))}
          <div className="pipeline-note">
            <span className="green-dot" />
            <p>
              {count("New")
                ? `${count("New")} new ${count("New") === 1 ? "enquiry is" : "enquiries are"} waiting for your first reply.`
                : "You’re all caught up on new enquiries."}
            </p>
          </div>
        </section>
      </div>
      <div className="dashboard-footnote">
        A little organisation. More time in the garden.
        <span>Statistics cover all saved leads.</span>
      </div>
    </>
  );
}
