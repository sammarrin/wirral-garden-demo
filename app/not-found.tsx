import Link from "next/link";
export default function NotFound() {
  return (
    <div className="success-wrap">
      <h1>We couldn’t find that page.</h1>
      <p>The lead or page may no longer be available.</p>
      <Link className="button" href="/dashboard/leads">
        Back to all leads
      </Link>
    </div>
  );
}
