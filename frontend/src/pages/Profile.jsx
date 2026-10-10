import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";

<<<<<<< HEAD
const API_URL = import.meta.env?.VITE_API_URL || "http://127.0.0.1:8000";

const readBool = (key, fallback = false) => {
  const value = localStorage.getItem(key);
  return value === null ? fallback : value === "true";
};

function Sidebar({ onLogout }) {
  return (
    <aside className="profile-sidebar">
      <Link to="/" className="profile-logo">
        <span>◉</span> Saathi
      </Link>

      {onLogout && (
        <>
          <nav>
            <Link to="/dashboard">⌂ Dashboard</Link>
            <Link to="/goals">🎯 My Goals</Link>
            <Link to="/partners">🤝 My Partners</Link>
            <Link to="/profile" className="active">
              👤 Profile
            </Link>
          </nav>

          <button type="button" className="profile-logout" onClick={onLogout}>
            ↪ Logout
          </button>
        </>
      )}
    </aside>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      className={`toggle ${checked ? "active-toggle" : ""}`}
      onClick={onChange}
    >
      {checked ? "✓" : ""}
    </button>
  );
}

function Profile() {
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState(() => readBool("darkMode"));
  const [dailyReminders, setDailyReminders] = useState(() =>
    readBool("dailyReminders", true)
  );
  const [partnerUpdates, setPartnerUpdates] = useState(() =>
    readBool("partnerUpdates", true)
  );

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    current_streak: 0,
    completed_goals: 0,
    goal_success: 0,
    accountability_partner: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [saveMessage, setSaveMessage] = useState("");

  const [profilePicture, setProfilePicture] = useState(
    () => localStorage.getItem("profilePicture") || ""
  );

  useEffect(() => {
    // NO NAVIGATION / REDIRECTION CHECKS HERE ANYMORE
    const token = localStorage.getItem("access_token");
    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        const options = {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
        };

        const [userRes, statsRes] = await Promise.all([
          fetch(`${API_URL}/users/me`, options),
          fetch(`${API_URL}/users/me/stats`, options),
        ]);

        if (!userRes.ok) {
          throw new Error(`Server returned status ${userRes.status}`);
        }

        const fetchedUser = await userRes.json();

        // Reapply locally saved edits after fetching the account.
        let savedOverrides = {};
        try {
          savedOverrides = JSON.parse(
            localStorage.getItem("profileOverrides") || "{}"
          );
        } catch {
          savedOverrides = {};
        }

        const mergedUser = { ...fetchedUser, ...savedOverrides };
        setUser(mergedUser);
        setEditName(mergedUser.name || "");
        setEditEmail(mergedUser.email || "");

        if (statsRes.ok) {
          setStats(await statsRes.json());
        } else {
          console.error("Failed to fetch profile statistics");
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        console.error("Profile error (Non-blocking):", err);
        
        // Fallback user data so the page renders safely without crashing or redirecting
        setUser({
          name: "Test User",
          email: "test@example.com",
          created_at: new Date().toISOString(),
          id: "local-dev-id",
        });
        setError("Backend offline or unauthorized. Displaying local dev profile.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
=======
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
>>>>>>> origin/main
      }
    };

    fetchProfile();
<<<<<<< HEAD
    return () => controller.abort();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    // Explicitly doing nothing else so you stay right here
    setSaveMessage("Logged out locally. You are staying on this page.");
  };

  const toggleSetting = (key, value, setter) => {
    const next = !value;
    setter(next);
    localStorage.setItem(key, String(next));
  };

  const startEditing = () => {
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setSaveMessage("");
    setIsEditing(true);
  };

  const saveProfile = (event) => {
    event.preventDefault();

    const name = editName.trim();
    const email = editEmail.trim();

    if (!name || !email) {
      setSaveMessage("Please enter both your name and email.");
      return;
    }

    const updatedUser = { ...user, name, email };

    try {
      localStorage.setItem(
        "profileOverrides",
        JSON.stringify({ name, email })
      );
      setUser(updatedUser);
      setIsEditing(false);
      setSaveMessage("Profile changes saved in this browser.");
    } catch {
      setSaveMessage("Could not save changes. Browser storage may be full.");
    }
  };

  const cancelEditing = () => {
    setEditName(user.name || "");
    setEditEmail(user.email || "");
    setIsEditing(false);
    setSaveMessage("");
  };

  const handlePictureChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setSaveMessage("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > 1024 * 1024) {
      setSaveMessage("Choose an image smaller than 1 MB.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      try {
        const imageData = reader.result;
        localStorage.setItem("profilePicture", imageData);
        setProfilePicture(imageData);
        setSaveMessage("Profile picture saved in this browser.");
      } catch {
        setSaveMessage("Could not save the picture. Try a smaller image.");
      }
    };

    reader.onerror = () => {
      setSaveMessage("Could not read that image. Please try another.");
    };

    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const themeClass = darkMode ? "dark-theme" : "";

  if (loading) {
    return (
      <div className={`profile-page ${themeClass}`}>
        <Sidebar />
        <main className="profile-main">
          <h2>Loading profile...</h2>
        </main>
=======
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

>>>>>>> origin/main
      </div>
    );
  }

<<<<<<< HEAD
  if (!user) {
    return (
      <div className={`profile-page ${themeClass}`}>
        <Sidebar />
        <main className="profile-main">
          <h2>{error || "Profile data is missing."}</h2>
          <p>Check the browser console for details.</p>
        </main>
=======

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

>>>>>>> origin/main
      </div>
    );
  }

<<<<<<< HEAD
=======

>>>>>>> origin/main
  const firstLetter = user.name
    ? user.name.charAt(0).toUpperCase()
    : "U";

<<<<<<< HEAD
  const createdDate = user.created_at ? new Date(user.created_at) : null;
  const memberSince =
    createdDate && !isNaN(createdDate)
      ? createdDate.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        })
      : "Unknown";

  return (
    <div className={`profile-page ${themeClass}`}>
      <Sidebar onLogout={handleLogout} />

      <main className="profile-main">
        <header className="profile-header">
          <p>ACCOUNT</p>
          <h1>My Profile</h1>
          <span>Manage your Saathi profile and preferences.</span>
        </header>

        {error && (
          <p style={{ color: "#ff8a68", marginBottom: "15px", fontSize: "12px", fontWeight: "600" }}>
            ⚠️ {error}
          </p>
        )}

        <section className="profile-card">
          <div className="profile-top">
            <div className="profile-avatar-area">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Your profile"
                  className="profile-big-avatar profile-picture"
                />
              ) : (
                <div className="profile-big-avatar">{firstLetter}</div>
              )}

              <label className="picture-upload">
                Change picture
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureChange}
                  hidden
                />
              </label>
            </div>

            <div className="profile-user-info">
              <h2>{user.name}</h2>
              <p>{user.email}</p>
              <span>Member since {memberSince}</span>
            </div>

            {!isEditing && (
              <button
                className="edit-profile"
                type="button"
                onClick={startEditing}
              >
                Edit Profile
              </button>
            )}
          </div>

          <form className="profile-form" onSubmit={saveProfile}>
            <div className="profile-field">
              <label htmlFor="full-name">Full Name</label>
              <input
                id="full-name"
                type="text"
                value={isEditing ? editName : user.name || ""}
                onChange={(event) => setEditName(event.target.value)}
                readOnly={!isEditing}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={isEditing ? editEmail : user.email || ""}
                onChange={(event) => setEditEmail(event.target.value)}
                readOnly={!isEditing}
              />
            </div>

            <div className="profile-field">
              <label htmlFor="user-id">User ID</label>
              <input
                id="user-id"
                type="text"
                value={user.id ?? ""}
                readOnly
              />
            </div>

            <div className="profile-field">
              <label htmlFor="status">Accountability Status</label>
              <input
                id="status"
