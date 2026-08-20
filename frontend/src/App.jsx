function App() {
  return (
    <>
      {/* Navbar */}
      <nav className="navbar">
        <div className="logo">Accountability Partner</div>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#about">About</a>
          <button className="login-btn">Login</button>
          <button className="get-started-btn">Get Started</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero" id="home">
        <div className="hero-content">
          <p className="small-heading">
            YOUR GOALS. YOUR PARTNER. YOUR SUCCESS.
          </p>

          <h1>
            Stay Accountable.
            <br />
            Achieve Your Goals.
          </h1>

          <p className="hero-text">
            Find an accountability partner who motivates you,
            keeps you consistent, and helps you reach your goals.
          </p>

          <button className="hero-btn">Get Started →</button>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works" id="how-it-works">
        <p className="section-label">SIMPLE & EFFECTIVE</p>

        <h2>How It Works</h2>

        <p className="section-description">
          Stay motivated and achieve your goals together.
        </p>

        <div className="cards">
          <div className="card">
            <div className="icon">🎯</div>
            <h3>Set Your Goal</h3>
            <p>
              Choose a goal and decide what you want to achieve.
            </p>
          </div>

          <div className="card">
            <div className="icon">🤝</div>
            <h3>Find a Partner</h3>
            <p>
              Connect with someone who has similar goals and interests.
            </p>
          </div>

          <div className="card">
            <div className="icon">🔥</div>
            <h3>Stay Accountable</h3>
            <p>
              Motivate each other, complete tasks and maintain your streak.
            </p>
          </div>
        </div>
      </section>

      {/* About */}
      <section className="about" id="about">
        <p className="section-label">ABOUT US</p>

        <h2>Achieve More Together</h2>

        <p>
          Accountability Partner helps people stay consistent by
          connecting them with someone who shares the same commitment
          to achieving their goals.
        </p>
      </section>

      {/* Footer */}
      <footer>
        <p>© 2026 Accountability Partner. All rights reserved.</p>
      </footer>
    </>
  );
}

export default App;