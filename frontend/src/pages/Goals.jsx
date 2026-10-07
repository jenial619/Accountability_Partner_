import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "saathi-access-token";
const LOCAL_GOALS_KEY = "saathi-my-goals-local";
const categories = ["Health", "Learning", "Career", "Build", "Personal Growth", "Other"];
const weeklyGoals = [
  "Finish the onboarding flow",
  "Complete one deep-dive DSA session",
  "Read 20 pages before sleep",
];
const icons = {
  Health: "💪",
  Learning: "💻",
  Career: "🌱",
  Build: "🚀",
  "Personal Growth": "📚",
  Other: "🎯",
};
const sampleGoals = [
  {
    id: "sample-1",
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
    id: "sample-2",
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
    id: "sample-3",
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

function savedToken() {
  try {
    return window.localStorage.getItem(TOKEN_KEY) || "";
  } catch (error) {
    console.error("Could not read the saved Saathi session.", error);
    return "";
  }
}

function savedLocalGoals() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(LOCAL_GOALS_KEY) || "[]");
    return Array.isArray(stored) ? stored : [];
  } catch (error) {
    console.error("Could not read locally saved goals.", error);
    return [];
  }
}

async function apiRequest(path, { method = "GET", body, token, signal } = {}) {
  let response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(signal ? { signal } : {}),
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  } catch (error) {
    throw new Error(`Cannot reach the API at ${API_URL}. Start it with "py -m uvicorn app.main:app --reload" from the backend folder.`, { cause: error });
  }

  if (response.status === 204) return null;
  let payload;
  try {
    payload = await response.json();
  } catch (error) {
    throw new Error("The API returned an invalid response.", { cause: error });
  }
  if (!response.ok) {
    const detail = Array.isArray(payload.detail)
      ? payload.detail.map((issue) => issue.msg).join(" ")
      : payload.detail;
    const requestError = new Error(detail || "The request failed. Please try again.");
    requestError.status = response.status;
    throw requestError;
  }
  return payload;
}

function categoryAccent(category) {
  if (category === "Health" || category === "Learning") return "orange";
  if (category === "Build" || category === "Career") return "green";
  return "purple";
}

function localDateKey() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `saathi-goals-completed-${date.getFullYear()}-${month}-${day}`;
}

