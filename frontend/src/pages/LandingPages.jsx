import { Link } from "react-router-dom";
import "./LandingPage.css";

function LandingPage() {
  return (
    <div className="landing-page">

      <nav className="navbar">
        <div className="logo">
          <span className="logo-icon">◉</span>
          Saa<span>thi</span>
        </div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
        </div>

        <div className="nav-buttons">
          <Link to="/login" className="login-btn">
            Login
          </Link>

          <Link to="/register" className="nav-signup-btn">
            Get Started
          </Link>
        </div>
      </nav>


      <section className="hero" id="home">

        <div className="hero-content">

          <div className="small-tag">
            ✦ Stay consistent. Stay accountable.
          </div>

          <h1>
            Achieve more
            <br />
            when you <span>don't do it alone.</span>
          </h1>

          <p>
            Set meaningful goals, find an accountability partner,
            and stay motivated together. Because progress is easier
            when someone is cheering you on.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="primary-btn">
              Find Your Partner →
            </Link>

            <a href="#how-it-works" className="secondary-btn">
              See How It Works
            </a>
          </div>

          <div className="hero-stats">
            <div>
              <strong>100%</strong>
              <span>Accountability</span>
            </div>

            <div>
              <strong>24/7</strong>
              <span>Motivation</span>
            </div>

            <div>
              <strong>1 : 1</strong>
              <span>Partnership</span>
            </div>
          </div>

        </div>


        <div className="hero-visual">

          <div className="circle-bg"></div>

          <div className="person-card person-one">
            <div className="avatar">👩🏻</div>
            <div>
              <strong>Sarah</strong>
              <small>Working on her goals</small>
            </div>
            <div className="check">✓</div>
          </div>

          <div className="person-card person-two">
            <div className="avatar">👨🏻</div>
            <div>
              <strong>Alex</strong>
              <small>Keeping Sarah accountable</small>
            </div>
            <div className="heart">♥</div>
          </div>

          <div className="goal-card">

            <div className="goal-header">
              <span>Today's Progress</span>
              <strong>75%</strong>
            </div>

            <div className="progress-bar">
              <div className="progress"></div>
            </div>

            <p>Keep going! You're doing great ✨</p>

          </div>

        </div>

      </section>


      <section className="features-section" id="features">

        <div className="section-heading">
          <span>WHY SAATHI?</span>

          <h2>
            Small steps become
            <br />
            <em>big achievements.</em>
          </h2>

          <p>
            Everything you need to build better habits and stay
            committed to your goals.
          </p>
        </div>


        <div className="feature-grid">

          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>Set Clear Goals</h3>
            <p>
              Define what you want to achieve and turn your
              ambitions into achievable goals.
            </p>
          </div>


          <div className="feature-card featured">
            <div className="feature-icon">🤝</div>
            <h3>Find Your Partner</h3>
            <p>
              Connect with someone who can motivate you,
              support you, and keep you on track.
            </p>
          </div>


          <div className="feature-card">
            <div className="feature-icon">📈</div>
            <h3>Track Progress</h3>
            <p>
              See your progress, celebrate milestones and
              stay consistent every day.
            </p>
          </div>

        </div>

      </section>


      <section className="how-section" id="how-it-works">

        <div className="section-heading">
          <span>HOW IT WORKS</span>

          <h2>
            Three steps.
            <br />
            <em>One better you.</em>
          </h2>
        </div>


        <div className="steps">

          <div className="step">
            <div className="step-number">01</div>
            <h3>Create Your Goal</h3>
            <p>
              Tell us what you want to accomplish and set
              a realistic target.
            </p>
          </div>

          <div className="step">
            <div className="step-number">02</div>
            <h3>Meet Your Partner</h3>
            <p>
              Connect with someone who shares your commitment
              to personal growth.
            </p>
          </div>

          <div className="step">
            <div className="step-number">03</div>
            <h3>Grow Together</h3>
            <p>
              Track your progress and keep each other motivated
              along the journey.
            </p>
          </div>

        </div>

      </section>


      <section className="cta-section">

        <div>
          <span>READY TO GET STARTED?</span>

          <h2>
            Your goals deserve
            <br />
            a little <em>support.</em>
          </h2>

          <p>
            Start your accountability journey today.
          </p>

          <Link to="/register" className="cta-button">
            Create Your Free Account →
          </Link>
        </div>

      </section>


      <footer>

        <div className="footer-logo">
          Saa<span>thi</span>
        </div>

        <p>
          Helping people stay consistent, together.
        </p>

        <div className="footer-links">
          <a href="#home">Home</a>
          <a href="#features">Features</a>
          <a href="#how-it-works">How It Works</a>
        </div>

        <div className="copyright">
          © 2026 Saathi. All rights reserved.
        </div>

      </footer>

    </div>
  );
}

export default LandingPage;
