
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Goals.css";

const API_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_URL;;

async function apiRequest(path, token, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  if (response.status === 204) return null;

  const type = response.headers.get("content-type") || "";
  const data = type.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message =
      data && typeof data === "object"
        ? data.detail || data.message
        : data;

    throw new Error(message || `Request failed (${response.status})`);
  }

  return data;
}

function categoryIcon(category = "") {
  const value = category.toLowerCase();

  if (/health|fitness|yoga/.test(value)) return "💪";
  if (/learn|study|career|dsa|coding/.test(value)) return "💻";
  if (/finance|money/.test(value)) return "💰";
  if (/personal/.test(value)) return "🌱";

  return "🎯";
}

function progressFor(goal, tasks = []) {
  if (tasks.length) {
    return Math.round(
      (tasks.filter((task) => task.completed).length / tasks.length) * 100
    );
  }

  return Math.max(0, Math.min(100, Number(goal.progress) || 0));
}

export default function Goals() {
  const navigate = useNavigate();

  const [token] = useState(() => localStorage.getItem("access_token"));
  const [user, setUser] = useState(null);
  const [goals, setGoals] = useState([]);
  const [tasksByGoal, setTasksByGoal] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [taskDrafts, setTaskDrafts] = useState({});
  const [expandedGoalId, setExpandedGoalId] = useState(null);
  const [busyGoalId, setBusyGoalId] = useState(null);
  const [busyTaskId, setBusyTaskId] = useState(null);

  const loadGoals = useCallback(async () => {
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const [userData, goalData] = await Promise.all([
        apiRequest("/users/me", token),
        apiRequest("/goals/", token),
      ]);

      const list = Array.isArray(goalData)
        ? goalData
        : goalData?.goals || [];

      setUser(userData);
      setGoals(list);

      const entries = await Promise.all(
        list.map(async (goal) => {
          try {
            const result = await apiRequest(`/tasks/${goal.id}`, token);
            const tasks = Array.isArray(result)
              ? result
              : result?.tasks || [];

            return [goal.id, tasks];
          } catch {
            return [goal.id, []];
          }
        })
      );

      setTasksByGoal(Object.fromEntries(entries));
    } catch (err) {
      setError(err.message || "Could not load your goals.");
    } finally {
      setLoading(false);
    }
  }, [navigate, token]);

  useEffect(() => {
    loadGoals();
  }, [loadGoals]);

  const refreshTasks = async (goalId) => {
    const result = await apiRequest(`/tasks/${goalId}`, token);
    const tasks = Array.isArray(result)
      ? result
      : result?.tasks || [];

    setTasksByGoal((current) => ({
      ...current,
      [goalId]: tasks,
    }));
  };

  const toggleTask = async (task, goalId) => {
    if (!task) return;

    setBusyTaskId(task.id);
    setError("");

    try {
      await apiRequest(
        `/tasks/${task.id}?completed=${!task.completed}`,
        token,
        { method: "PUT" }
      );

      await refreshTasks(goalId);
    } catch (err) {
      setError(err.message || "Could not update task.");
    } finally {
      setBusyTaskId(null);
    }
  };

  const addTask = async (goalId) => {
    const title = (taskDrafts[goalId] || "").trim();

    if (!title) return;

    setBusyGoalId(goalId);
    setError("");

    try {
      await apiRequest(
        `/tasks/${goalId}?title=${encodeURIComponent(title)}`,
        token,
        { method: "POST" }
      );

      setTaskDrafts((current) => ({
        ...current,
        [goalId]: "",
      }));

      await refreshTasks(goalId);
      setExpandedGoalId(goalId);
    } catch (err) {
      setError(err.message || "Could not add task.");
    } finally {
      setBusyGoalId(null);
    }
  };

  const deleteTask = async (task, goalId) => {
    setBusyTaskId(task.id);
    setError("");

    try {
      await apiRequest(`/tasks/${task.id}`, token, {
        method: "DELETE",
      });

      await refreshTasks(goalId);
    } catch (err) {
      setError(err.message || "Could not delete task.");
    } finally {
      setBusyTaskId(null);
    }
  };

  const deleteGoal = async (goal) => {
    if (!window.confirm(`Delete "${goal.title}"?`)) return;

    setBusyGoalId(goal.id);
    setError("");

    try {
      await apiRequest(`/goals/${goal.id}`, token, {
        method: "DELETE",
      });

      setGoals((current) =>
        current.filter((item) => item.id !== goal.id)
      );

      setTasksByGoal((current) => {
        const next = { ...current };
        delete next[goal.id];
        return next;
      });

      if (expandedGoalId === goal.id) {
        setExpandedGoalId(null);
      }
    } catch (err) {
      setError(err.message || "Could not delete goal.");
    } finally {
      setBusyGoalId(null);
    }
  };

  const completedTasks = useMemo(
    () =>
      Object.values(tasksByGoal)
        .flat()
        .filter((task) => task.completed).length,
    [tasksByGoal]
  );

  const focusScore = useMemo(
    () =>
      goals.length
        ? Math.round(
            goals.reduce(
              (sum, goal) =>
                sum +
                progressFor(goal, tasksByGoal[goal.id] || []),
              0
            ) / goals.length
          )
        : 0,
    [goals, tasksByGoal]
  );

  const completedGoals = goals.filter(
    (goal) => progressFor(goal, tasksByGoal[goal.id] || []) >= 100
  ).length;

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const logout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div className="goals-page">
      <aside className="goals-sidebar">
        <button
          className="goals-brand"
          onClick={() => navigate("/dashboard")}
          aria-label="Saathi home"
        >
          <span className="brand-mark">◉</span>
          <span>Saathi</span>
        </button>

        <nav className="goals-nav" aria-label="Main navigation">
          <button
            className="goals-nav-link"
            onClick={() => navigate("/dashboard")}
          >
            <span>🏠</span> Dashboard
          </button>

          <button
            className="goals-nav-link active"
            onClick={() => navigate("/goals")}
            aria-current="page"
          >
            <span>🎯</span> My Goals
          </button>

          <button
            className="goals-nav-link"
            onClick={() => navigate("/partners")}
          >
            <span>🤝</span> My Partners
          </button>

          <button
            className="goals-nav-link"
            onClick={() => navigate("/profile")}
          >
            <span>👤</span> Profile
          </button>
        </nav>

        <div className="goals-sidebar-bottom">
          <div className="goals-sidebar-tip">
            <span className="tip-sparkle">✦</span>
            <p>Small progress is still progress.</p>
          </div>

          <button className="goals-logout" onClick={logout}>
            <span>↪</span> Logout
          </button>
        </div>
      </aside>

      <main className="goals-main">
        <header className="goals-header">
          <div className="goals-heading">
            <p className="goals-date">{today}</p>
            <h1>My Goals</h1>
            <p className="goals-subtitle">
              Stay focused and keep moving toward your biggest priorities.
            </p>
            <span className="goals-eyebrow">YOUR GOALS</span>
          </div>

          <div className="goals-header-actions">
            <button
              className="goals-icon-button"
              aria-label="Notifications"
              title="Notifications"
              type="button"
            >
              🔔
            </button>

            <button
              className="goals-avatar"
              onClick={() => navigate("/profile")}
              aria-label="Open profile"
              title="Open profile"
              type="button"
            >
              {(user?.name || user?.username || user?.email || "S")
                .charAt(0)
                .toUpperCase()}
            </button>
          </div>
        </header>

        {error && (
          <div className="goals-alert" role="alert">
            <span>{error}</span>
            <button
              onClick={() => setError("")}
              aria-label="Dismiss error"
              type="button"
            >
              ×
            </button>
          </div>
        )}

        <div className="goals-content">
          <section className="goals-board">
            <div className="goals-board-top">
              <span className="goals-section-label">YOUR PLAN</span>

              <button
                className="goals-back-link"
                onClick={() => navigate("/dashboard")}
                type="button"
              >
                Back to dashboard ↗
              </button>
            </div>

            <div className="goals-list">
              {loading ? (
                <div className="goals-empty-state" role="status">
                  <span className="goals-spinner" />
                  <p>Loading your goals…</p>
                </div>
              ) : goals.length === 0 ? (
                <div className="goals-empty-state">
                  <div className="empty-icon">🌱</div>
                  <h2>Your next chapter starts here</h2>
                  <p>
                    Create a goal and turn it into small, doable steps.
                  </p>
                  <button
                    className="goals-primary-button"
                    onClick={() => navigate("/create-goal")}
                    type="button"
                  >
                    + Create your first goal
                  </button>
                </div>
              ) : (
                goals.map((goal) => {
                  const tasks = tasksByGoal[goal.id] || [];
                  const progress = progressFor(goal, tasks);
                  const completed = tasks.filter(
                    (task) => task.completed
                  ).length;

                  const priority =
                    goal.priority ||
                    (goal.category?.toLowerCase().includes("health")
                      ? "Daily"
                      : "High");

                  const expanded = expandedGoalId === goal.id;

                  const deadline = goal.deadline
                    ? new Date(goal.deadline).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })
                    : null;

                  return (
                    <article className="goal-card" key={goal.id}>
                      <div className="goal-card-top">
                        <div className="goal-icon">
                          {categoryIcon(goal.category)}
                        </div>

                        <div className="goal-information">
                          <div className="goal-title-line">
                            <h2>{goal.title || "Untitled goal"}</h2>

                            <span
                              className={`goal-priority ${priority.toLowerCase()}`}
                            >
                              {priority}
                            </span>
                          </div>

                          <p className="goal-category">
                            {goal.category || "Personal growth"}
                          </p>
                        </div>
                      </div>

                      {goal.description && (
                        <p className="goal-description">
                          {goal.description}
                        </p>
                      )}

                      <p className="goal-target">
                        {goal.daily_target ||
                          goal.target ||
                          (tasks.length
                            ? `${completed} of ${tasks.length} tasks completed`
                            : "One small step at a time")}
                      </p>

                      <div
                        className="goal-progress-track"
                        role="progressbar"
                        aria-valuenow={progress}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${goal.title} progress`}
                      >
                        <span
                          className="goal-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      <div className="goal-progress-meta">
                        <span>
                          {tasks.length
                            ? `${completed}/${tasks.length} tasks complete`
                            : `${progress}% complete`}
                        </span>
                        <span>{deadline || "Keep going"}</span>
                      </div>

                      <div className="goal-card-actions">
                        <button
                          className="goals-update-button"
                          onClick={() =>
                            navigate(`/edit-goal/${goal.id}`)
                          }
                          type="button"
                        >
                          Update
                        </button>

                        <button
                          className="goals-secondary-button"
                          disabled={
                            Boolean(busyGoalId) || Boolean(busyTaskId)
                          }
                          onClick={() =>
                            tasks.length
                              ? toggleTask(
                                  tasks.find((task) => !task.completed) ||
                                    tasks[0],
                                  goal.id
                                )
                              : setExpandedGoalId(
                                  expanded ? null : goal.id
                                )
                          }
                          type="button"
                        >
                          {tasks.length ? "Mark done" : "Add a task"}
                        </button>

                        <button
                          className="goals-more-button"
                          onClick={() => deleteGoal(goal)}
                          disabled={busyGoalId === goal.id}
                          title="Delete goal"
                          aria-label={`Delete ${goal.title || "goal"}`}
                          type="button"
                        >
                          
                        </button>
                      </div>

                      {expanded && (
                        <div className="goal-task-area">
                          <form
                            className="goal-add-task"
                            onSubmit={(event) => {
                              event.preventDefault();
                              addTask(goal.id);
                            }}
                          >
                            <input
                              value={taskDrafts[goal.id] || ""}
                              onChange={(event) =>
                                setTaskDrafts((current) => ({
                                  ...current,
                                  [goal.id]: event.target.value,
                                }))
                              }
                              placeholder="Add a small task…"
                              aria-label="New task title"
                            />

                            <button
                              type="submit"
                              disabled={busyGoalId === goal.id}
                            >
                              {busyGoalId === goal.id ? "Adding…" : "Add"}
                            </button>
                          </form>

                          {tasks.length > 0 && (
                            <ul className="goal-task-list">
                              {tasks.map((task) => (
                                <li
                                  key={task.id}
                                  className={
                                    task.completed ? "task-complete" : ""
                                  }
                                >
                                  <label>
                                    <input
                                      type="checkbox"
                                      checked={Boolean(task.completed)}
                                      onChange={() =>
                                        toggleTask(task, goal.id)
                                      }
                                      disabled={busyTaskId === task.id}
                                    />
                                    <span>{task.title}</span>
                                  </label>

                                  <button
                                    onClick={() =>
                                      deleteTask(task, goal.id)
                                    }
                                    disabled={busyTaskId === task.id}
                                    aria-label={`Delete task ${task.title}`}
                                    type="button"
                                  >
                                    ×
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}

                      {tasks.length > 0 && (
                        <button
                          className="goal-tasks-toggle"
                          onClick={() =>
                            setExpandedGoalId(
                              expanded ? null : goal.id
                            )
                          }
                          type="button"
                          aria-expanded={expanded}
                        >
                          {expanded
                            ? "Hide tasks"
                            : `View tasks (${tasks.length})`}
                          <span>{expanded ? "⌃" : "⌄"}</span>
                        </button>
                      )}
                    </article>
                  );
                })
              )}
            </div>

            {!loading && (
              <button
                className="goals-create-button"
                onClick={() => navigate("/create-goal")}
                type="button"
              >
                <span>＋</span> Create New Goal
              </button>
            )}
          </section>

          <aside className="goals-side-panel">
            <div className="goals-stats-grid">
              <div className="goals-stat-card stat-peach">
                <span>TOTAL GOALS</span>
                <strong>{goals.length}</strong>
                <small>Goals on your list</small>
              </div>

              <div className="goals-stat-card stat-green">
                <span>COMPLETED</span>
                <strong>{completedGoals}</strong>
                <small>Nice momentum</small>
              </div>

              <div className="goals-stat-card stat-lilac">
                <span>FOCUS SCORE</span>
                <strong>{focusScore}%</strong>
                <small>Keep it growing</small>
              </div>
            </div>

            <section className="goals-panel-card priority-focus-card">
              <p className="goals-panel-eyebrow">THIS WEEK</p>
              <h2>Priority Focus</h2>
              <ul>
                <li>Finish one small step today</li>
                <li>Make time for focused practice</li>
                <li>Celebrate steady progress</li>
              </ul>
            </section>

            <section className="goals-consistency-card">
              <div className="consistency-flame">🔥</div>
              <div>
                <p>CONSISTENCY</p>
                <h2>
                  {completedTasks} task
                  {completedTasks === 1 ? "" : "s"} completed
                </h2>
                <span>
                  Every step counts. Keep your streak alive!
                </span>
              </div>
            </section>

            <section className="goals-panel-card encouragement-card">
              <span className="encouragement-icon">✦</span>
              <h3>You're building something good.</h3>
              <p>
                Progress doesn't have to be perfect. Just keep showing up.
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}