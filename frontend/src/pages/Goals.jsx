import { Link } from "react-router-dom";
import "./Goals.css";

function Goals() {
  const goals = [
    {
      title: "DSA Practice",
      description: "Solve coding problems regularly",
      category: "Study",
      progress: 75,
      deadline: "Aug 28, 2026",
      tasks: "3 / 4 tasks",
      icon: "💻",
    },
    {
      title: "Project Work",
      description: "Complete Accountability Partner project",
      category: "Project",
      progress: 60,
      deadline: "Sep 05, 2026",
      tasks: "3 / 5 tasks",
      icon: "🚀",
    },
    {
      title: "Read a Book",
      description: "Read 20 pages every day",
      category: "Personal",
      progress: 40,
      deadline: "Sep 15, 2026",
      tasks: "8 / 20 tasks",
      icon: "📚",
    },
  ];

  return (
    <div className="goals-page">

      <aside className="goals-sidebar">

        <Link to="/" className="goals-logo">
          <span>◉</span>
          Saathi
        </Link>

        <nav className="goals-nav">

          <Link to="/dashboard">
            <span>⌂</span>
            Dashboard
          </Link>

          <Link to="/goals" className="active">
            <span>🎯</span>
            My Goals
          </Link>

          <Link to="/partners">
            <span>🤝</span>
            My Partner
          </Link>

          <Link to="/profile">
            <span>👤</span>
            Profile
          </Link>

        </nav>

        <Link to="/" className="goals-logout">
          ↪ Logout
        </Link>

      </aside>


      <main className="goals-main">

        <header className="goals-header">

          <div>
            <p>YOUR JOURNEY</p>
            <h1>My Goals</h1>
            <span>
              Stay focused, stay consistent and keep moving forward.
            </span>
          </div>

          <Link to="/create-goal" className="create-goal-button">
            + Create Goal
          </Link>

        </header>


        <div className="goal-summary">

          <div>
            <strong>3</strong>
            <span>Active Goals</span>
          </div>

          <div>
            <strong>11</strong>
            <span>Completed Tasks</span>
          </div>

          <div>
            <strong>68%</strong>
            <span>Overall Progress</span>
          </div>

          <div>
            <strong>7 🔥</strong>
            <span>Day Streak</span>
          </div>

        </div>


        <section className="goals-list">

          {goals.map((goal) => (

            <div className="goal-card" key={goal.title}>

              <div className="goal-icon">
                {goal.icon}
              </div>

              <div className="goal-content">

                <div className="goal-card-top">

                  <div>
                    <span className="goal-category">
                      {goal.category}
                    </span>

                    <h2>{goal.title}</h2>

                    <p>{goal.description}</p>
                  </div>

                  <strong className="goal-percentage">
                    {goal.progress}%
                  </strong>

                </div>


                <div className="goal-bar">
                  <div
                    style={{ width: `${goal.progress}%` }}
                  ></div>
                </div>


                <div className="goal-details">

                  <span>✓ {goal.tasks}</span>

                  <span>📅 Due {goal.deadline}</span>

                </div>

              </div>

            </div>

          ))}

        </section>

      </main>

    </div>
  );
}

export default Goals;