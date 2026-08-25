import { Link } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const goals = [
    {
      id: 1,
      title: "DSA Practice",
      description: "Solve coding problems",
      progress: 75,
      completed: "3/4",
      deadline: "Aug 28",
      icon: "💻",
      iconClass: "purple",
    },
    {
      id: 2,
      title: "Project Work",
      description: "Work on Accountability Partner",
      progress: 60,
      completed: "6/10",
      deadline: "Sep 10",
      icon: "📁",
      iconClass: "orange",
    },
    {
      id: 3,
      title: "Read a Book",
      description: "Read 20 pages every day",
      progress: 40,
      completed: "8/20",
      deadline: "Sep 15",
      icon: "📚",
      iconClass: "green",
    },
  ];

  return (
    <div className="dashboard-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">

        {/* Logo */}
       {/* <Link to="/" className="logo">
        <span className="logo-icon">◉</span>
        Saa<span>thi</span>
          </Link>*/}
        <Link to="/" className="sidebar-logo">
          <span className="sidebar-logo-icon">◉</span>
          <span>Saathi</span>
        </Link>

        {/* Navigation */}
        <nav className="sidebar-nav">

          <Link to="/dashboard" className="active">
            <span className="sidebar-nav-icon">⌂</span>
            Dashboard
          </Link>

          <Link to="/goals">
            <span className="sidebar-nav-icon">🎯</span>
            My Goals
          </Link>

          <Link to="/partners">
            <span className="sidebar-nav-icon">👥</span>
            My Partner
          </Link>

          <Link to="/profile">
            <span className="sidebar-nav-icon">👤</span>
            Profile
          </Link>

        </nav>

        {/* Bottom Sidebar */}
        <div className="sidebar-message">
          <span className="star">⭐</span>
          <p>Small progress is still progress.</p>
        </div>

        <Link to="/" className="sidebar-logout">
          <span>↪</span>
          Logout
        </Link>

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="dashboard-main">

        {/* =================================================
            HEADER
        ================================================= */}

        <header className="dashboard-header">

          <div>
            <div className="dashboard-date">
              Friday, August 21, 2026
            </div>

            <h1>
              Good evening, Sarah! 👋
            </h1>

            <p className="dashboard-subtitle">
              Let's make today count.
            </p>
          </div>

          <div className="dashboard-header-actions">

            <button className="notification-btn">
              🔔
            </button>

            <div className="profile-circle">
              S
            </div>

          </div>

        </header>


        {/* =================================================
            TOP STAT CARDS
        ================================================= */}

        <section className="stats-grid">

          {/* Active Goals */}
          <div className="stat-card">

            <div className="stat-icon goal">
              🎯
            </div>

            <div>
              <div className="stat-label">
                Active Goals
              </div>

              <div className="stat-value">
                3
              </div>
            </div>

          </div>


          {/* Completed Today */}
          <div className="stat-card">

            <div className="stat-icon completed">
              ✓
            </div>

            <div>
              <div className="stat-label">
                Completed
                <br />
                Today
              </div>

              <div className="stat-value green">
                5
              </div>
            </div>

          </div>


          {/* Current Streak */}
          <div className="stat-card">

            <div className="stat-icon streak">
              🔥
            </div>

            <div>
              <div className="stat-label">
                Current Streak
              </div>

              <div className="stat-value orange">
                7 days
              </div>
            </div>

          </div>


          {/* Overall Progress */}
          <div className="stat-card">

            <div className="stat-icon progress">
              📈
            </div>

            <div>
              <div className="stat-label">
                Overall Progress
              </div>

              <div className="stat-value purple">
                68%
              </div>
            </div>

          </div>


          {/* Focus Time */}
          <div className="stat-card">

            <div className="stat-icon focus">
              🕒
            </div>

            <div>
              <div className="stat-label">
                Focus Time
                <br />
                Today
              </div>

              <div className="stat-value blue">
                2.5 hrs
              </div>
            </div>

          </div>

        </section>


        {/* =================================================
            UPPER DASHBOARD
            MY GOALS | MY PARTNER
                     | WEEKLY OVERVIEW
        ================================================= */}

        <div className="dashboard-upper">

          {/* =================================================
              MY GOALS
          ================================================= */}

          <section className="dashboard-card goals-card">

            <div className="card-header">

              <div className="card-title">
                My Goals
              </div>

              <Link
                to="/goals"
                className="card-view"
              >
                View all →
              </Link>

            </div>


            {/* Goal 1 */}
            <div className="goal-item">

              <div className="goal-top">

                <div className="goal-icon purple">
                  💻
                </div>

                <div className="goal-info">

                  <div className="goal-name">
                    DSA Practice
                  </div>

                  <div className="goal-description">
                    Solve coding problems
                  </div>

                </div>

                <div className="goal-percentage">
                  75%
                </div>

              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: "75%" }}
                ></div>
              </div>

              <div className="progress-info">
                <span>3/4 completed</span>
                <span>Due Aug 28</span>
              </div>

            </div>


            {/* Goal 2 */}
            <div className="goal-item">

              <div className="goal-top">

                <div className="goal-icon orange">
                  📁
                </div>

                <div className="goal-info">

                  <div className="goal-name">
                    Project Work
                  </div>

                  <div className="goal-description">
                    Work on Accountability Partner
                  </div>

                </div>

                <div className="goal-percentage">
                  60%
                </div>

              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: "60%" }}
                ></div>
              </div>

              <div className="progress-info">
                <span>6/10 completed</span>
                <span>Due Sep 10</span>
              </div>

            </div>


            {/* Goal 3 */}
            <div className="goal-item">

              <div className="goal-top">

                <div className="goal-icon green">
                  📚
                </div>

                <div className="goal-info">

                  <div className="goal-name">
                    Read a Book
                  </div>

                  <div className="goal-description">
                    Read 20 pages every day
                  </div>

                </div>

                <div className="goal-percentage">
                  40%
                </div>

              </div>

              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: "40%" }}
                ></div>
              </div>

              <div className="progress-info">
                <span>8/20 completed</span>
                <span>Due Sep 15</span>
              </div>

            </div>


            <Link
              to="/goals"
              className="create-goal-btn"
            >
              + Create New Goal
            </Link>

          </section>


          {/* =================================================
              PARTNER COLUMN
          ================================================= */}

          <div className="partner-column">

            {/* =================================================
                MY PARTNER
            ================================================= */}

            <section className="dashboard-card partner-card">

              <div className="card-header">

                <div className="card-title">
                  My Partner
                </div>

                <Link
                  to="/partners"
                  className="card-view"
                >
                  View all →
                </Link>

              </div>


              <div className="partner-content">

                {/* Partner Profile */}

                <div className="partner-profile">

                  <div className="partner-avatar">
                    A
                  </div>

                  <div className="partner-info">

                    <div className="partner-name">
                      Alex Johnson
                    </div>

                    <div className="partner-role">
                      Accountability Partner
                    </div>

                  </div>

                  <div className="partner-online">

                    <span className="online-dot"></span>

                    Online

                  </div>

                </div>


                {/* Message */}

                <div className="partner-message">

                  💬 &nbsp;
                  "Let's complete our goals today!" 💪

                </div>


                {/* Partner Progress */}

                <div className="partner-progress">

                  <div className="partner-progress-header">

                    <span>
                      Alex's Progress
                    </span>

                    <strong>
                      82%
                    </strong>

                  </div>

                  <div className="progress-bar">

                    <div
                      className="progress-fill green"
                      style={{ width: "82%" }}
                    ></div>

                  </div>

                </div>

              </div>

            </section>


            {/* =================================================
                WEEKLY OVERVIEW
            ================================================= */}

            <section className="dashboard-card weekly-card">

              <div className="card-header">

                <div className="card-title">
                  📅 &nbsp; Weekly Overview
                </div>

              </div>


              <div className="weekly-content">

                <div className="week-days">

                  {/* Monday */}
                  <div>
                    <div className="week-day">
                      Mon
                    </div>

                    <div className="week-status done">
                      ✓
                    </div>
                  </div>


                  {/* Tuesday */}
                  <div>
                    <div className="week-day">
                      Tue
                    </div>

                    <div className="week-status done">
                      ✓
                    </div>
                  </div>


                  {/* Wednesday */}
                  <div>
                    <div className="week-day">
                      Wed
                    </div>

                    <div className="week-status done">
                      ✓
                    </div>
                  </div>


                  {/* Thursday */}
                  <div>
                    <div className="week-day">
                      Thu
                    </div>

                    <div className="week-status today">
                    </div>

                    <div className="today-label">
                      Today
                    </div>
                  </div>


                  {/* Friday */}
                  <div>
                    <div className="week-day">
                      Fri
                    </div>

                    <div className="week-status today">
                    </div>
                  </div>


                  {/* Saturday */}
                  <div>
                    <div className="week-day">
                      Sat
                    </div>

                    <div className="week-status empty">
                    </div>
                  </div>


                  {/* Sunday */}
                  <div>
                    <div className="week-day">
                      Sun
                    </div>

                    <div className="week-status empty">
                    </div>
                  </div>

                </div>

              </div>

            </section>

          </div>

        </div>


        {/* =================================================
            LOWER SECTION
            TODAY'S TASKS | CURRENT STREAK
        ================================================= */}

        <div className="dashboard-lower">

          {/* =================================================
              TODAY'S TASKS
          ================================================= */}

          <section className="dashboard-card tasks-card">

            <div className="card-header">

              <div className="card-title">
                ☷ &nbsp; Today's Tasks
              </div>

              <span className="card-view">
                3 tasks remaining
              </span>

            </div>


            {/* Task 1 */}

            <div className="task-row">

              <div className="task-check completed">
                ✓
              </div>

              <div className="task-info">

                <div className="task-name">
                  Solve 2 DSA problems
                </div>

                <div className="task-category">
                  DSA Practice
                </div>

              </div>

              <span className="task-status completed">
                Completed
              </span>

            </div>


            {/* Task 2 */}

            <div className="task-row">

              <div className="task-check">
              </div>

              <div className="task-info">

                <div className="task-name">
                  Work on React frontend
                </div>

                <div className="task-category">
                  Project Work
                </div>

              </div>

              <span className="task-status pending">
                Pending
              </span>

            </div>


            {/* Task 3 */}

            <div className="task-row">

              <div className="task-check">
              </div>

              <div className="task-info">

                <div className="task-name">
                  Read 20 pages
                </div>

                <div className="task-category">
                  Read a Book
                </div>

              </div>

              <span className="task-status pending">
                Pending
              </span>

            </div>

          </section>


          {/* =================================================
              CURRENT STREAK
          ================================================= */}

          <section className="dashboard-card streak-card">

            <div className="card-header">

              <div className="card-title">
                🔥 &nbsp; Current Streak
              </div>

            </div>


            <div className="streak-content">

              <div>

                <div className="streak-title">
                  Keep going! 🔥
                </div>

                <div className="streak-description">
                  You're only 2 tasks away from
                  completing today's goals.
                </div>

              </div>


              <div className="streak-ring">

                <div className="streak-number">
                  7
                  <span>days</span>
                </div>

              </div>

            </div>

          </section>

        </div>


        {/* =================================================
            MOTIVATIONAL BANNER
        ================================================= */}

        <div className="motivation-banner">

          <span className="motivation-icon">
            ☀️
          </span>

          <span className="motivation-text">
            Consistency is the key to success.
            Keep showing up for yourself every day!
          </span>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;