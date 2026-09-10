"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Upload, X, ArrowUpRight, LoaderCircle } from "lucide-react";
import { quoteSchema, today } from "@/lib/validation";
export function QuoteForm() {
  const router = useRouter();
  const [photos, setPhotos] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const urls = photos.map((f) => URL.createObjectURL(f));
    setPreviews(urls);
    return () => urls.forEach((u) => URL.revokeObjectURL(u));
  }, [photos]);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    const form = new FormData(event.currentTarget);
    const result = quoteSchema.safeParse(Object.fromEntries(form));
    if (!result.success) {
      setError(result.error.issues[0].message);
      return;
    }
    form.delete("photos");
    photos.forEach((f) => form.append("photos", f));
    setBusy(true);
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        body: form,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      router.push(`/quote/success?ref=${encodeURIComponent(data.id)}`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not submit. Please try again.",
      );
      setBusy(false);
    }
  }
  return (
    <form className="panel quote-form" onSubmit={submit}>
      <label className="honeypot" aria-hidden="true">
        Website
        <input name="website" tabIndex={-1} autoComplete="off" />
      </label>
      <div className="section-heading">
        <span className="step">01</span>
        <h2>A little about you</h2>
      </div>
      <div className="form-grid">
        <label>
          Full name
          <input
            name="name"
            autoComplete="name"
            required
            minLength={2}
            maxLength={100}
            placeholder="e.g. Alex Morgan"
          />
        </label>
        <label>
          Email address
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            maxLength={254}
            placeholder="you@example.com"
          />
        </label>
        <label>
          Phone number
          <input
            name="phone"
            type="tel"
            autoComplete="tel"
            required
            minLength={7}
            maxLength={30}
            placeholder="Your contact number"
          />
        </label>
        <label>
          Postcode or location
          <input
            name="location"
            autoComplete="postal-code"
            required
            minLength={3}
            maxLength={120}
            placeholder="e.g. CH48, West Kirby"
          />
        </label>
      </div>
      <div className="section-heading form-section">
        <span className="step">02</span>
        <h2>Your garden project</h2>
      </div>
      <div className="form-grid">
        <label>
          What can we help with?
          <select name="service" defaultValue="Garden redesign">
            {[
              "Garden redesign",
              "Patios & paving",
              "Lawn & turf",
              "Fencing",
              "Garden maintenance",
              "Other",
            ].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <label>
          Preferred date <span className="optional">(optional)</span>
          <input name="preferredDate" type="date" min={today()} />
        </label>
      </div>
      <label className="full-label">
        Tell us about the job
        <textarea
          name="description"
          rows={5}
          required
          minLength={20}
          maxLength={5000}
          placeholder="What would you like to change? Approximate sizes, access and any ideas you have are all useful."
        />
        <span className="hint">
          At least 20 characters. A preferred date is a request, not a confirmed
          booking.
        </span>
      </label>
      <label className="full-label">
        Photos of your space <span className="optional">(optional)</span>
      </label>
      <label className="upload-zone">
        <Upload size={25} />
        <strong>Add photos of your garden</strong>
        <span>JPG, PNG or WebP · Up to 6 photos · 5 MB each</span>
        <input
          aria-label="Upload garden photos"
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            e.target.value = "";
            if (
              photos.length + files.length > 6 ||
              files.some(
                (f) =>
                  f.size > 5 * 1024 * 1024 ||
                  !["image/jpeg", "image/png", "image/webp"].includes(f.type),
              )
            ) {
              setError(
                "Choose up to 6 JPG, PNG or WebP photos, each no larger than 5 MB.",
              );
              return;
            }
            setError("");
            setPhotos([...photos, ...files]);
          }}
        />
      </label>
      {photos.length > 0 && (
        <div className="photo-previews">
          {photos.map((f, i) => (
            <div key={`${f.name}-${i}`}>
              <img src={previews[i]} alt={f.name} />
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => setPhotos(photos.filter((_, n) => n !== i))}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <button disabled={busy} className="button submit-button">
        {busy ? (
          <>
            <LoaderCircle className="spin" size={18} /> Sending request…
          </>
        ) : (
          <>
            Send quote request <ArrowUpRight size={18} />
          </>
        )}
      </button>
      <p className="privacy-note">
        Your details help us respond to your enquiry. Photos and contact details
        are used to understand your project and respond to your enquiry.
      </p>
    </form>
  );
}
