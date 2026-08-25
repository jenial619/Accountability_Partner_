import { Link } from "react-router-dom";
import "./Partner.css";

function Partner() {
  return (
    <div className="partner-page">

      <aside className="partner-sidebar">

        <Link to="/" className="partner-logo">
          <span>◉</span>
          Saathi
        </Link>

        <nav>
          <Link to="/dashboard">⌂ Dashboard</Link>
          <Link to="/goals">🎯 My Goals</Link>
          <Link to="/partners" className="active">
            🤝 My Partner
          </Link>
          <Link to="/profile">👤 Profile</Link>
        </nav>

        <Link to="/" className="partner-logout">
          ↪ Logout
        </Link>

      </aside>


      <main className="partner-main">

        <header className="partner-page-header">
          <div>
            <p>ACCOUNTABILITY</p>
            <h1>My Partner</h1>
            <span>
              Stay accountable and grow together.
            </span>
          </div>
        </header>


        <section className="partner-profile-card">

          <div className="large-partner-avatar">
            A
          </div>

          <div className="partner-info">
            <span className="online-badge">
              ● Online
            </span>

            <h2>Alex Johnson</h2>

            <p>
              Your accountability partner
            </p>

            <div className="partner-stats">
              <div>
                <strong>82%</strong>
                <span>Progress</span>
              </div>

              <div>
                <strong>12</strong>
                <span>Goals Completed</span>
              </div>

              <div>
                <strong>14 🔥</strong>
                <span>Day Streak</span>
              </div>
            </div>
          </div>

        </section>


        <div className="partner-grid">

          <section className="partner-progress-card">

            <div className="partner-section-title">
              <span>PARTNER'S GOALS</span>
              <h2>Current Progress</h2>
            </div>


            <div className="partner-goal">

              <div>
                <h3>Daily Coding</h3>
                <p>Practice coding every day</p>
              </div>

              <strong>90%</strong>

              <div className="partner-bar">
                <div style={{ width: "90%" }}></div>
              </div>

            </div>


            <div className="partner-goal">

              <div>
                <h3>Read Daily</h3>
                <p>Read at least 20 pages</p>
              </div>

              <strong>70%</strong>

              <div className="partner-bar">
                <div style={{ width: "70%" }}></div>
              </div>

            </div>


            <div className="partner-goal">

              <div>
                <h3>Project Work</h3>
                <p>Work on final year project</p>
              </div>

              <strong>85%</strong>

              <div className="partner-bar">
                <div style={{ width: "85%" }}></div>
              </div>

            </div>

          </section>


          <section className="message-card">

            <div className="partner-section-title">
              <span>STAY CONNECTED</span>
              <h2>Send a Message</h2>
            </div>

            <textarea
              placeholder="Send some encouragement..."
            ></textarea>

            <button>
              Send Message →
            </button>

          </section>

        </div>


        <section className="encouragement-card">

          <div>
            <span>💛</span>
          </div>

          <div>
            <h3>Keep each other accountable</h3>
            <p>
              Encourage your partner when they're
              making progress and celebrate the small wins together.
            </p>
          </div>

        </section>

      </main>

    </div>
  );
}

export default Partner;