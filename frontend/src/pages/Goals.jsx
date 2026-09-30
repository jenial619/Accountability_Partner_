import { Link } from "react-router-dom";
import "./Dashboard.css";

const goals = [
  {
    id: 1,
    title: "DSA Practice",
    category: "Learning",
    description: "Solve 2 coding problems each day.",
    progress: 75,
    completed: "3/4",
    due: "Aug 28",
    priority: "High",
    icon: "💻",
    accent: "orange",
  },
  {
    id: 2,
    title: "Project Work",
    category: "Build",
    description: "Finish the accountability partner app flow.",
    progress: 60,
    completed: "3/5",
    due: "Sep 05",
    priority: "Medium",
    icon: "🚀",
    accent: "green",
  },
  {
    id: 3,
    title: "Read a Book",
    category: "Personal Growth",
    description: "Read 20 pages before bed every night.",
    progress: 40,
    completed: "8/20",
    due: "Sep 15",
    priority: "Low",
    icon: "📚",
    accent: "purple",
  },
];

const weeklyGoals = [
  "Finish the onboarding flow",
  "Complete one deep-dive DSA session",
  "Read 20 pages before sleep",
];

function GoalsPage() {
  return (
    <div className="dashboard-page goals-page">
      <aside className="dashboard-sidebar">
        <Link to="/" className="dashboard-logo">
          <span className="dashboard-logo-icon">◉</span>
          Saathi
        </Link>

        <nav className="sidebar-nav">
          <Link to="/dashboard" className="sidebar-link">
            <span>⌂</span>
            Dashboard
          </Link>

          <Link to="/goals" className="sidebar-link active">
            <span>🎯</span>
            My Goals
          </Link>

          <Link to="/partners" className="sidebar-link">
            <span>🤝</span>
            My Partner
          </Link>

          <Link to="/profile" className="sidebar-link">
            <span>👤</span>
            Profile
          </Link>
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span>✨</span>
            <p>Small progress is still progress.</p>
          </div>

          <Link to="/" className="logout-link">
            <span>↪</span>
            Logout
          </Link>
        </div>
      </aside>

      <main className="dashboard-main goals-main">
        <header className="dashboard-header">
          <div>
            <p className="dashboard-date">Monday, August 24, 2026</p>
            <h1>My Goals</h1>
            <p className="dashboard-subtitle">
              Stay focused and keep moving toward your biggest priorities.
            </p>
          </div>

          <div className="header-profile">
            <div className="notification">
              🔔
              <span></span>
            </div>

            <div className="profile-avatar">S</div>
          </div>
        </header>

        <div className="goals-layout">
          <section className="goals-board goals-board-top">
            <div className="section-header goals-board-header">
              <div>
                <span>YOUR GOALS</span>
                <h2>Current Focus</h2>
              </div>

              <Link to="/dashboard">Back to dashboard</Link>
            </div>

            <div className="goal-list goals-list">
              {goals.map((goal) => (
                <article className={`dashboard-goal-card goal-detail-card ${goal.accent}`} key={goal.id}>
                  <div className="goal-icon">{goal.icon}</div>

                  <div className="goal-information">
                    <div className="goal-title-row">
                      <div>
                        <h3>{goal.title}</h3>
                        <p>{goal.category}</p>
                      </div>

                      <span className={`priority-badge ${goal.priority.toLowerCase()}`}>
                        {goal.priority}
                      </span>
                    </div>

                    <p className="goal-description">{goal.description}</p>

                    <div className="dashboard-progress-bar">
                      <div
                        className="dashboard-progress"
                        style={{ width: `${goal.progress}%` }}
                      ></div>
                    </div>

                    <div className="goal-meta">
                      <span>{goal.completed} completed</span>
                      <span>Due {goal.due}</span>
                    </div>

                    <div className="goal-actions">
                      <button type="button" className="goal-action-btn">
                        Update
                      </button>
                      <button type="button" className="goal-action-btn secondary">
                        Mark done
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            <button type="button" className="add-goal-btn full-width-btn">
              + Create New Goal
            </button>
          </section>

          <aside className="goals-side-panel">
            <div className="goals-summary">
              <div className="goal-summary-card orange-card">
                <span>Total Goals</span>
                <strong>3</strong>
                <small>2 in progress</small>
              </div>

              <div className="goal-summary-card green-card">
                <span>Completed</span>
                <strong>1</strong>
                <small>Nice momentum</small>
              </div>

              <div className="goal-summary-card purple-card">
                <span>Focus Score</span>
                <strong>82%</strong>
                <small>Above average</small>
              </div>
            </div>

            <div className="panel-card focus-card">
              <div className="panel-header">
                <span>THIS WEEK</span>
                <h3>Priority Focus</h3>
              </div>

              <ul className="focus-list">
                {weeklyGoals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="panel-card streak-card">
              <div className="streak-icon">🔥</div>
              <div>
                <span>CONSISTENCY</span>
                <h3>7-day streak</h3>
                <p>You are building momentum. Keep it going.</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default GoalsPage;
