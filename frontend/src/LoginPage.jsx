import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "./api";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(username, password);
      navigate("/dashboard");
    } catch {
      setError("Invalid username or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-mark">🏍️</div>
      <h2>RideSync</h2>
      <p className="login-sub">Sign in with the account your group admin set up</p>

      <form onSubmit={handleSubmit}>
        <div className="login-field">
          <label>Username</label>
          <input className="input-modern" type="text" placeholder="e.g. test.rider"
            value={username} onChange={(e) => setUsername(e.target.value)} required />
        </div>
        <div className="login-field">
          <label>Password</label>
          <input className="input-modern" type="password" placeholder="••••••••"
            value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p className="error-text">{error}</p>}
        <button className="btn btn-amber btn-block" type="submit" disabled={loading}>
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="login-note">
        Accounts are created by an admin — contact your group admin if you don't have credentials yet.
      </p>
    </div>
  );
}
