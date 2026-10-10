import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
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
  return (
    <div className="auth-page">

      {/* Left Side */}
      <div className="auth-left">

        <Link to="/" className="auth-logo">
          <span className="auth-logo-icon">◉</span>
          Saathi
        </Link>

        <div className="auth-left-content">
          <span className="auth-tag">
            ✦ YOUR GOALS, YOUR PARTNER
          </span>

          <h1>
            You don't have to
            <br />
            <span>do it alone.</span>
          </h1>

          <p>
            Stay motivated, stay consistent, and achieve your
            goals together with someone who keeps you accountable.
          </p>

          <div className="auth-quote">
            <span>“</span>
            <p>
              Progress becomes easier when someone
              believes in you.
            </p>
          </div>
        </div>

      </div>


      {/* Right Side */}
      <div className="auth-right">

        <div className="auth-card">

          <div className="auth-heading">
            <h2>Welcome back!</h2>
            <p>Log in to continue your accountability journey.</p>
          </div>


          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label htmlFor="email">
                Email address
              </label>

              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>


            <div className="form-group">
              <div className="password-label">
                <label htmlFor="password">
                  Password
                </label>

                <a href="#forgot">
                  Forgot password?
                </a>
              </div>

              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>


            <button
              type="submit"
              className="auth-submit"
            >
              Login →
            </button>

          </form>


          <div className="auth-divider">
            <span>or</span>
          </div>


          <p className="auth-switch">
            Don't have an account?

            <Link to="/register">
              Create one
            </Link>
          </p>


          <Link to="/" className="back-home">
            ← Back to home
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Login;