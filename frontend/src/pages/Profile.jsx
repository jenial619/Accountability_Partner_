import { Link } from "react-router-dom";
import "./Profile.css";

function Profile() {
  return (
    <div className="profile-page">

      <aside className="profile-sidebar">

        <Link to="/" className="profile-logo">
          <span>◉</span>
          Saathi
        </Link>

        <nav>
          <Link to="/dashboard">⌂ Dashboard</Link>
          <Link to="/goals">🎯 My Goals</Link>
          <Link to="/partners">🤝 My Partner</Link>
          <Link to="/profile" className="active">
            👤 Profile
          </Link>
        </nav>

        <Link to="/" className="profile-logout">
          ↪ Logout
        </Link>

      </aside>


      <main className="profile-main">

        <header className="profile-header">
          <p>ACCOUNT</p>
          <h1>My Profile</h1>
          <span>Manage your Pactly profile and preferences.</span>
        </header>


        <section className="profile-card">

          <div className="profile-top">

            <div className="profile-big-avatar">
              S
            </div>

            <div>
              <h2>Sarah Mathias</h2>
              <p>sarah@example.com</p>
              <span>Member since August 2026</span>
            </div>

            <button className="edit-profile">
              Edit Profile
            </button>

          </div>


          <div className="profile-form">

            <div className="profile-field">
              <label>Full Name</label>
              <input
                type="text"
                value="Sarah Mathias"
                readOnly
              />
            </div>

            <div className="profile-field">
              <label>Email</label>
              <input
                type="email"
                value="sarah@example.com"
                readOnly
              />
            </div>

            <div className="profile-field">
              <label>Username</label>
              <input
                type="text"
                value="sarah"
                readOnly
              />
            </div>

            <div className="profile-field">
              <label>Accountability Status</label>
              <input
                type="text"
                value="Active"
                readOnly
              />
            </div>

          </div>

        </section>


        <section className="profile-stats">

          <div>
            <strong>7</strong>
            <span>Current Streak</span>
          </div>

          <div>
            <strong>12</strong>
            <span>Goals Completed</span>
          </div>

          <div>
            <strong>68%</strong>
            <span>Goal Success</span>
          </div>

          <div>
            <strong>1</strong>
            <span>Accountability Partner</span>
          </div>

        </section>


        <section className="preferences-card">

          <h2>Preferences</h2>

          <div className="preference">
            <div>
              <h3>Daily Reminders</h3>
              <p>Receive reminders about your daily goals.</p>
            </div>

            <div className="toggle active-toggle">
              ✓
            </div>
          </div>


          <div className="preference">
            <div>
              <h3>Partner Updates</h3>
              <p>Get notified when your partner completes a goal.</p>
            </div>

            <div className="toggle active-toggle">
              ✓
            </div>
          </div>

        </section>

      </main>

    </div>
  );
}

export default Profile;