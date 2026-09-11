import Link from "next/link";
import { notFound } from "next/navigation";
import fixture from "@/lib/public-demo.json";
import type { Lead } from "@/lib/db";
import type { Quote } from "@/lib/quote-values";
import { money, quoteNumber } from "@/lib/quote-values";
import { dateTime, initials } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { LeadList } from "@/components/lead-list";
import { QuoteDocument } from "@/components/quote-document";
import DemoOverview from "@/components/demo-overview";

const leads = fixture.leads as Lead[];
const quotes = fixture.quotes as Quote[];
function QuoteLinks({ leadId }: { leadId?: string }) {
  const rows = quotes.filter((q) => !leadId || q.leadId === leadId);
  return <section className="panel detail-panel"><h2>Sample quotes</h2>{rows.length ? rows.map((q) => <p key={q.id}><Link className="text-link" href={"/demo/quotes/" + q.id}>{quoteNumber(q.number)} · {q.customerName} · {money(q.totalPence)} · {q.state} →</Link></p>) : <p className="muted">No quote created for this sample enquiry yet.</p>}</section>;
}
export default async function DemoPage({ params, searchParams }: { params: Promise<{ path?: string[] }>; searchParams: Promise<{ status?: string }> }) {
  const { path = [] } = await params;
  if (!path.length) return <DemoOverview />;
  if (path.length === 1 && path[0] === "leads") return <><div className="page-heading"><div><div className="eyebrow">KEEP EVERY OPPORTUNITY IN VIEW</div><h1>All leads</h1><p>Explore fictional enquiries. Search and filter freely.</p></div></div><LeadList leads={leads} initialStatus={(await searchParams).status || "All"} basePath="/demo" /></>;
  if (path.length === 1 && path[0] === "quotes") return <><div className="page-heading"><h1>Sample quotes</h1></div><QuoteLinks /></>;
  if (path.length === 2 && path[0] === "quotes") {
    const quote = quotes.find((q) => q.id === path[1]);
    if (!quote) notFound();
    return <><Link href={"/demo/leads/" + quote.leadId} className="back-link">← Back to lead</Link><QuoteDocument quote={quote} /><p className="hint">Read-only sample quotation. Accept, decline and edit actions are unavailable.</p></>;
  }
  if (path.length !== 2 || path[0] !== "leads") notFound();
  const lead = leads.find((l) => l.id === path[1]);
  if (!lead) notFound();
  return <><Link href="/demo/leads" className="back-link">← All leads</Link><div className="page-heading detail-heading"><div className="detail-title"><span className="avatar large">{initials(lead.name)}</span><div><h1>{lead.name}</h1><p>Received {dateTime(lead.createdAt)}</p></div></div><StatusBadge status={lead.status} /></div><div className="detail-grid"><div className="detail-content"><QuoteLinks leadId={lead.id} /><section className="panel detail-panel"><h2>Customer details</h2><div className="contact-grid">{[["Email", lead.email], ["Phone", lead.phone], ["Location", lead.location], ["Preferred date", lead.preferredDate || "Flexible / not specified"]].map(([label, value]) => <div key={label}><span>{label}<strong>{value}</strong></span></div>)}</div></section><section className="panel detail-panel"><div className="panel-title-row"><h2>About the job</h2><span className="service-chip">{lead.service}</span></div><p className="job-description">{lead.description}</p></section><section className="panel detail-panel"><h2>Project photos</h2><p className="muted">No photos attached to this sample enquiry.</p></section><section className="panel detail-panel"><h2>Activity history</h2><ol className="activity-timeline">{fixture.events.filter((e) => e.leadId === lead.id).map((e) => <li key={e.id}><span className="timeline-dot"/><div><strong>{e.type}</strong><p>{e.detail}</p><time dateTime={e.createdAt}>{dateTime(e.createdAt)}</time></div></li>)}</ol></section></div><section className="panel editor"><h2>Sample private notes</h2><p className="job-description">{lead.notes || "No notes added to this sample lead."}</p><p className="hint">Fictional example · Read-only</p></section></div></>;
}
