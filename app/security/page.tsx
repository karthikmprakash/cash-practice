export default function SecurityPage() {
  return (
    <div className="hero" id="content">
      <h1>How records are kept</h1>
      <ul>
        <li>Client names, contact details, diagnoses, notes, and intake answers are encrypted before they are written to disk.</li>
        <li>Every chart read and write is appended to an audit log the app cannot edit or delete.</li>
        <li>Signed notes store the author, a UTC timestamp, and a content hash, then refuse edits.</li>
        <li>Secrets stay in environment variables. The browser bundle is scanned for them at build time.</li>
        <li>Production refuses to start unless HTTPS is required.</li>
      </ul>
      <p>Before you enter a real client, you still need signed agreements with the host, the email or SMS vendor, Stripe, and the video vendor. This build documents those parties. It does not claim those agreements are already signed.</p>
    </div>
  );
}
