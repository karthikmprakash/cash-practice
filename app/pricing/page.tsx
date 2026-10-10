import Link from "next/link";

export default function PricingPage() {
  return (
    <div className="hero" id="content">
      <h1>Solo, $29 a month</h1>
      <p>One clinician. Scheduling, notes, intake, card or cash payments, and superbills. Cancel from settings whenever you want. Annual is $290 if you stay the year.</p>
      <ul>
        <li>Your own Stripe account. We do not add a platform fee to session charges.</li>
        <li>Video rooms from a third-party vendor you can put under a BAA.</li>
        <li>A full export of clients, notes, sessions, and payments.</li>
      </ul>
      <Link className="btn btn-primary" href="/signup">Create your practice</Link>
    </div>
  );
}
