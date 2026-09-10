import { getLead, getPhotos } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  ImageIcon,
  Plus,
} from "lucide-react";
import { dateTime, initials } from "@/lib/format";
import { StatusBadge } from "@/components/status-badge";
import { LeadEditor } from "@/components/lead-editor";
import { LeadQuotes } from "@/components/lead-quotes";
import { ActivityTimeline } from "@/components/activity-timeline";
import { leadQuotes } from "@/lib/quotes";
export default async function LeadDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = getLead(id);
  if (!lead) notFound();
  const photos = getPhotos(id);
  return (
    <>
      <Link href="/dashboard/leads" className="back-link">
        <ArrowLeft size={16} /> All leads
      </Link>
      <div className="page-heading detail-heading">
        <div className="detail-title">
          <span className="avatar large">{initials(lead.name)}</span>
          <div>
            <h1>{lead.name}</h1>
            <p>Received {dateTime(lead.createdAt)}</p>
          </div>
        </div>
        <div className="action-group">
          <StatusBadge status={lead.status} />
          {!leadQuotes(id).some((q) => q.state === "Accepted") && (
            <Link href={`/dashboard/leads/${id}/quote`} className="button">
              <Plus size={17} /> Create quote
            </Link>
          )}
        </div>
      </div>
      <div className="detail-grid">
        <div className="detail-content">
          <LeadQuotes leadId={id} />
          <section className="panel detail-panel">
            <h2>Customer details</h2>
            <div className="contact-grid">
              <div>
                <Mail />
                <span>
                  Email<a href={`mailto:${lead.email}`}>{lead.email}</a>
                </span>
              </div>
              <div>
                <Phone />
                <span>
                  Phone
                  <a href={`tel:${lead.phone.replaceAll(" ", "")}`}>
                    {lead.phone}
                  </a>
                </span>
              </div>
              <div>
                <MapPin />
                <span>
                  Location<strong>{lead.location}</strong>
                </span>
              </div>
              <div>
                <Calendar />
                <span>
                  Preferred date
                  <strong>
                    {lead.preferredDate
                      ? new Date(
                          `${lead.preferredDate}T12:00:00Z`,
                        ).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                          timeZone: "Europe/London",
                        })
                      : "Flexible / not specified"}
                  </strong>
                </span>
              </div>
            </div>
          </section>
          <section className="panel detail-panel">
            <div className="panel-title-row">
              <h2>About the job</h2>
              <span className="service-chip">{lead.service}</span>
            </div>
            <p className="job-description">{lead.description}</p>
          </section>
          <section className="panel detail-panel">
            <h2>
              Project photos <span className="count-chip">{photos.length}</span>
            </h2>
            {photos.length ? (
              <>
                <p className="muted">Select a photo to open the full image.</p>
                <div className="photo-gallery">
                  {photos.map((p) => (
                    <a
                      key={p.id}
                      href={`/api/photos/${p.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <img src={`/api/photos/${p.id}`} alt={p.originalName} />
                      <span>{p.originalName}</span>
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div className="empty-state compact">
                <ImageIcon />
                <p>No photos attached to this enquiry.</p>
              </div>
            )}
          </section>
          <ActivityTimeline leadId={id} />
        </div>
        <LeadEditor
          id={id}
          initialStatus={lead.status}
          initialNotes={lead.notes}
        />
      </div>
    </>
  );
}
