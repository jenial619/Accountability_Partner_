import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";

function Profile() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Fetch user profile
        const response = await fetch(
          "http://127.0.0.1:8000/users/me",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }

        const userData = await response.json();
        setUser(userData);

        // Fetch profile statistics
        const statsResponse = await fetch(
          "http://127.0.0.1:8000/users/me/stats",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!statsResponse.ok) {
          throw new Error("Failed to fetch profile statistics");
        }

        const statsData = await statsResponse.json();
        setStats(statsData);

      } catch (error) {
        console.error("Profile error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [navigate]);


  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };


  if (loading) {
    return (
      <div className="profile-page">

        <aside className="profile-sidebar">

          <Link to="/" className="profile-logo">
            <span>◉</span>
            Saathi
          </Link>

        </aside>

        <main className="profile-main">
          <h2>Loading profile...</h2>
        </main>

      </div>
    );
  }


  if (!user) {
    return (
      <div className="profile-page">

        <aside className="profile-sidebar">

          <Link to="/" className="profile-logo">
            <span>◉</span>
            Saathi
          </Link>

        </aside>

        <main className="profile-main">
          <h2>Unable to load profile.</h2>
        </main>

      </div>
    );
  }


  const firstLetter = user.name
    ? user.name.charAt(0).toUpperCase()
    : "U";


  const memberSince = user.created_at
    ? new Date(user.created_at).toLocaleDateString(
        "en-US",
        {
          month: "long",
          year: "numeric",
        }
      )
    : "Unknown";


  return (
    <div className="profile-page">

      {/* SIDEBAR */}

      <aside className="profile-sidebar">

        <Link to="/" className="profile-logo">
          <span>◉</span>
          Saathi
        </Link>


        <nav>

          <Link to="/dashboard">
            ⌂ Dashboard
          </Link>

          <Link to="/goals">
            🎯 My Goals
          </Link>

          <Link to="/partners">
            🤝 My Partners
          </Link>

          <Link to="/profile" className="active">
            👤 Profile
          </Link>

        </nav>


        <button
          className="profile-logout"
          onClick={handleLogout}
        >
          ↪ Logout
        </button>

      </aside>


      {/* MAIN CONTENT */}

      <main className="profile-main">


        {/* HEADER */}

        <header className="profile-header">

          <p>ACCOUNT</p>

          <h1>My Profile</h1>

          <span>
            Manage your Saathi profile and preferences.
          </span>

        </header>


        {/* PROFILE CARD */}

        <section className="profile-card">

          <div className="profile-top">


            {/* AVATAR */}

            <div className="profile-big-avatar">
              {firstLetter}
            </div>


            {/* USER INFORMATION */}

            <div>

              <h2>
                {user.name}
              </h2>

              <p>
                {user.email}
              </p>

              <span>
                Member since {memberSince}
              </span>

            </div>


            <button
              className="edit-profile"
              type="button"
            >
              Edit Profile
            </button>

          </div>


          {/* PROFILE FORM */}

          <div className="profile-form">


            <div className="profile-field">

              <label>
                Full Name
              </label>

              <input
                type="text"
                value={user.name}
                readOnly
              />

            </div>


            <div className="profile-field">

              <label>
                Email
              </label>

              <input
                type="email"
                value={user.email}
                readOnly
              />

            </div>


            <div className="profile-field">

              <label>
                User ID
              </label>

              <input
                type="text"
                value={user.id}
                readOnly
              />

            </div>


            <div className="profile-field">

              <label>
                Accountability Status
              </label>

              <input
                type="text"
                value="Active"
                readOnly
              />

            </div>

          </div>

        </section>


        {/* PROFILE STATISTICS */}

        <section className="profile-stats">


          {/* CURRENT STREAK */}

          <div>

            <strong>
              0
            </strong>

            <span>
              Current Streak
            </span>

          </div>


          {/* COMPLETED GOALS */}

          <div>

            <strong>
              {stats?.completed_goals ?? 0}
            </strong>

            <span>
              Goals Completed
            </span>

          </div>


          {/* GOAL SUCCESS */}

          <div>

            <strong>
              {stats?.goal_success ?? 0}%
            </strong>

            <span>
              Goal Success
            </span>

          </div>


          {/* ACCOUNTABILITY PARTNER */}

          <div>

            <strong>
              0
            </strong>

            <span>
              Accountability Partner
            </span>

          </div>

        </section>


        {/* PREFERENCES */}

        <section className="preferences-card">

          <h2>
            Preferences
          </h2>


          {/* DAILY REMINDERS */}

          <div className="preference">

            <div>

              <h3>
                Daily Reminders
              </h3>

              <p>
                Receive reminders about your daily goals.
              </p>

            </div>


            <div className="toggle active-toggle">
              ✓
            </div>

          </div>


          {/* PARTNER UPDATES */}

          <div className="preference">

            <div>

              <h3>
                Partner Updates
              </h3>

              <p>
                Get notified when your partner completes a goal.
              </p>

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