import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
<<<<<<< HEAD
  e.preventDefault();
  try {
    const res = await fetch("http://127.0.0.1:8000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        email: formData.email,
        password: formData.password,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.detail || "Login failed");
      return;
    }
    localStorage.setItem("access_token", data.access_token);
    navigate("/profile");
  } catch (err) {
    alert("Could not reach the server");
  }
};
=======
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const formPayload = new URLSearchParams();
      formPayload.append("email", formData.email);
      formPayload.append("password", formData.password);

      const response = await fetch("http://localhost:8000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formPayload,
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMsg = "Invalid email or password";
        if (typeof data.detail === "string") {
          errorMsg = data.detail;
        } else if (Array.isArray(data.detail)) {
          errorMsg = data.detail.map((d) => d.msg || d).join(", ");
        }
        throw new Error(errorMsg);
      }

      if (data.access_token) {
        localStorage.setItem("access_token", data.access_token);
      }
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      navigate("/create-goal");
    } catch (err) {
      console.error("Login error:", err);
      if (err.message === "Failed to fetch") {
        setError("Unable to connect to the server. Please make sure FastAPI is running.");
      } else {
        setError(err.message || "Failed to log in");
      }
    } finally {
      setLoading(false);
    }
  };

>>>>>>> origin/main
  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-logo">
          <div className="auth-logo-icon">●</div>
          Saathi
        </div>

        <div className="auth-left-content">
          <div className="auth-tag">✦ YOUR GOALS, YOUR PARTNER</div>
          <h1>
            You don't have<br />
            to<br />
            <span>do it alone.</span>
          </h1>
          <p>
            Stay motivated, stay consistent, and achieve your goals together with
            someone who keeps you accountable.
          </p>

          <div className="auth-quote">
            <span>“</span>
            <p>
              Accountability turns intentions into actions, and consistency turns
              actions into lifelong habits.
            </p>
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          <div className="auth-heading">
            <h2>Welcome back!</h2>
            <p>Log in to continue your accountability journey.</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div
                style={{
                  color: "#c9603e",
                  background: "#fdeee9",
                  padding: "10px 14px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  marginBottom: "18px",
                  fontWeight: "500",
                }}
              >
                {error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">EMAIL ADDRESS</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <div className="password-label">
                <label htmlFor="password">PASSWORD</label>
                <Link to="/forgot-password">Forgot password?</Link>
              </div>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <button type="submit" className="auth-submit" disabled={loading}>
              {loading ? "Logging in..." : "Login →"}
            </button>
          </form>

          <div className="auth-divider">
            <span>or</span>
          </div>

          <div className="auth-switch">
            Don't have an account? <Link to="/register">Create one</Link>
          </div>

          <Link to="/" className="back-home">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;