
import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Goals.css";

const API_URL = "http://127.0.0.1:8000";

function GoalsPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newTask, setNewTask] = useState({});
  const [addingTask, setAddingTask] = useState(null);

  /* =========================================================
     AUTHENTICATION
     ========================================================= */

  const token = localStorage.getItem("access_token");

  /* =========================================================
     COMMON FETCH FUNCTION
     ========================================================= */

  const fetchWithAuth = async (url, options = {}) => {
    const response = await fetch(`${API_URL}${url}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      navigate("/login");
      throw new Error("Session expired. Please login again.");
    }

    return response;
  };

  /* =========================================================
     FETCH USER
     ========================================================= */

  const fetchUser = async () => {
    const response = await fetchWithAuth("/users/me");

    if (!response.ok) {
      throw new Error("Unable to load user information.");
    }

    const data = await response.json();
    setUser(data);
  };

  /* =========================================================
     FETCH GOALS
     ========================================================= */

  const fetchGoals = async () => {
    const response = await fetchWithAuth("/goals/");

    if (!response.ok) {
      throw new Error("Unable to load goals.");
    }

    const data = await response.json();

    const goalList = Array.isArray(data) ? data : [];

    setGoals(goalList);

    return goalList;
  };

  /* =========================================================
     FETCH TASKS FOR ALL GOALS
     ========================================================= */

  const fetchAllTasks = async (goalList) => {
    const taskData = {};

    await Promise.all(
      goalList.map(async (goal) => {
        try {
          const response = await fetchWithAuth(`/tasks/${goal.id}`);

          if (response.ok) {
            const data = await response.json();
            taskData[goal.id] = Array.isArray(data) ? data : [];
          } else {
            taskData[goal.id] = [];
          }
        } catch (error) {
          taskData[goal.id] = [];
        }
      })
    );

    setTasks(taskData);
  };

  /* =========================================================
     INITIAL LOAD
     ========================================================= */

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      if (!token) {
        navigate("/login");
        return;
      }

      await fetchUser();

      const goalList = await fetchGoals();

      await fetchAllTasks(goalList);
    } catch (error) {
      console.error("Goals page error:", error);
      setError(error.message || "Something went wrong while loading goals.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* =========================================================
     REFRESH TASKS FOR ONE GOAL
     ========================================================= */

  const refreshGoalTasks = async (goalId) => {
    try {
      const response = await fetchWithAuth(`/tasks/${goalId}`);

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      setTasks((previous) => ({
        ...previous,
        [goalId]: Array.isArray(data) ? data : [],
      }));
    } catch (error) {
      console.error("Unable to refresh tasks:", error);
    }
  };

  /* =========================================================
     TASK PROGRESS
     ========================================================= */

  const getGoalTasks = (goalId) => {
    return tasks[goalId] || [];
  };

  const getCompletedTasks = (goalId) => {
    return getGoalTasks(goalId).filter((task) => task.completed);
  };

  const getTaskProgress = (goal) => {
    const goalTasks = getGoalTasks(goal.id);

    if (goalTasks.length === 0) {
      return Number(goal.progress || 0);
    }

    const completed = goalTasks.filter((task) => task.completed).length;

    return Math.round((completed / goalTasks.length) * 100);
  };

  const getProgressText = (goal) => {
    const goalTasks = getGoalTasks(goal.id);

    if (goalTasks.length === 0) {
      return `${Number(goal.progress || 0)}% progress`;
    }

    const completed = goalTasks.filter((task) => task.completed).length;

    return `${completed}/${goalTasks.length} completed`;
  };

  /* =========================================================
     ADD TASK
     ========================================================= */

  const handleAddTask = async (goalId) => {
    const title = (newTask[goalId] || "").trim();

    if (!title) {
      return;
    }

    try {
      setAddingTask(goalId);

      const response = await fetchWithAuth(
        `/tasks/${goalId}?title=${encodeURIComponent(title)}`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Unable to create task."
        );
      }

      setNewTask((previous) => ({
        ...previous,
        [goalId]: "",
      }));

      await refreshGoalTasks(goalId);
    } catch (error) {
      console.error("Add task error:", error);
      setError(error.message);
    } finally {
      setAddingTask(null);
    }
  };

  /* =========================================================
     TASK COMPLETION
     ========================================================= */

  const handleToggleTask = async (task) => {
    try {
      const newCompletedState = !task.completed;

      const response = await fetchWithAuth(
        `/tasks/${task.id}?completed=${newCompletedState}`,
        {
          method: "PUT",
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Unable to update task."
        );
      }

      await refreshGoalTasks(task.goal_id);
    } catch (error) {
      console.error("Task update error:", error);
      setError(error.message);
    }
  };

  /* =========================================================
     DELETE TASK
     ========================================================= */

  const handleDeleteTask = async (task) => {
    const confirmed = window.confirm(
      `Delete task "${task.title}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/tasks/${task.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Unable to delete task."
        );
      }

      await refreshGoalTasks(task.goal_id);
    } catch (error) {
      console.error("Delete task error:", error);
      setError(error.message);
    }
  };

  /* =========================================================
     DELETE GOAL
     ========================================================= */

  const handleDeleteGoal = async (goal) => {
    const confirmed = window.confirm(
      `Delete goal "${goal.title}"? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetchWithAuth(`/goals/${goal.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);

        throw new Error(
          data?.detail || "Unable to delete goal."
        );
      }

      setGoals((previous) =>
        previous.filter((item) => item.id !== goal.id)
      );

      setTasks((previous) => {
        const updated = { ...previous };
        delete updated[goal.id];
        return updated;
      });
    } catch (error) {
      console.error("Delete goal error:", error);
      setError(error.message);
    }
  };

  /* =========================================================
     LOGOUT
     ========================================================= */

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  /* =========================================================
     DATE
     ========================================================= */

  const currentDate = new Date();

  const formattedDate = currentDate.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  /* =========================================================
     SUMMARY DATA
     ========================================================= */

  const summary = useMemo(() => {
    const totalGoals = goals.length;

    let completedGoals = 0;
    let inProgressGoals = 0;
    let totalProgress = 0;

    goals.forEach((goal) => {
      const progress = getTaskProgress(goal);

      totalProgress += progress;

      if (progress >= 100) {
        completedGoals += 1;
      } else if (progress > 0) {
        inProgressGoals += 1;
      }
    });

    const focusScore =
      totalGoals > 0
        ? Math.round(totalProgress / totalGoals)
        : 0;

    return {
      totalGoals,
      completedGoals,
      inProgressGoals,
      focusScore,
    };
  }, [goals, tasks]);

  /* =========================================================
     LOADING
     ========================================================= */

  if (loading) {
    return (
      <div className="dashboard-page goals-page">
        <aside className="dashboard-sidebar">
          <Link to="/" className="dashboard-logo">
            <span className="dashboard-logo-icon">◉</span>
            Saathi
          </Link>
        </aside>

        <main className="dashboard-main goals-main">
          <div
            style={{
              minHeight: "70vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#7e716d",
              fontSize: "16px",
            }}
          >
            Loading your goals...
          </div>
        </main>
      </div>
    );
  }

  /* =========================================================
     MAIN PAGE
     ========================================================= */

  return (
    <div className="dashboard-page goals-page">

      {/* =====================================================
          SIDEBAR
          ===================================================== */}

      <aside className="dashboard-sidebar">

        <Link to="/" className="dashboard-logo">
          <span className="dashboard-logo-icon">◉</span>
          Saathi
        </Link>

        <nav className="sidebar-nav">

          <Link
            to="/dashboard"
            className="sidebar-link"
          >
            <span>⌂</span>
            Dashboard
          </Link>

          <Link
            to="/goals"
            className="sidebar-link active"
          >
            <span>🎯</span>
            My Goals
          </Link>

          <Link
            to="/partners"
            className="sidebar-link"
          >
            <span>🤝</span>
            My Partner
          </Link>

          <Link
            to="/profile"
            className="sidebar-link"
          >
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

          <button
            type="button"
            className="logout-link"
            onClick={handleLogout}
            style={{
              background: "none",
              border: "none",
              width: "100%",
              cursor: "pointer",
              textAlign: "left",
            }}
          >
            <span>↪</span>
            Logout
          </button>

        </div>

      </aside>

      {/* =====================================================
          MAIN
          ===================================================== */}

      <main className="dashboard-main goals-main">

        {/* ===================================================
            HEADER
            =================================================== */}

        <header className="dashboard-header">

          <div>

            <p className="dashboard-date">
              {formattedDate}
            </p>

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

            <Link
              to="/profile"
              className="profile-avatar"
              style={{
                textDecoration: "none",
              }}
            >
              {user?.name
                ? user.name.charAt(0).toUpperCase()
                : "U"}
            </Link>

          </div>

        </header>

        {/* ===================================================
            ERROR
            =================================================== */}

        {error && (
          <div
            style={{
              background: "#fce8e4",
              color: "#b94f40",
              padding: "12px 16px",
              borderRadius: "9px",
              marginBottom: "20px",
              fontSize: "13px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <span>{error}</span>

            <button
              type="button"
              onClick={() => setError("")}
              style={{
                border: "none",
                background: "transparent",
                color: "#b94f40",
                cursor: "pointer",
                fontSize: "18px",
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* ===================================================
            SUMMARY
            =================================================== */}

        <section className="goals-summary">

          <div className="goal-summary-card orange-card">

            <span>Total Goals</span>

            <strong>
              {summary.totalGoals}
            </strong>

            <small>
              {summary.inProgressGoals} in progress
            </small>

          </div>

          <div className="goal-summary-card green-card">

            <span>Completed</span>

            <strong>
              {summary.completedGoals}
            </strong>

            <small>
              {summary.completedGoals > 0
                ? "Nice momentum"
                : "Keep going"}
            </small>

          </div>

          <div className="goal-summary-card purple-card">

            <span>Focus Score</span>

            <strong>
              {summary.focusScore}%
            </strong>

            <small>
              Based on your goal progress
            </small>

          </div>

        </section>

        {/* ===================================================
            GOALS LAYOUT
            =================================================== */}

        <div className="goals-layout">

          {/* =================================================
              GOAL BOARD
              ================================================= */}

          <section className="goals-board">

            <div className="section-header">

              <div>

                <span>
                  YOUR PROGRESS
                </span>

                <h2>
                  Goal Board
                </h2>

              </div>

              <Link to="/dashboard">
                Back to dashboard
              </Link>

            </div>

            {/* =================================================
                EMPTY STATE
                ================================================= */}

            {goals.length === 0 ? (

              <div
                style={{
                  background: "#fffefd",
                  border: "1px solid #ece5e1",
                  borderRadius: "14px",
                  padding: "45px 25px",
                  textAlign: "center",
                }}
              >

                <div
                  style={{
                    fontSize: "42px",
                    marginBottom: "15px",
                  }}
                >
                  🎯
                </div>

                <h3
                  style={{
                    margin: "0 0 8px",
                    color: "#3b2d28",
                  }}
                >
                  No goals yet
                </h3>

                <p
                  style={{
                    margin: "0 0 20px",
                    color: "#8b7d78",
                    fontSize: "13px",
                  }}
                >
                  Create your first goal and start making progress.
                </p>

                <button
                  type="button"
                  className="add-goal-btn"
                  onClick={() => navigate("/create-goal")}
                  style={{
                    padding: "0 25px",
                  }}
                >
                  + Create New Goal
                </button>

              </div>

            ) : (

              <div className="goal-list goals-list">

                {goals.map((goal, index) => {

                  const goalTasks = getGoalTasks(goal.id);
                  const completedTasks = getCompletedTasks(goal.id);

                  const progress = getTaskProgress(goal);

                  const accentClasses = [
                    "orange",
                    "green",
                    "purple",
                  ];

                  const accent =
                    accentClasses[index % accentClasses.length];

                  return (

                    <article
                      className={`dashboard-goal-card goal-detail-card ${accent}`}
                      key={goal.id}
                    >

                      {/* GOAL ICON */}

                      <div className="goal-icon">
                        {goal.category === "Learning"
                          ? "💻"
                          : goal.category === "Build"
                          ? "🚀"
                          : goal.category === "Health"
                          ? "🏃"
                          : goal.category === "Personal Growth"
                          ? "📚"
                          : "🎯"}
                      </div>

                      {/* GOAL INFORMATION */}

                      <div className="goal-information">

                        {/* TITLE */}

                        <div className="goal-title-row">

                          <div>

                            <h3>
                              {goal.title}
                            </h3>

                            <p>
                              {goal.category || "General"}
                            </p>

                          </div>

                          <span
                            className={`priority-badge ${
                              progress >= 100
                                ? "low"
                                : progress >= 50
                                ? "medium"
                                : "high"
                            }`}
                          >
                            {progress >= 100
                              ? "Completed"
                              : progress >= 50
                              ? "In Progress"
                              : "Started"}
                          </span>

                        </div>

                        {/* DESCRIPTION */}

                        {goal.description && (
                          <p className="goal-description">
                            {goal.description}
                          </p>
                        )}

                        {/* PROGRESS */}

                        <div className="dashboard-progress-bar">

                          <div
                            className="dashboard-progress"
                            style={{
                              width: `${Math.min(
                                Math.max(progress, 0),
                                100
                              )}%`,
                            }}
                          />

                        </div>

                        {/* META */}

                        <div className="goal-meta">

                          <span>
                            {getProgressText(goal)}
                          </span>

                          <span>
                            {goal.deadline
                              ? `Due ${goal.deadline}`
                              : "No deadline"}
                          </span>

                        </div>

                        {/* ACTIONS */}

                        <div className="goal-actions">

                          <button
                            type="button"
                            className="goal-action-btn"
                            onClick={() => navigate(`/edit-goal/${goal.id}`)}
                          >
                            Update
                          </button>

                          <button
                            type="button"
                            className="goal-action-btn secondary"
                            onClick={() =>
                              handleDeleteGoal(goal)
                            }
                          >
                            Delete
                          </button>

                        </div>

                        {/* =================================================
                            TASKS
                            ================================================= */}

                        <div
                          style={{
                            marginTop: "18px",
                            paddingTop: "15px",
                            borderTop: "1px solid #eee7e3",
                          }}
                        >

                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              marginBottom: "10px",
                            }}
                          >

                            <span
                              style={{
                                color: "#756963",
                                fontSize: "11px",
                                fontWeight: "700",
                              }}
                            >
                              TASKS
                            </span>

                            <span
                              style={{
                                color: "#a09691",
                                fontSize: "10px",
                              }}
                            >
                              {completedTasks.length}/
                              {goalTasks.length}
                            </span>

                          </div>

                          {/* TASK LIST */}

                          {goalTasks.length > 0 && (

                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "7px",
                                marginBottom: "10px",
                              }}
                            >

                              {goalTasks.map((task) => (

                                <div
                                  key={task.id}
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "9px",
                                    padding: "7px 9px",
                                    background: task.completed
                                      ? "#f1f4f1"
                                      : "#faf7f5",
                                    borderRadius: "7px",
                                  }}
                                >

                                  <input
                                    type="checkbox"
                                    checked={Boolean(
                                      task.completed
                                    )}
                                    onChange={() =>
                                      handleToggleTask(task)
                                    }
                                    style={{
                                      cursor: "pointer",
                                    }}
                                  />

                                  <span
                                    style={{
                                      flex: 1,
                                      color: task.completed
                                        ? "#99918d"
                                        : "#635752",
                                      fontSize: "11px",
                                      textDecoration:
                                        task.completed
                                          ? "line-through"
                                          : "none",
                                    }}
                                  >
                                    {task.title}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteTask(task)
                                    }
                                    style={{
                                      border: "none",
                                      background: "transparent",
                                      color: "#b56b60",
                                      cursor: "pointer",
                                      fontSize: "13px",
                                    }}
                                    title="Delete task"
                                  >
                                    ×
                                  </button>

                                </div>

                              ))}

                            </div>

                          )}

                          {/* ADD TASK */}

                          <div
                            style={{
                              display: "flex",
                              gap: "7px",
                            }}
                          >

                            <input
                              type="text"
                              value={newTask[goal.id] || ""}
                              onChange={(event) =>
                                setNewTask((previous) => ({
                                  ...previous,
                                  [goal.id]:
                                    event.target.value,
                                }))
                              }
                              onKeyDown={(event) => {
                                if (
                                  event.key === "Enter"
                                ) {
                                  handleAddTask(goal.id);
                                }
                              }}
                              placeholder="Add a task..."
                              style={{
                                flex: 1,
                                minWidth: 0,
                                border: "1px solid #e7dfdb",
                                borderRadius: "7px",
                                padding: "8px 10px",
                                outline: "none",
                                background: "#fff",
                                color: "#4a3b36",
                                fontFamily: "inherit",
                                fontSize: "11px",
                              }}
                            />

                            <button
                              type="button"
                              onClick={() =>
                                handleAddTask(goal.id)
                              }
                              disabled={
                                addingTask === goal.id
                              }
                              style={{
                                border: "none",
                                borderRadius: "7px",
                                padding: "0 12px",
                                background: "#d96350",
                                color: "#ffffff",
                                cursor:
                                  addingTask === goal.id
                                    ? "not-allowed"
                                    : "pointer",
                                fontFamily: "inherit",
                                fontSize: "11px",
                                fontWeight: "600",
                                opacity:
                                  addingTask === goal.id
                                    ? 0.6
                                    : 1,
                              }}
                            >
                              {addingTask === goal.id
                                ? "..."
                                : "+ Add"}
                            </button>

                          </div>

                        </div>

                      </div>

                    </article>

                  );
                })}

              </div>

            )}

            {/* =================================================
                CREATE GOAL
                ================================================= */}

            {goals.length > 0 && (

              <button
                type="button"
                className="add-goal-btn full-width-btn"
                onClick={() => navigate("/create-goal")}
              >
                + Create New Goal
              </button>

            )}

          </section>

          {/* =================================================
              RIGHT SIDE
              ================================================= */}

          <aside className="goals-side-panel">

            {/* PRIORITY FOCUS */}

            <div className="panel-card focus-card">

              <div className="panel-header">

                <span>
                  THIS WEEK
                </span>

                <h3>
                  Priority Focus
                </h3>

              </div>

              <ul className="focus-list">

                {goals.length === 0 ? (

                  <li>
                    Create a goal to start your weekly focus.
                  </li>

                ) : (

                  goals
                    .filter(
                      (goal) =>
                        getTaskProgress(goal) < 100
                    )
                    .slice(0, 3)
                    .map((goal) => (

                      <li key={goal.id}>
                        {goal.title}
                      </li>

                    ))

                )}

              </ul>

            </div>

            {/* STREAK / CONSISTENCY */}

            <div className="panel-card streak-card">

              <div className="streak-icon">
                🔥
              </div>

              <div>

                <span>
                  CONSISTENCY
                </span>

                <h3>
                  {summary.focusScore}%
                </h3>

                <p>
                  Keep completing your tasks and building momentum.
                </p>

              </div>

            </div>

          </aside>

        </div>

      </main>

    </div>
  );
}

export default GoalsPage;
