import { PublicHeader } from "@/components/public-header";
import { QuoteForm } from "@/components/quote-form";
import { Check, ArrowLeft } from "lucide-react";
import Link from "next/link";
export default function QuotePage() {
  return (
    <>
      <PublicHeader />
      <main className="quote-layout">
        <aside>
          <Link href="/" className="back-link">
            <ArrowLeft size={16} /> Back to the garden
          </Link>
          <div className="eyebrow">LET’S MAKE A START</div>
          <h1>
            Your next garden
            <br />
            starts here.
          </h1>
          <p>
            Tell us what you have in mind. A few details and photos help us
            understand your space.
          </p>
          <ul className="check-list">
            <li>
              <Check /> A free, no-obligation quote
            </li>
            <li>
              <Check /> A conversation about your ideas
            </li>
            <li>
              <Check /> No project too small
            </li>
          </ul>
          <div className="soft-box">
            <strong>Not sure what you need?</strong>
            <p>
              That’s absolutely fine. Describe what isn’t working and what you’d
              love to change.
            </p>
          </div>
        </aside>
        <QuoteForm />
      </main>
    </>
  );
}