function GoalsPage() {
  const [token, setToken] = useState(savedToken);
  const [user, setUser] = useState(null);
  const [remoteGoals, setRemoteGoals] = useState([]);
  const [localGoals, setLocalGoals] = useState(savedLocalGoals);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [completedGoals, setCompletedGoals] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem(localDateKey()) || "{}");
    } catch (error) {
      console.error("Could not read today's goal completion state.", error);
      return {};
    }
  });
  const goals = workspaceReady ? remoteGoals : [...localGoals, ...sampleGoals];

  const loadWorkspace = useCallback(async (currentToken, signal) => {
    const [account, goalList] = await Promise.all([
      apiRequest("/api/auth/me", { token: currentToken, signal }),
      apiRequest("/api/goals", { token: currentToken, signal }),
    ]);
    setUser(account);
    setRemoteGoals(goalList);
    setWorkspaceReady(true);
  }, []);

  useEffect(() => {
    if (!token) return undefined;
    const controller = new AbortController();
    Promise.resolve().then(() => loadWorkspace(token, controller.signal)).catch((error) => {
      if (controller.signal.aborted) return;
      if (error.status === 401) {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
        setWorkspaceReady(false);
        setNotice("Your session expired. Goals can still be saved on this device.");
      } else {
        setNotice(error.message);
      }
    });
    return () => controller.abort();
  }, [loadWorkspace, token]);

  async function refreshWorkspace(currentToken = token) {
    await loadWorkspace(currentToken);
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      if (form.type === "goal") {
        const editing = form.goal;
        const payload = {
          title: form.title.trim(),
          category: form.category,
          daily_target: form.daily_target.trim(),
          description: form.description.trim(),
        };
        if (token && user && workspaceReady) {
          await apiRequest(editing ? `/api/goals/${editing.id}` : "/api/goals", {
            method: editing ? "PATCH" : "POST",
            token,
            body: payload,
          });
          await refreshWorkspace();
        } else {
          const updated = editing
            ? localGoals.map((goal) => goal.id === editing.id ? { ...goal, ...payload } : goal)
            : [{ ...payload, id: `local-${Date.now()}`, progress: 0, completed: "0/0", due: "Today", priority: "Medium", accent: categoryAccent(payload.category) }, ...localGoals];
          window.localStorage.setItem(LOCAL_GOALS_KEY, JSON.stringify(updated));
          setLocalGoals(updated);
          setNotice("Goal saved on this device.");
        }
        setForm(null);
      } else if (form.type === "delete") {
        if (form.goal.id.toString().startsWith("local-")) {
          const updated = localGoals.filter((goal) => goal.id !== form.goal.id);
          window.localStorage.setItem(LOCAL_GOALS_KEY, JSON.stringify(updated));
          setLocalGoals(updated);
        } else if (token && user && workspaceReady) {
          await apiRequest(`/api/goals/${form.goal.id}`, { method: "DELETE", token });
          await refreshWorkspace();
        }
        setForm(null);
      }
    } catch (error) {
      setFormError(error.message);
      if (error.status === 401) {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
        setWorkspaceReady(false);
      }
    } finally {
      setBusy(false);
    }
  }

  function actualGoal(goal) {
    const match = remoteGoals.find((item) => item.id === goal.id);
    if (!match && !goal.id.toString().startsWith("local-")) {
      setNotice("These original sample goals are examples. Create a goal to use it with the backend.");
    }
    return match ?? null;
  }

  async function createGoal() {
    setForm({ type: "goal", title: "", category: "Health", daily_target: "", description: "" });
  }

  async function updateGoal(goal) {
    const current = actualGoal(goal);
    if (!current && !goal.id.toString().startsWith("local-")) return;
    const editable = current ?? goal;
    setForm({ type: "goal", goal: editable, title: editable.title, category: editable.category, daily_target: editable.daily_target, description: editable.description });
  }

  async function deleteGoal(goal) {
    const current = actualGoal(goal);
    if (current || goal.id.toString().startsWith("local-")) setForm({ type: "delete", goal: current ?? goal });
  }

  function markDone(goal) {
    const key = `${user?.id ?? "preview"}:${goal.id}`;
    const next = { ...completedGoals, [key]: !completedGoals[key] };
    try {
      window.localStorage.setItem(localDateKey(), JSON.stringify(next));
      setCompletedGoals(next);
    } catch (error) {
      setNotice(`Could not save today's progress: ${error.message}`);
    }
  }

  function logout(event) {
    event.preventDefault();
    if (!user) {
      window.location.assign("/");
      return;
    }
    window.localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setRemoteGoals([]);
    setWorkspaceReady(false);
    window.location.assign("/");
  }

  const completionKey = (goal) => `${user?.id ?? "preview"}:${goal.id}`;
  const completeCount = goals.filter((goal) => completedGoals[completionKey(goal)]).length;
  const focusScore = goals.length ? Math.round((completeCount / goals.length) * 100) : 0;
  const today = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date());
  const dialogOverlayStyle = {
    position: "fixed",
    inset: 0,
    zIndex: 1000,
    background: "rgba(25, 18, 15, 0.62)",
    display: "grid",
    placeItems: "center",
    padding: 20,
  };
  const dialogStyle = {
    width: "min(100%, 480px)",
    maxHeight: "90vh",
    overflowY: "auto",
    padding: 28,
    borderRadius: 14,
    background: "#fff8ef",
    color: "#3e2b25",
    boxShadow: "0 20px 70px rgba(0,0,0,.25)",
  };
  const fieldStyle = {
    display: "grid",
    gap: 6,
    margin: "12px 0",
    color: "#513d34",
    fontSize: 14,
  };
  const inputStyle = {
    boxSizing: "border-box",
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #d8c9c1",
    borderRadius: 7,
    backgroundColor: "#ffffff",
    color: "#3e2b25",
    caretColor: "#c9603e",
    fontFamily: "inherit",
    fontSize: 16,
    lineHeight: 1.4,
  };

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

          <Link to="/" className="logout-link" onClick={logout}>
            <span>↪</span>
            Logout
          </Link>
        </div>
      </aside>

      <main className="dashboard-main goals-main">
        {notice && <p role="status" style={{ background: notice === "Goal saved on this device." ? "#e8f4e6" : "#fff", borderLeft: `4px solid ${notice === "Goal saved on this device." ? "#4f8a4b" : "#c9603e"}`, color: "#3e2b25", padding: "12px 16px" }}>{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")} style={{ float: "right" }} type="button">×</button></p>}
        <header className="dashboard-header">
          <div>
            <p className="dashboard-date">{today}</p>
            <h1>My Goals</h1>
            <p className="dashboard-subtitle">
              {user
                ? `Welcome, ${user.name}. Stay focused and keep moving together.`
                : "Stay focused and keep moving toward your biggest priorities."}
            </p>
          </div>

          <div className="header-profile">
            <div className="notification">
              🔔
              <span></span>
            </div>

            <div className="profile-avatar">{user?.name?.[0]?.toUpperCase() ?? "S"}</div>
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
              {goals.map((goal) => {
                const example = goal.id.toString().startsWith("sample-");
                const sample = example || goal.id.toString().startsWith("local-");
                const isComplete = Boolean(completedGoals[completionKey(goal)]);
                const progress = isComplete ? 100 : example ? goal.progress : 0;
                const completed = example
                  ? isComplete ? "Completed today" : goal.completed
                  : isComplete ? "Completed today" : "Not completed today";
                const due = example ? goal.due : "Daily goal";
                return (
                  <article className={`dashboard-goal-card goal-detail-card ${sample ? goal.accent : categoryAccent(goal.category)}`} key={goal.id}>
                    <div className="goal-icon">{example ? goal.icon : icons[goal.category] ?? "🎯"}</div>

                    <div className="goal-information">
                      <div className="goal-title-row">
                        <div>
                          <h3>{goal.title}</h3>
                          <p>{goal.category}</p>
                        </div>

                        <span className={`priority-badge ${(example ? goal.priority : "Medium").toLowerCase()}`}>
                          {example ? goal.priority : "Daily"}
                        </span>
                      </div>

                      <p className="goal-description">{example ? goal.description : goal.daily_target}</p>

                      <div className="dashboard-progress-bar">
                        <div
                          className="dashboard-progress"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>

                      <div className="goal-meta">
                        <span>{completed}</span>
                        <span>{due}</span>
                      </div>

                      <div className="goal-actions">
                        <button type="button" className="goal-action-btn" disabled={busy || example} onClick={() => example ? setNotice("These sample goals are examples. Create a goal to edit it.") : updateGoal(goal)}>
                          Update
                        </button>
                        <button type="button" className="goal-action-btn secondary" onClick={() => markDone(goal)}>
                          {isComplete ? "Undo done" : "Mark done"}
                        </button>
                        {!sample && (
                          <button type="button" className="goal-action-btn secondary" disabled={busy} onClick={() => deleteGoal(goal)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <button type="button" className="add-goal-btn full-width-btn" disabled={busy} onClick={createGoal}>
              + Create New Goal
            </button>
          </section>

          <aside className="goals-side-panel">
            <div className="goals-summary">
              <div className="goal-summary-card orange-card">
                <span>Total Goals</span>
                <strong>{goals.length}</strong>
                <small>{user ? `${goals.length - completeCount} in progress` : "Saved on this device"}</small>
              </div>

              <div className="goal-summary-card green-card">
                <span>Completed</span>
                <strong>{completeCount}</strong>
                <small>{user ? "Completed today" : "Nice momentum"}</small>
              </div>

              <div className="goal-summary-card purple-card">
                <span>Focus Score</span>
                <strong>{focusScore}%</strong>
                <small>{user ? "Today's progress" : "Above average"}</small>
              </div>
            </div>

            <div className="panel-card focus-card">
              <div className="panel-header">
                <span>THIS WEEK</span>
                <h3>Priority Focus</h3>
              </div>

              <ul className="focus-list">
                {weeklyGoals.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </div>

            <div className="panel-card streak-card">
              <div className="streak-icon">🔥</div>
              <div>
                <span>CONSISTENCY</span>
                <h3>{completeCount} of {goals.length} done today</h3>
                <p>{completeCount === goals.length && goals.length ? "You are building momentum. Keep it going." : "Small progress is still progress."}</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
      {form && (
        <div onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) {
            setForm(null);
          }
        }} style={dialogOverlayStyle}>
          <section aria-labelledby="goals-dialog-title" aria-modal="true" role="dialog" style={dialogStyle}>
            <h2 id="goals-dialog-title" style={{ marginTop: 0 }}>
              {form.type === "goal" ? (form.goal ? "Update your daily goal" : "Create a daily goal") : "Delete this goal?"}
            </h2>
            <form onSubmit={submitForm}>
              {form.type === "goal" && (
                <>
                  <label style={fieldStyle}>Goal name<input maxLength={100} onChange={(event) => updateForm("title", event.target.value)} required style={inputStyle} value={form.title} /></label>
                  <label style={fieldStyle}>Category<select onChange={(event) => updateForm("category", event.target.value)} style={inputStyle} value={form.category}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label style={fieldStyle}>Daily task<input maxLength={120} onChange={(event) => updateForm("daily_target", event.target.value)} required style={inputStyle} value={form.daily_target} /></label>
                  <label style={fieldStyle}>Note for your partner<textarea maxLength={500} onChange={(event) => updateForm("description", event.target.value)} rows={3} style={inputStyle} value={form.description} /></label>
                </>
              )}
              {form.type === "delete" && <p>“{form.goal.title}” will be removed from your goals.</p>}
              {formError && <p role="alert" style={{ color: "#a32121" }}>{formError}</p>}
              <div className="goal-actions" style={{ marginTop: 20 }}>
                <button className="goal-action-btn secondary" disabled={busy} onClick={() => { setForm(null); setFormError(""); }} type="button">Cancel</button>
                <button className="goal-action-btn" disabled={busy} type="submit">
                  {busy ? "Please wait…" : form.type === "goal" ? "Save goal" : "Delete goal"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}

export default GoalsPage;
