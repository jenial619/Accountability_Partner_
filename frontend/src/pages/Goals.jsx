import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";
const TOKEN_KEY = "saathi-access-token";
const categories = ["Health", "Learning", "Career", "Build", "Personal Growth", "Other"];
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

function GoalsPage() {
  const [token, setToken] = useState(savedToken);
  const [user, setUser] = useState(null);
  const [remoteGoals, setRemoteGoals] = useState([]);
  const [groups, setGroups] = useState([]);
  const [workspaceReady, setWorkspaceReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(null);
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const pendingAction = useRef(null);
  const goals = workspaceReady ? remoteGoals : sampleGoals;

  const loadWorkspace = useCallback(async (currentToken, signal) => {
    const [account, goalList, groupList] = await Promise.all([
      apiRequest("/api/auth/me", { token: currentToken, signal }),
      apiRequest("/api/goals", { token: currentToken, signal }),
      apiRequest("/api/groups", { token: currentToken, signal }),
    ]);
    setUser(account);
    setRemoteGoals(goalList);
    setGroups(groupList);
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
        setNotice("Your session expired. Sign in again to continue.");
      } else {
        setNotice(error.message);
      }
    });
    return () => controller.abort();
  }, [loadWorkspace, token]);

  async function refreshWorkspace(currentToken = token) {
    await loadWorkspace(currentToken);
  }

  async function ensureAccount() {
    if (token) {
      if (user) return token;
      try {
        await refreshWorkspace(token);
        return token;
      } catch (error) {
        if (error.status !== 401) throw error;
        window.localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
        setWorkspaceReady(false);
      }
    }
    return "";
  }

  async function withAccount(callback) {
    setBusy(true);
    try {
      const currentToken = await ensureAccount();
      if (currentToken) {
        await callback(currentToken);
      } else {
        pendingAction.current = callback;
        setForm({ type: "auth", mode: "login" });
        setFormError("");
      }
    } catch (error) {
      if (error.status === 401) {
        window.localStorage.removeItem(TOKEN_KEY);
        setToken("");
        setUser(null);
        setWorkspaceReady(false);
      }
      setNotice(error.message);
    } finally {
      setBusy(false);
    }
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submitForm(event) {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      if (form.type === "auth") {
        const mode = form.mode;
        const result = await apiRequest(`/api/auth/${mode === "register" ? "register" : "login"}`, {
          method: "POST",
          body: { ...(mode === "register" ? { name: form.name } : {}), email: form.email, password: form.password },
        });
        window.localStorage.setItem(TOKEN_KEY, result.access_token);
        setToken(result.access_token);
        await loadWorkspace(result.access_token);
        setForm(null);
        const action = pendingAction.current;
        pendingAction.current = null;
        if (action) await action(result.access_token);
      } else if (form.type === "goal") {
        const editing = form.goal;
        await apiRequest(editing ? `/api/goals/${editing.id}` : "/api/goals", {
          method: editing ? "PATCH" : "POST",
          token,
          body: {
            title: form.title,
            category: form.category,
            daily_target: form.daily_target,
            description: form.description,
          },
        });
        await refreshWorkspace();
        setForm(null);
      } else if (form.type === "circle" || form.type === "join") {
        const goalId = Number(form.goal_id);
        if (form.type === "circle") {
          const group = await apiRequest("/api/groups", {
            method: "POST",
            token,
            body: { name: form.name, goal_id: goalId },
          });
          await refreshWorkspace();
          setForm(null);
          setNotice(`Circle created. Share invite code ${group.invite_code} with your partner.`);
        } else {
          await apiRequest("/api/groups/join", {
            method: "POST",
            token,
            body: { invite_code: form.invite_code, goal_id: goalId },
          });
          await refreshWorkspace();
          setForm(null);
        }
      } else if (form.type === "delete") {
        await apiRequest(`/api/goals/${form.goal.id}`, { method: "DELETE", token });
        await refreshWorkspace();
        setForm(null);
      } else if (form.type === "encourage") {
        await apiRequest(`/api/groups/${form.group.id}/encouragements`, {
          method: "POST",
          token,
          body: { recipient_id: form.partner.user_id, message: form.message },
        });
        await refreshWorkspace();
        setForm(null);
      } else if (form.type === "matches") {
        const group = await apiRequest("/api/groups", {
          method: "POST",
          token,
          body: { name: form.circleName, goal_id: form.goal.id },
        });
        await refreshWorkspace();
        setForm(null);
        setNotice(`Circle created. Share invite code ${group.invite_code} with ${form.partner.name}.`);
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
    if (!match) {
      setNotice("These original sample goals are examples. Create a goal to use it with the backend.");
      return null;
    }
    return match;
  }

  async function createGoal() {
    const start = () => setForm({ type: "goal", title: "", category: "Health", daily_target: "", description: "" });
    if (token && user) start();
    else await withAccount(async () => start());
  }

  async function updateGoal(goal) {
    const current = actualGoal(goal);
    if (!current) return;
    setForm({ type: "goal", goal: current, title: current.title, category: current.category, daily_target: current.daily_target, description: current.description });
  }

  async function deleteGoal(goal) {
    const current = actualGoal(goal);
    if (current) setForm({ type: "delete", goal: current });
  }

  async function chooseGoal(currentToken, onlyUnpaired = false) {
    const options = remoteGoals.filter((goal) => !onlyUnpaired || !goal.in_circle);
    if (!options.length) {
      setNotice(onlyUnpaired ? "You need an unpaired goal to join or create a circle." : "Create a goal first.");
      return null;
    }
    return options[0];
  }

  async function createCircle() {
    await withAccount(async (currentToken) => {
      const goal = await chooseGoal(currentToken, true);
      if (goal) setForm({ type: "circle", goal_id: String(goal.id), name: `${goal.title} circle` });
    });
  }

  async function joinCircle() {
    await withAccount(async (currentToken) => {
      const goal = await chooseGoal(currentToken, true);
      if (!goal) return;
      setForm({ type: "join", goal_id: String(goal.id), invite_code: "" });
    });
  }

  async function findPartners(goal) {
    await withAccount(async (currentToken) => {
      const current = actualGoal(goal);
      if (!current) return;
      const matches = await apiRequest(`/api/matches?goal_id=${current.id}`, { token: currentToken });
      if (!matches.length) {
        setNotice("No unpaired similar goals found yet. Share a circle invite code with someone you know.");
        return;
      }
      const selected = matches[0];
      setForm({ type: "matches", goal: current, partner: selected, circleName: `${current.title} with ${selected.name}` });
    });
  }

  function groupForGoal(goal) {
    if (!user) return null;
    return groups.find((group) => group.members.some(
      (member) => member.user_id === user.id && member.goal.id === goal.id,
    )) ?? null;
  }

  async function markDone(goal) {
    await withAccount(async (currentToken) => {
      const current = actualGoal(goal);
      if (!current) return;
      const group = groupForGoal(current);
      if (!group) {
        setNotice("Join or create an accountability circle for this goal before checking in.");
        return;
      }
      await apiRequest(`/api/groups/${group.id}/check-ins`, {
        method: "POST",
        token: currentToken,
        body: { note: "" },
      });
      await refreshWorkspace(currentToken);
      setNotice("Today's check-in is complete.");
    });
  }

  async function encourage(group, partner) {
    setForm({ type: "encourage", group, partner, message: "You've got this!" });
  }

  function logout(event) {
    event.preventDefault();
    if (!user) {
      setForm({ type: "auth", mode: "login" });
      setFormError("");
      return;
    }
    window.localStorage.removeItem(TOKEN_KEY);
    setToken("");
    setUser(null);
    setRemoteGoals([]);
    setGroups([]);
    setWorkspaceReady(false);
    window.location.assign("/");
  }

  const completeCount = user
    ? groups.reduce((count, group) => count + Number(group.members.some(
      (member) => member.user_id === user.id && member.today_completed,
    )), 0)
    : 1;
  const streak = user
    ? Math.max(0, ...groups.flatMap((group) => group.members
      .filter((member) => member.user_id === user.id)
      .map((member) => member.streak)))
    : 7;
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
    background: "#fff",
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
    color: "#3e2b25",
    font: "inherit",
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
        {notice && <p role="status" style={{ background: "#fff", borderLeft: "4px solid #c9603e", padding: "12px 16px" }}>{notice}<button aria-label="Dismiss message" onClick={() => setNotice("")} style={{ float: "right" }} type="button">×</button></p>}
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
                const group = groupForGoal(goal);
                const member = group?.members.find((item) => item.user_id === user?.id);
                const sample = typeof goal.id === "string";
                const progress = sample ? goal.progress : member?.today_completed ? 100 : 0;
                const completed = sample
                  ? goal.completed
                  : member?.today_completed ? "Checked in today" : "Not checked in today";
                const due = sample ? goal.due : group ? `${group.name} · ${group.team_streak}-day team streak` : "No partner circle yet";
                return (
                  <article className={`dashboard-goal-card goal-detail-card ${sample ? goal.accent : categoryAccent(goal.category)}`} key={goal.id}>
                    <div className="goal-icon">{sample ? goal.icon : icons[goal.category] ?? "🎯"}</div>

                    <div className="goal-information">
                      <div className="goal-title-row">
                        <div>
                          <h3>{goal.title}</h3>
                          <p>{goal.category}</p>
                        </div>

                        <span className={`priority-badge ${(sample ? goal.priority : group ? "High" : "Medium").toLowerCase()}`}>
                          {sample ? goal.priority : group ? "In circle" : "Seeking partner"}
                        </span>
                      </div>

                      <p className="goal-description">{sample ? goal.description : goal.daily_target}</p>

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
                        <button type="button" className="goal-action-btn" disabled={busy} onClick={() => sample ? setNotice("These sample goals are examples. Create a goal to edit it.") : updateGoal(goal)}>
                          Update
                        </button>
                        <button type="button" className="goal-action-btn secondary" disabled={busy || Boolean(member?.today_completed)} onClick={() => markDone(goal)}>
                          {member?.today_completed ? "Done today" : "Mark done"}
                        </button>
                        {!sample && !group && (
                          <button type="button" className="goal-action-btn" disabled={busy} onClick={() => findPartners(goal)}>
                            Find partner
                          </button>
                        )}
                        {!sample && (
                          <button type="button" className="goal-action-btn secondary" disabled={busy || Boolean(group)} onClick={() => deleteGoal(goal)}>
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
                <small>{user ? `${goals.filter((goal) => !goal.in_circle).length} seeking partners` : "Sign in to sync goals"}</small>
              </div>

              <div className="goal-summary-card green-card">
                <span>Completed</span>
                <strong>{completeCount}</strong>
                <small>{user ? "Check-ins today" : "Nice momentum"}</small>
              </div>

              <div className="goal-summary-card purple-card">
                <span>Focus Score</span>
                <strong>{focusScore}%</strong>
                <small>{user ? "Today's progress" : "Above average"}</small>
              </div>
            </div>

            <div className="panel-card focus-card">
              <div className="panel-header">
                <span>YOUR PARTNERS</span>
                <h3>Accountability circles</h3>
              </div>

              <ul className="focus-list">
                {groups.length ? groups.map((group) => (
                  <li key={group.id}>
                    {group.name} · Invite {group.invite_code} · {group.member_count} members
                    {group.members.filter((partner) => partner.user_id !== user?.id).map((partner) => (
                      <button
                        className="goal-action-btn"
                        disabled={busy}
                        key={partner.user_id}
                        onClick={() => encourage(group, partner)}
                        type="button"
                      >
                        Encourage {partner.name}
                      </button>
                    ))}
                  </li>
                )) : <li>{user ? "Create a circle and share its invite code." : "Sign in to find partners and build a circle."}</li>}
              </ul>
              <div className="goal-actions">
                <button className="goal-action-btn" disabled={busy || !remoteGoals.some((goal) => !goal.in_circle)} onClick={createCircle} type="button">Start a circle</button>
                <button className="goal-action-btn secondary" disabled={busy || !remoteGoals.some((goal) => !goal.in_circle)} onClick={joinCircle} type="button">Join with code</button>
              </div>
            </div>

            <div className="panel-card streak-card">
              <div className="streak-icon">🔥</div>
              <div>
                <span>CONSISTENCY</span>
                <h3>{streak}-day streak</h3>
                <p>{user ? `${groups.length} accountability circle${groups.length === 1 ? "" : "s"} · ${groups.reduce((total, group) => total + group.members.reduce((points, member) => points + (member.user_id === user.id ? member.coach_points : 0), 0), 0)} coach points` : "You are building momentum. Keep it going."}</p>
              </div>
            </div>
          </aside>
        </div>
      </main>
      {form && (
        <div onMouseDown={(event) => {
          if (event.target === event.currentTarget && !busy) {
            setForm(null);
            pendingAction.current = null;
          }
        }} style={dialogOverlayStyle}>
          <section aria-labelledby="goals-dialog-title" aria-modal="true" role="dialog" style={dialogStyle}>
            <h2 id="goals-dialog-title" style={{ marginTop: 0 }}>
              {form.type === "auth" ? (form.mode === "register" ? "Create your Saathi account" : "Log in to Saathi")
                : form.type === "goal" ? (form.goal ? "Update your daily goal" : "Create a daily goal")
                  : form.type === "circle" ? "Start a partner circle"
                    : form.type === "join" ? "Join a partner circle"
                      : form.type === "delete" ? "Delete this goal?"
                        : form.type === "encourage" ? `Encourage ${form.partner.name}`
                          : `Potential partner: ${form.partner.name}`}
            </h2>
            <form onSubmit={submitForm}>
              {form.type === "auth" && (
                <>
                  <div className="goal-actions">
                    <button className="goal-action-btn" onClick={() => { setForm({ ...form, mode: "login" }); setFormError(""); }} type="button">Log in</button>
                    <button className="goal-action-btn secondary" onClick={() => { setForm({ ...form, mode: "register" }); setFormError(""); }} type="button">Create account</button>
                  </div>
                  {form.mode === "register" && <label style={fieldStyle}>Name<input autoComplete="name" onChange={(event) => updateForm("name", event.target.value)} required style={inputStyle} value={form.name ?? ""} /></label>}
                  <label style={fieldStyle}>Email<input autoComplete="email" onChange={(event) => updateForm("email", event.target.value)} required style={inputStyle} type="email" value={form.email ?? ""} /></label>
                  <label style={fieldStyle}>Password<input autoComplete={form.mode === "register" ? "new-password" : "current-password"} minLength={8} onChange={(event) => updateForm("password", event.target.value)} required style={inputStyle} type="password" value={form.password ?? ""} /></label>
                </>
              )}
              {form.type === "goal" && (
                <>
                  <label style={fieldStyle}>Goal name<input maxLength={100} onChange={(event) => updateForm("title", event.target.value)} required style={inputStyle} value={form.title} /></label>
                  <label style={fieldStyle}>Category<select onChange={(event) => updateForm("category", event.target.value)} style={inputStyle} value={form.category}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
                  <label style={fieldStyle}>Daily task<input maxLength={120} onChange={(event) => updateForm("daily_target", event.target.value)} required style={inputStyle} value={form.daily_target} /></label>
                  <label style={fieldStyle}>Note for your partner<textarea maxLength={500} onChange={(event) => updateForm("description", event.target.value)} rows={3} style={inputStyle} value={form.description} /></label>
                </>
              )}
              {(form.type === "circle" || form.type === "join") && (
                <>
                  <label style={fieldStyle}>Daily goal<select onChange={(event) => updateForm("goal_id", event.target.value)} style={inputStyle} value={form.goal_id}>{remoteGoals.filter((goal) => !goal.in_circle).map((goal) => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select></label>
                  {form.type === "circle"
                    ? <label style={fieldStyle}>Circle name<input maxLength={100} onChange={(event) => updateForm("name", event.target.value)} required style={inputStyle} value={form.name} /></label>
                    : <label style={fieldStyle}>Invite code<input maxLength={16} onChange={(event) => updateForm("invite_code", event.target.value.toUpperCase())} required style={inputStyle} value={form.invite_code} /></label>}
                </>
              )}
              {form.type === "delete" && <p>“{form.goal.title}” will be removed from your goals.</p>}
              {form.type === "encourage" && <label style={fieldStyle}>Message<input maxLength={240} minLength={2} onChange={(event) => updateForm("message", event.target.value)} required style={inputStyle} value={form.message} /></label>}
              {form.type === "matches" && <><p>{form.partner.goal.title} · {form.partner.match_score}% task similarity. Create a circle invite, then share the code so they can join.</p><label style={fieldStyle}>Circle name<input maxLength={100} onChange={(event) => updateForm("circleName", event.target.value)} required style={inputStyle} value={form.circleName} /></label></>}
              {formError && <p role="alert" style={{ color: "#a32121" }}>{formError}</p>}
              <div className="goal-actions" style={{ marginTop: 20 }}>
                <button className="goal-action-btn secondary" disabled={busy} onClick={() => { setForm(null); setFormError(""); pendingAction.current = null; }} type="button">Cancel</button>
                <button className="goal-action-btn" disabled={busy} type="submit">
                  {busy ? "Please wait…" : form.type === "auth" ? (form.mode === "register" ? "Create account" : "Log in")
                    : form.type === "goal" ? "Save goal"
                      : form.type === "circle" ? "Create circle"
                        : form.type === "join" ? "Join circle"
                          : form.type === "delete" ? "Delete goal"
                            : form.type === "encourage" ? "Send encouragement" : "Create invite"}
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
