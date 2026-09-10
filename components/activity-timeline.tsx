import { leadActivity } from "@/lib/quotes";
import { dateTime } from "@/lib/format";
export function ActivityTimeline({ leadId }: { leadId: string }) {
  const events = leadActivity(leadId);
  return (
    <section className="panel detail-panel">
      <h2>Activity history</h2>
      <ol className="activity-timeline">
        {events.map((event) => (
          <li key={event.id}>
            <span className="timeline-dot" />
            <div>
              <strong>{event.type}</strong>
              <p>{event.detail}</p>
              <time dateTime={event.createdAt}>
                {dateTime(event.createdAt)}
              </time>
            </div>
          </li>
        ))}
      </ol>
      <p className="hint">
        Earlier enquiries are included. Other history is recorded from this
        update onwards; seeded quote events are labelled.
      </p>
    </section>
  );
}
