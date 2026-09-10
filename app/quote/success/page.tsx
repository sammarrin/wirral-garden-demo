import Link from "next/link";
import { Check, ArrowUpRight } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { getLead } from "@/lib/db";
export const dynamic = "force-dynamic";
export default async function Success({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>;
}) {
  const { ref } = await searchParams;
  const found = ref ? Boolean(getLead(ref)) : false;
  return (
    <>
      <PublicHeader />
      <main className="success-wrap">
        <div className="success-icon">
          <Check size={32} />
        </div>
        <div className="eyebrow">
          {found ? "ALL RECEIVED" : "LET’S MAKE A START"}
        </div>
        <h1>
          {found
            ? "Your garden plans are in."
            : "Ready to tell us about your garden?"}
        </h1>
        <p>
          {found
            ? "Thank you for getting in touch. Your quote request has been saved for the Wirral Garden Co. team to review."
            : "Send a quote request and we’ll save your project details for the team."}
        </p>
        {found && (
          <div className="soft-box">
            <strong>
              Request reference · {ref?.slice(0, 8).toUpperCase()}
            </strong>
            <p>
              Keep this reference for your enquiry. A visit or start date will
              be agreed with you separately.
            </p>
          </div>
        )}
        <Link className="button" href={found ? "/" : "/quote"}>
          {found ? "Back to home" : "Request a quote"}{" "}
          <ArrowUpRight size={18} />
        </Link>
      </main>
    </>
  );
}
