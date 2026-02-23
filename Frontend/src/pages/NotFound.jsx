import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <section className="page">
      <div className="form-card">
        <h2>Page not found</h2>
        <p className="muted">The page you are looking for does not exist.</p>
        <Link className="btn primary" to="/">
          Go Home
        </Link>
      </div>
    </section>
  );
}