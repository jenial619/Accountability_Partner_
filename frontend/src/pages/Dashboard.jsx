import { Link } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  // Temporary data
  // Later this will come from your FastAPI backend

  const goals = [
    {
      id: 1,
      title: "DSA Practice",
      description: "Solve coding problems",
      progress: 75,
      completed: "3/4",
      deadline: "Aug 28",
      icon: "💻",
    },
    {
      id: 2,
      title: "Project Work",
      description: "Work on Accountability Partner",
      progress: 60,
      completed: "3/5",
      deadline: "Sep 05",
      icon: "🚀",
    },
    {
      id: 3,
      title: "Read a Book",
      description: "Read 20 pages every day",
      progress: 40,
      completed: "8/20",
      deadline: "Sep 15",
      icon: "📚",
    },
  ];

  return (
    <div className="dashboard-page">

      {/* 
     SIDEBAR
       */}

      <aside className="dashboard-sidebar">

        <Link to="/" className="dashboard-logo">
          <span className="dashboard-logo-icon">◉</span>
          Saathi
        </Link>


        <nav className="sidebar-nav">

          <Link to="/dashboard" className="sidebar-link active">
            <span>⌂</span>
            Dashboard
          </Link>

          <Link to="/goals" className="sidebar-link">
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
            <p>
              Small progress is still progress.
            </p>
          </div>

          <Link to="/" className="logout-link">
            <span>↪</span>
            Logout
          </Link>

        </div>

      </aside>


      {/* 
      MAIN CONTENT
      */}

      <main className="dashboard-main">

        {/* Header */}

        <header className="dashboard-header">

          <div>
            <p className="dashboard-date">
              Friday, August 21, 2026
            </p>

            <h1>
              Good evening, Sarah! 👋
            </h1>

            <p className="dashboard-subtitle">
              Let's make today count.
            </p>
          </div>


          <div className="header-profile">

            <div className="notification">
              🔔
              <span></span>
            </div>

            <div className="profile-avatar">
              S
            </div>

          </div>

        </header>


        {/* 
        TOP STATS
        */}

        <section className="dashboard-stats">

          <div className="stat-card">

            <div className="stat-icon orange">
              🎯
            </div>

            <div>
              <p>Active Goals</p>
              <h2>3</h2>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon green">
              ✓
            </div>

            <div>
              <p>Completed Today</p>
              <h2>5</h2>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon purple">
              🔥
            </div>

            <div>
              <p>Current Streak</p>
              <h2>7 days</h2>
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-icon brown">
              📈
            </div>

            <div>
              <p>Overall Progress</p>
              <h2>68%</h2>
            </div>

          </div>

        </section>


        {/* 
        DASHBOARD GRID
         */}

        <div className="dashboard-grid">


          {/* 
          MY GOALS
           */}

          <section className="goals-section">

            <div className="section-header">

              <div>
                <span>YOUR PROGRESS</span>
                <h2>My Goals</h2>
              </div>

              <Link to="/goals">
                View all →
              </Link>

            </div>


            <div className="goal-list">

              {goals.map((goal) => (

                <div className="dashboard-goal-card" key={goal.id}>

                  <div className="goal-icon">
                    {goal.icon}
                  </div>


                  <div className="goal-information">

                    <div className="goal-title-row">

                      <div>
                        <h3>{goal.title}</h3>
                        <p>{goal.description}</p>
                      </div>

                      <strong>
                        {goal.progress}%
                      </strong>

                    </div>


                    <div className="dashboard-progress-bar">
                      <div
                        className="dashboard-progress"
                        style={{
                          width: `${goal.progress}%`,
                        }}
                      ></div>
                    </div>


                    <div className="goal-meta">

                      <span>
                        {goal.completed} completed
                      </span>

                      <span>
                        Due {goal.deadline}
                      </span>

                    </div>

                  </div>

                </div>

              ))}

            </div>


            <Link to="/goals" className="add-goal-btn">
              + Create New Goal
            </Link>

          </section>


          {/* =====================
              ACCOUNTABILITY PARTNER
          ===================== */}

          <section className="partner-section">

            <div className="section-header">

              <div>
                <span>ACCOUNTABILITY</span>
                <h2>My Partner</h2>
              </div>

              <Link to="/partners">
                View →
              </Link>

            </div>


            <div className="partner-card">

              <div className="partner-top">

                <div className="partner-avatar">
                  A
                </div>

                <div>
                  <h3>Alex Johnson</h3>
                  <p>Accountability Partner</p>
                </div>

                <div className="online-status">
                  <span></span>
                  Online
                </div>

              </div>


              <div className="partner-message">
                <span>💬</span>

                <p>
                  "Let's complete our goals today!"
                </p>
              </div>


              <div className="partner-progress">

                <div className="partner-progress-header">
                  <span>Alex's Progress</span>
                  <strong>82%</strong>
                </div>

                <div className="dashboard-progress-bar">
                  <div
                    className="dashboard-progress partner-progress-fill"
                    style={{ width: "82%" }}
                  ></div>
                </div>

              </div>


              <Link
                to="/partners"
                className="partner-button"
              >
                View Partner Progress
              </Link>

            </div>


            {/* Motivation Card */}

            <div className="motivation-card">

              <div className="motivation-icon">
                ✨
              </div>

              <div>
                <span>KEEP GOING!</span>

                <p>
                  You're only 2 tasks away from
                  completing today's goals.
                </p>
              </div>

            </div>

          </section>

        </div>


        {/*
        TODAY'S TASKS
         */}

        <section className="today-section">

          <div className="section-header">

            <div>
              <span>TODAY</span>
              <h2>Today's Tasks</h2>
            </div>

            <span className="task-count">
              3 tasks remaining
            </span>

          </div>


          <div className="tasks-container">

            <div className="task completed-task">

              <div className="task-checkbox">
                ✓
              </div>

              <div>
                <h3>Solve 2 DSA problems</h3>
                <p>DSA Practice</p>
              </div>

              <span className="task-completed">
                Completed
              </span>

            </div>


            <div className="task">

              <div className="task-checkbox empty">
              </div>

              <div>
                <h3>Work on React frontend</h3>
                <p>Project Work</p>
              </div>

              <span className="task-pending">
                Pending
              </span>

            </div>


            <div className="task">

              <div className="task-checkbox empty">
              </div>

              <div>
                <h3>Read 20 pages</h3>
                <p>Read a Book</p>
              </div>

              <span className="task-pending">
                Pending
              </span>

            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;