
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Profile.css";

const API_URL = import.meta.env.VITE_API_URL;
const PROFILE_PHOTO_KEY = "saathi_profile_photo";
const THEME_KEY = "saathi_theme";

function Profile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [form, setForm] = useState({ name: "", email: "" });
  const [photo, setPhoto] = useState(
    () => localStorage.getItem(PROFILE_PHOTO_KEY) || ""
  );
  const [darkMode, setDarkMode] = useState(
    () => localStorage.getItem(THEME_KEY) === "dark"
  );

  useEffect(() => {
    document.documentElement.dataset.theme = darkMode ? "dark" : "light";
    localStorage.setItem(THEME_KEY, darkMode ? "dark" : "light");
  }, [darkMode]);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        const headers = { Authorization: `Bearer ${token}` };

        const response = await fetch(`${API_URL}/users/me`, { headers });

        if (!response.ok) {
          throw new Error("Failed to fetch your profile.");
        }

        const userData = await response.json();
        setUser(userData);
        setForm({
          name: userData.name || "",
          email: userData.email || "",
        });

        // Use the backend image if it supplies one.
        if (userData.profile_picture) {
          setPhoto(userData.profile_picture);
        } else if (userData.profile_picture_url) {
          setPhoto(userData.profile_picture_url);
        }

        const statsResponse = await fetch(`${API_URL}/users/me/stats`, {
          headers,
        });

        if (statsResponse.ok) {
          setStats(await statsResponse.json());
        }
      } catch (err) {
        console.error("Profile error:", err);
        setError(err.message || "Unable to load your profile.");
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

  const startEditing = () => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
    });
    setError("");
    setSuccess("");
    setEditing(true);
  };

  const cancelEditing = () => {
    setForm({
      name: user?.name || "",
      email: user?.email || "",
    });
    setEditing(false);
    setError("");
  };

  const handleFieldChange = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

  const handleSaveProfile = async (event) => {
    event.preventDefault();

    const name = form.name.trim();
    const email = form.email.trim();

    if (!name || !email) {
      setError("Name and email are required.");
      return;
    }

    const token = localStorage.getItem("access_token");
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      /*
       * Backend requirement:
       * Implement PUT /users/me accepting { name, email }.
       * If your backend uses PATCH instead, change the method below.
       */
      const response = await fetch(`${API_URL}/users/me`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email }),
      });

      if (!response.ok) {
        const details = await response.text();
        throw new Error(
          details || "Profile update failed. Check your backend endpoint."
        );
      }

      let updatedUser = {};
      const responseText = await response.text();

      if (responseText) {
        try {
          updatedUser = JSON.parse(responseText);
        } catch {
          updatedUser = {};
        }
      }

      setUser((current) => ({
        ...current,
        ...updatedUser,
        name: updatedUser.name ?? name,
        email: updatedUser.email ?? email,
      }));

      setForm({
        name: updatedUser.name ?? name,
        email: updatedUser.email ?? email,
      });

      setEditing(false);
      setSuccess("Profile updated successfully.");
    } catch (err) {
      console.error("Update profile error:", err);
      setError(
        err.message?.includes("Failed to fetch")
          ? "Cannot reach the backend. Make sure your FastAPI server is running."
          : err.message || "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoSelection = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Please choose an image smaller than 5 MB.");
      return;
    }

    setError("");
    setSuccess("");

    // Show the selected image immediately.
    const reader = new FileReader();

    reader.onload = () => {
      const preview = reader.result;
      setPhoto(preview);

      /*
       * Local fallback: the picture persists in this browser.
       * This does not upload the image to the server.
       */
      try {
        localStorage.setItem(PROFILE_PHOTO_KEY, preview);
      } catch {
        setError(
          "This image is too large to store in the browser. Choose a smaller image."
        );
        return;
      }
    };

    reader.readAsDataURL(file);

    /*
     * Server upload:
     * Enable this block after implementing POST /users/me/photo
     * in your backend. It expects a multipart field named "file".
     */
    const token = localStorage.getItem("access_token");
    setUploadingPhoto(true);

    try {
      const body = new FormData();
      body.append("file", file);

      const response = await fetch(`${API_URL}/users/me/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body,
      });

      if (response.status === 404 || response.status === 405) {
        // Local preview still works when the upload endpoint is not implemented.
        setSuccess(
          "Picture saved in this browser. Server upload needs a photo endpoint."
        );
        return;
      }

      if (!response.ok) {
        throw new Error("The server could not save your profile picture.");
      }

      const result = await response.json();

      if (result.profile_picture_url) {
        setPhoto(result.profile_picture_url);
        localStorage.setItem(PROFILE_PHOTO_KEY, result.profile_picture_url);
      }

      setUser((current) => ({
        ...current,
        profile_picture_url:
          result.profile_picture_url ?? current?.profile_picture_url,
      }));

      setSuccess("Profile picture uploaded successfully.");
    } catch (err) {
      console.error("Photo upload error:", err);
      setSuccess(
        "Picture preview saved in this browser, but server upload failed. Check your photo upload endpoint."
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  const firstLetter = (user?.name || "U").charAt(0).toUpperCase();

  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      })
    : "Unknown";

  if (loading) {
    return (
      <div className="profile-page">
        <aside className="profile-sidebar">
          <Link to="/" className="profile-logo">
            <span>◉</span> Saathi
          </Link>
        </aside>
        <main className="profile-main">
          <p className="profile-message">Loading profile...</p>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="profile-page">
        <aside className="profile-sidebar">
          <Link to="/" className="profile-logo">
            <span>◉</span> Saathi
          </Link>
        </aside>
        <main className="profile-main">
          <p className="profile-message">
            {error || "Unable to load profile. Please try again."}
          </p>
          <button
            className="profile-button primary-button"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <aside className="profile-sidebar">
        <Link to="/" className="profile-logo">
          <span>◉</span>
          Saathi
        </Link>

        <nav className="profile-navigation">
          <Link to="/dashboard">🏠 <span>Dashboard</span></Link>
          <Link to="/goals">🎯 <span>My Goals</span></Link>
          <Link to="/partners">🤝 <span>My Partners</span></Link>
          <Link to="/profile" className="active">👤 <span>Profile</span></Link>
        </nav>

        <div className="profile-sidebar-bottom">
          <p>✦ <span>Small progress is still progress.</span></p>
          <button className="profile-logout" onClick={handleLogout}>
            ↪ <span>Logout</span>
          </button>
        </div>
      </aside>

      <main className="profile-main">
        <header className="profile-page-top">
          <div className="profile-header">
            <p>ACCOUNT</p>
            <h1>My Profile</h1>
            <span>Manage your Saathi profile and preferences.</span>
          </div>

          <button
            type="button"
            className="theme-toggle"
            onClick={() => setDarkMode((current) => !current)}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={darkMode}
          >
            <span>{darkMode ? "☀️" : "🌙"}</span>
            {darkMode ? "Light mode" : "Dark mode"}
          </button>
        </header>

        {error && <div className="profile-alert error-alert">{error}</div>}
        {success && (
          <div className="profile-alert success-alert">{success}</div>
        )}

        <section className="profile-card">
          <div className="profile-top">
            <div className="profile-avatar-wrap">
              {photo ? (
                <img className="profile-big-avatar" src={photo} alt="Profile" />
              ) : (
                <div className="profile-big-avatar">{firstLetter}</div>
              )}

              <button
                className="avatar-edit-button"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Upload profile picture"
                title="Upload profile picture"
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? "…" : "📷"}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="visually-hidden"
                onChange={handlePhotoSelection}
              />
            </div>

            <div className="profile-identity">
              <h2>{user.name || "Saathi User"}</h2>
              <p>{user.email}</p>
              <span>Member since {memberSince}</span>
              <small>Click the camera icon to change your photo.</small>
            </div>

            {!editing && (
              <button
                className="profile-button edit-profile"
                type="button"
                onClick={startEditing}
              >
                ✎ Edit Profile
              </button>
            )}
          </div>

          {editing ? (
            <form className="profile-form" onSubmit={handleSaveProfile}>
              <div className="profile-field">
                <label htmlFor="profile-name">Full Name</label>
                <input
                  id="profile-name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleFieldChange}
                  autoComplete="name"
                  required
                  maxLength={100}
                />
              </div>

              <div className="profile-field">
                <label htmlFor="profile-email">Email Address</label>
                <input
                  id="profile-email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleFieldChange}
                  autoComplete="email"
                  required
                  maxLength={255}
                />
              </div>

              <div className="profile-field">
                <label>User ID</label>
                <input value={user.id ?? "Not available"} readOnly />
              </div>

              <div className="profile-field">
                <label>Account Status</label>
                <input value="Active" readOnly />
              </div>

              <div className="profile-form-actions">
                <button
                  className="profile-button secondary-button"
                  type="button"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  className="profile-button primary-button"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-form">
              <div className="profile-field">
                <label>Full Name</label>
                <input value={user.name || ""} readOnly />
              </div>

              <div className="profile-field">
                <label>Email Address</label>
                <input value={user.email || ""} readOnly />
              </div>

              <div className="profile-field">
                <label>User ID</label>
                <input value={user.id ?? "Not available"} readOnly />
              </div>

              <div className="profile-field">
                <label>Account Status</label>
                <input value="Active" readOnly />
              </div>
            </div>
          )}
        </section>

        <section className="profile-stats">
          <div className="stat-card stat-peach">
            <strong>{stats?.current_streak ?? 0}</strong>
            <span>Current Streak</span>
          </div>
          <div className="stat-card stat-green">
            <strong>{stats?.completed_goals ?? 1}</strong>
            <span>Goals Completed</span>
          </div>
          <div className="stat-card stat-purple">
            <strong>{stats?.goal_success ?? 0}%</strong>
            <span>Goal Success</span>
          </div>
          <div className="stat-card stat-blue">
            <strong>{stats?.accountability_partners ?? 2}</strong>
            <span>Accountability Partners</span>
          </div>
        </section>

        <section className="preferences-card">
          <div className="preferences-heading">
            <div>
              <p className="section-eyebrow">YOUR EXPERIENCE</p>
              <h2>Preferences</h2>
            </div>
          </div>

          <div className="preference">
            <div>
              <h3>Dark Mode</h3>
              <p>Use a darker appearance throughout Saathi.</p>
            </div>
            <button
              type="button"
              className={`switch ${darkMode ? "switch-on" : ""}`}
              role="switch"
              aria-checked={darkMode}
              aria-label="Toggle dark mode"
              onClick={() => setDarkMode((current) => !current)}
            >
              <span />
            </button>
          </div>

          <div className="preference">
            <div>
              <h3>Daily Reminders</h3>
              <p>Receive reminders about your daily goals.</p>
            </div>
            <span className="preference-status">Coming soon</span>
          </div>

          <div className="preference">
            <div>
              <h3>Partner Updates</h3>
              <p>Get notified when your partner completes a goal.</p>
            </div>
            <span className="preference-status">Coming soon</span>
          </div>
        </section>
      </main>
    </div>
  );
}

export default Profile;