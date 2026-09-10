import { DemoReset } from "@/components/demo-reset";
export default function DemoPage() {
  return (
    <>
      <div className="page-heading">
        <div>
          <div className="eyebrow">DEMONSTRATION WORKSPACE</div>
          <h1>Ready for your next demo.</h1>
          <p>Use fictional details when demonstrating enquiries and quotes.</p>
        </div>
      </div>
      <section className="panel detail-panel">
        <h2>Restore the starting workspace</h2>
        <p className="job-description">
          Reset to 10 fictional leads and five sample quotes. This removes
          demonstration enquiries, uploaded photos, private notes and quote
          responses added since the last reset. Old customer quote links will
          stop working.
        </p>
        <DemoReset enabled={process.env.DEMO_MODE === "true"} />
      </section>
    </>
  );
}
