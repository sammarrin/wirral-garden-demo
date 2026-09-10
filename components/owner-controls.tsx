"use client";
import Link from "next/link";
import { useState } from "react";
export function OwnerControls() {
  const [error, setError] = useState("");
  return (
    <div className="owner-controls">
      <Link href="/dashboard/demo">Demo workspace</Link>
      <button
        onClick={async () => {
          try {
            const response = await fetch("/api/auth/logout", {
              method: "POST",
            });
            if (!response.ok) throw Error();
            window.location.assign("/login");
          } catch {
            setError("Could not sign out. Try again.");
          }
        }}
      >
        Sign out
      </button>
      {error && <span role="alert">{error}</span>}
    </div>
  );
}
