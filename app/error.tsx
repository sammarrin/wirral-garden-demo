"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="success-wrap">
      <h1>Something didn’t load.</h1>
      <p>Please try again. If this continues, contact the workspace owner.</p>
      <button className="button" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
