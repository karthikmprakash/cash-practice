import Link from "next/link";

export default function HomePage() {
  return (
    <div className="hero" id="content">
      <p className="muted">For one clinician. Private pay only.</p>
      <h1 className="display">The practice tools you actually use.</h1>
      <p>Schedule the day, write the note, record the payment, and hand the client a superbill. You bill the person in the room. No demo call.</p>
      <p className="price">$29 a month</p>
      <div className="row">
        <Link className="btn btn-primary" href="/signup">Create your practice</Link>
        <Link className="btn btn-secondary" href="/pricing">See pricing</Link>
      </div>
    </div>
  );
}