=======

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
>>>>>>> origin/main
                type="text"
                value="Active"
                readOnly
              />
<<<<<<< HEAD
            </div>

            {isEditing && (
              <div className="profile-edit-actions">
                <button className="edit-profile" type="submit">
                  Save Changes
                </button>
                <button
                  className="cancel-profile"
                  type="button"
                  onClick={cancelEditing}
                >
                  Cancel
                </button>
              </div>
            )}
          </form>

          {saveMessage && (
            <p className="profile-save-message" role="status">
              {saveMessage}
            </p>
          )}
        </section>

        <section className="profile-stats">
          <div>
            <strong>{stats?.current_streak ?? 0}</strong>
            <span>Current Streak</span>
          </div>

          <div>
            <strong>{stats?.completed_goals ?? 0}</strong>
            <span>Goals Completed</span>
          </div>

          <div>
            <strong>{stats?.goal_success ?? 0}%</strong>
            <span>Goal Success</span>
          </div>

          <div>
            <strong>{stats?.accountability_partner ?? 0}</strong>
            <span>Accountability Partner</span>
          </div>
        </section>

        <section className="preferences-card">
          <h2>Preferences</h2>

          <div className="preference">
            <div>
              <h3>Dark Theme</h3>
              <p>Switch between light and dark mode.</p>
            </div>
            <Toggle
              checked={darkMode}
              label="Toggle dark theme"
              onChange={() => toggleSetting("darkMode", darkMode, setDarkMode)}
            />
          </div>

          <div className="preference">
            <div>
              <h3>Daily Reminders</h3>
              <p>Receive reminders about your daily goals.</p>
            </div>
            <Toggle
              checked={dailyReminders}
              label="Toggle daily reminders"
              onChange={() =>
                toggleSetting("dailyReminders", dailyReminders, setDailyReminders)
              }
            />
          </div>

          <div className="preference">
            <div>
              <h3>Partner Updates</h3>
              <p>Get notified when your partner completes a goal.</p>
            </div>
            <Toggle
              checked={partnerUpdates}
              label="Toggle partner updates"
              onChange={() =>
                toggleSetting("partnerUpdates", partnerUpdates, setPartnerUpdates)
              }
            />
          </div>
        </section>
        
      </main>
=======

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

>>>>>>> origin/main
    </div>
  );
}

<<<<<<< HEAD

=======
>>>>>>> origin/main
export default Profile;