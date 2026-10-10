import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./Dashboard.css";

const API_URL = "http://127.0.0.1:8000";

function Dashboard() {
  const [user, setUser] = useState(null);

  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState([]);

  // Multiple connected partners
  const [partners, setPartners] = useState([]);

  // Partner goals are stored by partner ID
  const [partnerGoals, setPartnerGoals] = useState({});

  // Partner streaks are stored by partner ID
  const [partnerStreaks, setPartnerStreaks] = useState({});

  const [myStreak, setMyStreak] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // =========================================================
  // FETCH DASHBOARD DATA
  // =========================================================

  const fetchDashboardData = async () => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      setError("Please login again.");
      setLoading(false);
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    try {
      setLoading(true);
      setError("");

      // =====================================================
      // USER
      // =====================================================

      const userResponse = await fetch(
        `${API_URL}/users/me`,
        {
          method: "GET",
          headers,
        }
      );

      const userData = await userResponse.json();

      if (!userResponse.ok) {
        throw new Error(
          userData.detail ||
            "Failed to load user information."
        );
      }

      setUser(userData);

      // =====================================================
      // MY GOALS
      // =====================================================

      const goalsResponse = await fetch(
        `${API_URL}/goals/`,
        {
          method: "GET",
          headers,
        }
      );

      const goalsData = await goalsResponse.json();

      if (!goalsResponse.ok) {
        throw new Error(
          goalsData.detail ||
            "Failed to load goals."
        );
      }

      const myGoals = Array.isArray(goalsData)
        ? goalsData
        : goalsData.goals || [];

      setGoals(myGoals);

      // =====================================================
      // MY TASKS
      // =====================================================

      let allTasks = [];

      for (const goal of myGoals) {
        try {
          const taskResponse = await fetch(
            `${API_URL}/tasks/${goal.id}`,
            {
              method: "GET",
              headers,
            }
          );

          if (taskResponse.ok) {
            const taskData =
              await taskResponse.json();

            const goalTasks = Array.isArray(taskData)
              ? taskData
              : taskData.tasks || [];

            allTasks = [
              ...allTasks,
              ...goalTasks,
            ];
          }
        } catch (taskError) {
          console.error(
            `Error loading tasks for goal ${goal.id}:`,
            taskError
          );
        }
      }

      setTasks(allTasks);

      // =====================================================
      // MY STREAK
      // =====================================================

      try {
        const statsResponse = await fetch(
          `${API_URL}/users/me/stats`,
          {
            method: "GET",
            headers,
          }
        );

        if (statsResponse.ok) {
          const statsData =
            await statsResponse.json();

          setMyStreak(
            statsData.streak ??
              statsData.current_streak ??
              0
          );
        }
      } catch (statsError) {
        console.error(
          "Error loading my streak:",
          statsError
        );
      }

      // =====================================================
      // MULTIPLE CONNECTED PARTNERS
      // =====================================================

      const partnersResponse = await fetch(
        `${API_URL}/partners/my-partners`,
        {
          method: "GET",
          headers,
        }
      );

      const partnersData =
        await partnersResponse.json();

      if (!partnersResponse.ok) {
        throw new Error(
          partnersData.detail ||
            "Failed to load partners."
        );
      }

      const connectedPartners =
        Array.isArray(partnersData)
          ? partnersData
          : partnersData.partners || [];

      setPartners(connectedPartners);

      // =====================================================
      // LOAD GOALS + STREAK FOR EVERY PARTNER
      // =====================================================

      const goalsMap = {};
      const streakMap = {};

      for (const partner of connectedPartners) {
        // ---------------------------------------------------
        // PARTNER GOALS
        // ---------------------------------------------------

        try {
          const partnerGoalsResponse =
            await fetch(
              `${API_URL}/partners/partner/${partner.id}/goals`,
              {
                method: "GET",
                headers,
              }
            );

          if (partnerGoalsResponse.ok) {
            const partnerGoalsData =
              await partnerGoalsResponse.json();

            goalsMap[partner.id] =
              Array.isArray(partnerGoalsData)
                ? partnerGoalsData
                : partnerGoalsData.goals || [];
          } else {
            goalsMap[partner.id] = [];
          }
        } catch (partnerGoalError) {
          console.error(
            `Error loading goals for partner ${partner.id}:`,
            partnerGoalError
          );

          goalsMap[partner.id] = [];
        }

        // ---------------------------------------------------
        // PARTNER STREAK
        // ---------------------------------------------------

        try {
          const streakResponse = await fetch(
            `${API_URL}/tasks/partner/${partner.id}/streak`,
            {
              method: "GET",
              headers,
            }
          );

          if (streakResponse.ok) {
            const streakData =
              await streakResponse.json();

            streakMap[partner.id] =
              streakData.streak ??
              streakData.current_streak ??
              0;
          } else {
            streakMap[partner.id] = 0;
          }
        } catch (partnerStreakError) {
          console.error(
            `Error loading streak for partner ${partner.id}:`,
            partnerStreakError
          );

          streakMap[partner.id] = 0;
        }
      }

      setPartnerGoals(goalsMap);
      setPartnerStreaks(streakMap);
    } catch (err) {
      console.error(
        "Dashboard loading error:",
        err
      );

      setError(
        err.message ||
          "Unable to load dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // GOAL CALCULATIONS
  // =========================================================

  const totalGoals = goals.length;

  const completedGoals = goals.filter(
    (goal) => (goal.progress || 0) >= 100
  ).length;

  const averageProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce(
            (total, goal) =>
              total + (goal.progress || 0),
            0
          ) / goals.length
        )
      : 0;

  // =========================================================
  // TASK CALCULATIONS
  // =========================================================

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) => task.completed
  ).length;

  // =========================================================
  // PARTNER CALCULATIONS
  // =========================================================

  const getPartnerAverageProgress = (
    partnerId
  ) => {
    const goalsForPartner =
      partnerGoals[partnerId] || [];

    if (goalsForPartner.length === 0) {
      return 0;
    }

    return Math.round(
      goalsForPartner.reduce(
        (total, goal) =>
          total + (goal.progress || 0),
        0
      ) / goalsForPartner.length
    );
  };

  const getPartnerCompletedGoals = (
    partnerId
  ) => {
    const goalsForPartner =
      partnerGoals[partnerId] || [];

    return goalsForPartner.filter(
      (goal) => (goal.progress || 0) >= 100
    ).length;
  };

  // =========================================================
  // WEEKLY TASK DATA
  // =========================================================

  const getDateKey = (date) => {
    const d = new Date(date);

    if (Number.isNaN(d.getTime())) {
      return null;
    }

    return `${d.getFullYear()}-${String(
      d.getMonth() + 1
    ).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
  };

  const getLocalDateKey = (date) => {
    return `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${String(
      date.getDate()
    ).padStart(2, "0")}`;
  };

  const today = new Date();

  const weekDays = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);

    date.setDate(
      today.getDate() - i
    );

    weekDays.push(date);
  }

  const isTaskCompletedOnDate = (
    date
  ) => {
    const targetDate =
      getLocalDateKey(date);

    return tasks.some((task) => {
      if (!task.completed) {
        return false;
      }

      const completedDate =
        task.completed_at ||
        task.updated_at ||
        task.created_at;

      if (!completedDate) {
        return false;
      }

      return (
        getDateKey(completedDate) ===
        targetDate
      );
    });
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="dashboard-page">

        <aside className="sidebar">

          <div className="sidebar-logo">
             
            ◉ Saathi
          </div>

          <nav className="sidebar-nav">

            <Link
              to="/dashboard"
              className="active"
            >
              <span className="sidebar-nav-icon">
                🏠
              </span>
              Dashboard
            </Link>

            <Link to="/goals">
              <span className="sidebar-nav-icon">
                🎯
              </span>
              My Goals
            </Link>

            <Link to="/partners">
              <span className="sidebar-nav-icon">
                🤝
              </span>
              Partners
            </Link>

            <Link to="/profile">
              <span className="sidebar-nav-icon">
                👤
              </span>
              Profile
            </Link>

          </nav>

        </aside>

        <main className="dashboard-main">

          <div
            style={{
              padding: "40px",
              textAlign: "center",
            }}
          >
            Loading dashboard...
          </div>

        </main>

      </div>
    );
  }

  // =========================================================
  // MAIN DASHBOARD
  // =========================================================

  return (
    <div className="dashboard-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">

        <div className="sidebar-logo">
          ◉ Saathi
        </div>

        <nav className="sidebar-nav">

          <Link
            to="/dashboard"
            className="active"
          >
            <span className="sidebar-nav-icon">
              ⌂ 
            </span>
            Dashboard
          </Link>

          <Link to="/goals">
            <span className="sidebar-nav-icon">
              🎯
            </span>
            My Goals
          </Link>

          <Link to="/partners">
            <span className="sidebar-nav-icon">
              🤝
            </span>
            Partners
          </Link>

          <Link to="/profile">
            <span className="sidebar-nav-icon">
              👤
            </span>
            Profile
          </Link>

        </nav>

        <div className="sidebar-message">

          <span className="star">
            ✨
          </span>

          Stay consistent.
          <br />
          Your future self
          will thank you!

        </div>

        <div
          className="sidebar-logout"
          onClick={() => {
            localStorage.removeItem(
              "access_token"
            );

            window.location.href =
              "/login";
          }}
        >
          <span>
            ↪
          </span>

          Logout
        </div>

      </aside>

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="dashboard-main">

        {/* ===================================================
            HEADER
        =================================================== */}

        <header className="dashboard-header">

          <div>

            <div className="dashboard-date">
              {today.toLocaleDateString(
                "en-IN",
                {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                }
              )}
            </div>

            <h1>
<<<<<<< HEAD
              Good evening!
=======
              Good to see you,{" "}
              {user?.name || "there"}! 👋
>>>>>>> origin/main
            </h1>

            <p className="dashboard-subtitle">
              Stay consistent, stay accountable.
            </p>

          </div>

          <div className="dashboard-header-actions">

            <button
              className="notification-btn"
              type="button"
            >
              🔔
            </button>

            <Link
              to="/profile"
              style={{
                textDecoration: "none",
              }}
            >
              <div className="profile-circle">
                {user?.name
                  ? user.name
                      .charAt(0)
                      .toUpperCase()
                  : "U"}
              </div>
            </Link>

          </div>

        </header>

        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (
          <div
            style={{
              background: "#fff0e9",
              color: "#b44c32",
              padding: "12px 16px",
              borderRadius: "10px",
              marginBottom: "18px",
              fontSize: "13px",
            }}
          >
            {error}
          </div>
        )}

        {/* ===================================================
            TOP STAT CARDS
        =================================================== */}

        <section className="stats-grid">

          {/* Goals */}

          <div className="stat-card">

            <div className="stat-icon goal">
              🎯
            </div>

            <div>

              <div className="stat-label">
                Total Goals
              </div>

              <div className="stat-value">
                {totalGoals}
              </div>

            </div>

          </div>

          {/* Completed */}

          <div className="stat-card">

            <div className="stat-icon completed">
              ✓
            </div>

            <div>

              <div className="stat-label">
                Completed Goals
              </div>

              <div className="stat-value green">
                {completedGoals}
              </div>

            </div>

          </div>

          {/* Streak */}

          <div className="stat-card">

            <div className="stat-icon streak">
              🔥
            </div>

            <div>

              <div className="stat-label">
                Current Streak
              </div>

              <div className="stat-value orange">
                {myStreak}
              </div>

            </div>

          </div>

          {/* Progress */}

          <div className="stat-card">

            <div className="stat-icon progress">
              📈
            </div>

            <div>

              <div className="stat-label">
                Avg. Progress
              </div>

              <div className="stat-value purple">
                {averageProgress}%
              </div>

            </div>

          </div>

          {/* Partners */}

          <div className="stat-card">

            <div className="stat-icon focus">
              🤝
            </div>

            <div>

              <div className="stat-label">
                Partners
              </div>

              <div className="stat-value blue">
                {partners.length}
              </div>

            </div>

          </div>

        </section>

        {/* ===================================================
            UPPER SECTION
            MY GOALS | MY PARTNERS
        =================================================== */}

        <section className="dashboard-upper">

          {/* =================================================
              MY GOALS
          ================================================= */}

          <div className="dashboard-card goals-card">

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

            {goals.length === 0 ? (

              <div
                style={{
                  padding: "25px 20px",
                  textAlign: "center",
                  color: "#81736c",
                  fontSize: "13px",
                }}
              >
                No goals created yet.
              </div>

            ) : (

              goals
                .slice(0, 4)
                .map((goal, index) => {

                  const iconClasses = [
                    "purple",
                    "orange",
                    "green",
                  ];

                  const icons = [
                    "📚",
                    "💪",
                    "🎯",
                  ];

                  const iconClass =
                    iconClasses[
                      index %
                        iconClasses.length
                    ];

                  const icon =
                    icons[
                      index %
                        icons.length
                    ];

                  const progress =
                    goal.progress || 0;

                  return (
                    <div
                      className="goal-item"
                      key={goal.id}
                    >

                      <div className="goal-top">

                        <div
                          className={`goal-icon ${iconClass}`}
                        >
                          {icon}
                        </div>

                        <div className="goal-info">

                          <div className="goal-name">
                            {goal.title}
                          </div>

                          <div className="goal-description">
                            {goal.description ||
                              goal.category ||
                              "Personal goal"}
                          </div>

                        </div>

                        <div className="goal-percentage">
                          {progress}%
                        </div>

                      </div>

                      <div className="progress-bar">

                        <div
                          className={
                            `progress-fill ${
                              progress >= 100
                                ? "green"
                                : ""
                            }`
                          }
                          style={{
                            width: `${Math.min(
                              progress,
                              100
                            )}%`,
                          }}
                        />

                      </div>

                      <div className="progress-info">

                        <span>
                          {progress >= 100
                            ? "Completed"
                            : "In progress"}
                        </span>

                        {goal.deadline && (
                          <span>
                            Due:{" "}
                            {goal.deadline}
                          </span>
                        )}

                      </div>

                    </div>
                  );
                })

            )}

            <div className="create-goal-container">

              <Link
                to="/create-goal"
                className="create-goal-btn"
              >
                + Create New Goal
              </Link>

            </div>

          </div>

          {/* =================================================
              MULTIPLE PARTNERS
          ================================================= */}

          <div className="partner-column">

            {partners.length === 0 ? (

              <div className="dashboard-card partner-card">

                <div className="card-header">

                  <div className="card-title">
                    My Partners
                  </div>

                  <Link
                    to="/partners"
                    className="card-view"
                  >
                    Find →
                  </Link>

                </div>

                <div className="partner-content">

                  <div
                    style={{
                      textAlign: "center",
                      padding: "15px 5px",
                      color: "#81736c",
                      fontSize: "13px",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "30px",
                        marginBottom: "8px",
                      }}
                    >
                      🤝
                    </div>

                    You don't have any
                    connected partners yet.

                    <div
                      style={{
                        marginTop: "12px",
                      }}
                    >
                      <Link
                        to="/partners"
                        style={{
                          color: "#ff6333",
                          fontWeight: "600",
                          textDecoration:
                            "none",
                        }}
                      >
                        Find a partner →
                      </Link>
                    </div>

                  </div>

                </div>

              </div>

            ) : (

              partners.map((partner) => {

                const goalsForPartner =
                  partnerGoals[
                    partner.id
                  ] || [];

                const partnerAverageProgress =
                  getPartnerAverageProgress(
                    partner.id
                  );

                const partnerCompletedGoals =
                  getPartnerCompletedGoals(
                    partner.id
                  );

                const partnerStreak =
                  partnerStreaks[
                    partner.id
                  ] || 0;

                return (

                  <div
                    className="dashboard-card partner-card"
                    key={
                      partner.partnership_id ||
                      partner.id
                    }
                  >

                    <div className="card-header">

                      <div className="card-title">
                        My Partner
                      </div>

                      <Link
                        to="/partners"
                        className="card-view"
                      >
                        View →
                      </Link>

                    </div>

                    <div className="partner-content">

                      {/* PARTNER PROFILE */}

                      <div className="partner-profile">

                        <div className="partner-avatar">

                          {partner.name
                            ? partner.name
                                .charAt(0)
                                .toUpperCase()
                            : "P"}

                        </div>

                        <div className="partner-info">

                          <div className="partner-name">
                            {partner.name ||
                              "Partner"}
                          </div>

                          <div className="partner-role">
                            Accountability Partner
                          </div>

                        </div>

                        <div className="partner-online">

                          <span className="online-dot" />

                          Connected

                        </div>

                      </div>

                      {/* LINKED GOAL */}

                      <div className="partner-message">

                        🎯{" "}
                        <strong>
                          {partner.goal_title ||
                            "Accountability Goal"}
                        </strong>

                      </div>

                      {/* PARTNER PROGRESS */}

                      <div className="partner-progress">

                        <div className="partner-progress-header">

                          <span>
                            Goal Progress
                          </span>

                          <strong>
                            {
                              partnerAverageProgress
                            }%
                          </strong>

                        </div>

                        <div className="progress-bar">

                          <div
                            className={
                              `progress-fill ${
                                partnerAverageProgress >=
                                100
                                  ? "green"
                                  : ""
                              }`
                            }
                            style={{
                              width: `${Math.min(
                                partnerAverageProgress,
                                100
                              )}%`,
                            }}
                          />

                        </div>

                      </div>

                      {/* PARTNER STATS */}

                      <div
                        style={{
                          display: "flex",
                          justifyContent:
                            "space-between",
                          gap: "8px",
                          marginTop: "15px",
                          fontSize: "11px",
                          color: "#766963",
                        }}
                      >

                        <span>
                          ✓{" "}
                          {
                            partnerCompletedGoals
                          }{" "}
                          completed
                        </span>

                        <span>
                          🔥{" "}
                          {partnerStreak}{" "}
                          day streak
                        </span>

                      </div>

                      {/* PARTNER GOALS */}

                      {goalsForPartner.length >
                        0 && (

                        <div
                          style={{
                            marginTop: "14px",
                            paddingTop: "12px",
                            borderTop:
                              "1px solid #f3e8e3",
                          }}
                        >

                          <div
                            style={{
                              fontSize: "11px",
                              color: "#766963",
                              marginBottom:
                                "8px",
                              fontWeight:
                                "600",
                            }}
                          >
                            PARTNER'S GOALS
                          </div>

                          {goalsForPartner
                            .slice(0, 2)
                            .map((goal) => (

                              <div
                                key={goal.id}
                                style={{
                                  display:
                                    "flex",
                                  justifyContent:
                                    "space-between",
                                  alignItems:
                                    "center",
                                  gap: "10px",
                                  marginBottom:
                                    "7px",
                                  fontSize:
                                    "12px",
                                  color:
                                    "#4d3932",
                                }}
                              >

                                <span
                                  style={{
                                    overflow:
                                      "hidden",
                                    textOverflow:
                                      "ellipsis",
                                    whiteSpace:
                                      "nowrap",
                                  }}
                                >
                                  {goal.title}
                                </span>

                                <strong
                                  style={{
                                    color:
                                      "#ff6333",
                                    flexShrink:
                                      0,
                                  }}
                                >
                                  {goal.progress ||
                                    0}
                                  %
                                </strong>

                              </div>

                            ))}

                        </div>

                      )}

                    </div>

                  </div>

                );
              })

            )}

          </div>

        </section>

        {/* ===================================================
            WEEKLY OVERVIEW
        =================================================== */}

        <section className="dashboard-card weekly-card">

          <div className="card-header">

            <div className="card-title">
              Weekly Overview
            </div>

            <span className="card-view">
              Last 7 days
            </span>

          </div>

          <div className="weekly-content">

            <div className="week-days">

              {weekDays.map((date) => {

                const isToday =
                  getLocalDateKey(date) ===
                  getLocalDateKey(today);

                const completed =
                  isTaskCompletedOnDate(
                    date
                  );

                const dayName =
                  date.toLocaleDateString(
                    "en-IN",
                    {
                      weekday: "short",
                    }
                  );

                return (

                  <div
                    key={getLocalDateKey(
                      date
                    )}
                  >

                    <div className="week-day">
                      {dayName}
                    </div>

                    <div
                      className={
                        `week-status ${
                          completed
                            ? "done"
                            : isToday
                            ? "today"
                            : "empty"
                        }`
                      }
                    >
                      {completed
                        ? "✓"
                        : isToday
                        ? "•"
                        : ""}
                    </div>

                    {isToday && (
                      <div className="today-label">
                        Today
                      </div>
                    )}

                  </div>

                );
              })}

            </div>

          </div>

        </section>

        {/* ===================================================
            LOWER SECTION
            TODAY'S TASKS | CURRENT STREAK
        =================================================== */}

        <section className="dashboard-lower">

          {/* =================================================
              TODAY'S TASKS
          ================================================= */}

          <div className="dashboard-card tasks-card">

            <div className="card-header">

              <div className="card-title">
                Today's Tasks
              </div>

              <Link
                to="/goals"
                className="card-view"
              >
                View goals →
              </Link>

            </div>

            {tasks.length === 0 ? (

              <div
                style={{
                  padding: "25px 20px",
                  textAlign: "center",
                  color: "#81736c",
                  fontSize: "13px",
                }}
              >
                No tasks available.
              </div>

            ) : (

              tasks
                .slice(0, 5)
                .map((task) => {

                  const taskGoal =
                    goals.find(
                      (goal) =>
                        Number(goal.id) ===
                        Number(task.goal_id)
                    );

                  return (

                    <div
                      className="task-row"
                      key={task.id}
                    >

                      <div
                        className={
                          `task-check ${
                            task.completed
                              ? "completed"
                              : ""
                          }`
                        }
                      >
                        {task.completed
                          ? "✓"
                          : ""}
                      </div>

                      <div className="task-info">

                        <div className="task-name">
                          {task.title}
                        </div>

                        <div className="task-category">

                          {taskGoal
                            ? taskGoal.title
                            : "Goal task"}

                        </div>

                      </div>

                      <div
                        className={
                          `task-status ${
                            task.completed
                              ? "completed"
                              : "pending"
                          }`
                        }
                      >
                        {task.completed
                          ? "Completed"
                          : "Pending"}
                      </div>

                    </div>

                  );
                })

            )}

          </div>

          {/* =================================================
              CURRENT STREAK
          ================================================= */}

          <div className="dashboard-card streak-card">

            <div className="card-header">

              <div className="card-title">
                Current Streak
              </div>

            </div>

            <div className="streak-content">

              <div>

                <div className="streak-title">
                  Keep it going! 🔥
                </div>

                <div className="streak-description">
                  You're building a great
                  habit. Keep completing
                  your tasks every day.
                </div>

              </div>

              <div className="streak-ring">

                <div className="streak-number">

                  {myStreak}

                  <span>
                    days
                  </span>

                </div>

              </div>

            </div>

          </div>

        </section>

        {/* ===================================================
            MOTIVATIONAL BANNER
        =================================================== */}

        <div className="motivation-banner">

          <div className="motivation-icon">
            💪
          </div>

          <div className="motivation-text">

            Small progress is still progress.
            Keep showing up for yourself and
            your accountability partners!

          </div>

        </div>

      </main>

    </div>
  );
}

export default Dashboard;
