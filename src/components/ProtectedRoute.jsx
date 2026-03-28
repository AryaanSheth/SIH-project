import { useAuth } from "../lib/AuthContext";

export default function ProtectedRoute({ children }) {
  const { user, loading, signIn } = useAuth();

  if (loading) {
    return (
      <main className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", fontFamily: '"Comic Sans MS", cursive' }}>
          <div style={{ fontSize: "3rem", animation: "blink 1s step-end infinite" }}>⏳</div>
          <div style={{ fontSize: "1.2rem", color: "var(--purple)" }}>checking if you're sigma enough...</div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-shell" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="auth-gate-box">
          <div className="auth-gate-badge">🚨 ACCESS DENIED 🚨</div>
          <h1 className="auth-gate-title">you must be logged in to lose aura</h1>
          <p className="auth-gate-sub">
            we need to know WHO you are before we sell your data.<br />
            <span style={{ fontSize: "0.8rem", color: "#9ca3af" }}>(this is for your protection. it is not.)</span>
          </p>
          <button className="hp-btn-primary hp-btn-big" onClick={signIn}>
            Sign in with Google →
          </button>
          <p style={{ fontSize: "0.7rem", color: "#6b7280", marginTop: 12, maxWidth: 320, textAlign: "center" }}>
            by signing in you agree to let us associate your brainrot with your real name forever. this cannot be undone.
          </p>
          <a href="/" style={{ display: "block", marginTop: 16, color: "var(--purple)", fontSize: "0.85rem" }}>← back to homepage</a>
        </div>
      </main>
    );
  }

  return children;
}
