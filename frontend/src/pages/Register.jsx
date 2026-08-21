import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./Register.css";

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    console.log("Registration data:", formData);

    // Temporary navigation
    // Later this will call your FastAPI registration API
    navigate("/dashboard");
  };

  return (
    <div className="register-page">

      {/* Left Side */}
      <div className="register-left">

        <Link to="/" className="register-logo">
          <span className="register-logo-icon">◉</span>
          Saathi
        </Link>

        <div className="register-left-content">

          <span className="register-tag">
            ✦ START YOUR JOURNEY
          </span>

          <h1>
            Your goals.
            <br />
            <span>Your partner.</span>
            <br />
            Your progress.
          </h1>

          <p>
            Create an account, set your goals and find someone
            who will help you stay committed every step of the way.
          </p>

          <div className="register-benefits">

            <div>
              <span>✓</span>
              Set and track your goals
            </div>

            <div>
              <span>✓</span>
              Find an accountability partner
            </div>

            <div>
              <span>✓</span>
              Grow together
            </div>

          </div>

        </div>

      </div>


      {/* Right Side */}
      <div className="register-right">

        <div className="register-card">

          <div className="register-heading">
            <h2>Create your account</h2>
            <p>
              Start building better habits with a partner.
            </p>
          </div>


          <form onSubmit={handleSubmit}>

            <div className="form-group">

              <label htmlFor="name">
                Full name
              </label>

              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your name"
                value={formData.name}
                onChange={handleChange}
                required
              />

            </div>


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

              <label htmlFor="password">
                Password
              </label>

              <input
                type="password"
                id="password"
                name="password"
                placeholder="Create a password"
                value={formData.password}
                onChange={handleChange}
                minLength="6"
                required
              />

            </div>


            <div className="form-group">

              <label htmlFor="confirmPassword">
                Confirm password
              </label>

              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                minLength="6"
                required
              />

            </div>


            <button
              type="submit"
              className="register-submit"
            >
              Create Account →
            </button>

          </form>


          <div className="register-divider">
            <span>Already have an account?</span>
          </div>


          <p className="register-login">
            <Link to="/login">
              Log in to Saathi
            </Link>
          </p>


          <Link to="/" className="register-back">
            ← Back to home
          </Link>

        </div>

      </div>

    </div>
  );
}

export default Register;