export default function DesignPage() {
  return (
    <div className="hero stack" id="content">
      <h1>Components</h1>
      <div className="row">
        <button className="btn btn-primary" type="button">Primary</button>
        <button className="btn btn-secondary" type="button">Secondary</button>
        <button className="btn btn-ghost" type="button">Ghost</button>
        <button className="btn btn-danger" type="button">Danger</button>
        <button className="btn btn-primary" type="button" disabled>Loading</button>
      </div>
      <label className="field">
        <span>Label</span>
        <input className="input" placeholder="Type here" />
      </label>
      <div className="card">
        <h2>Empty</h2>
        <p className="muted">Nothing here yet.</p>
      </div>
      <p className="error" role="alert">Something needs a second look.</p>
      <p className="ok">Saved.</p>
    </div>
  );
}
