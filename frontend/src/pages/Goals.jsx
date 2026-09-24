import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import "./Goals.css";

function Goals() {
  const navigate = useNavigate();

  const [goals, setGoals] = useState([]);
  const [tasks, setTasks] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // FETCH GOALS + TASKS
  // =========================================================

  useEffect(() => {
    const fetchGoalsAndTasks = async () => {
      const token = localStorage.getItem("access_token");

      if (!token) {
        navigate("/login");
        return;
      }

      try {
        // Fetch goals
        const goalsResponse = await fetch(
          "http://127.0.0.1:8000/goals/",
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const goalsData = await goalsResponse.json();

        if (!goalsResponse.ok) {
          throw new Error(
            goalsData.detail || "Failed to fetch goals"
          );
        }

        setGoals(goalsData);

        // Fetch tasks for every goal
        const taskResults = await Promise.all(
          goalsData.map(async (goal) => {
            const response = await fetch(
              `http://127.0.0.1:8000/tasks/${goal.id}`,
              {
                method: "GET",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            const data = await response.json();

            if (!response.ok) {
              throw new Error(
                data.detail || "Failed to fetch tasks"
              );
            }

            return {
              goalId: goal.id,
              tasks: data,
            };
          })
        );

        const taskMap = {};

        taskResults.forEach((result) => {
          taskMap[result.goalId] = result.tasks;
        });

        setTasks(taskMap);

      } catch (err) {
        console.error(
          "Error fetching goals/tasks:",
          err
        );

        if (err.message === "Failed to fetch") {
          setError(
            "Unable to connect to the server. Please make sure FastAPI is running."
          );
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchGoalsAndTasks();
  }, [navigate]);


  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };


  // =========================================================
  // EDIT GOAL
  // =========================================================

  const handleEdit = (goal) => {
    navigate("/edit-goal", {
      state: {
        goal: goal,
      },
    });
  };


  // =========================================================
  // DELETE GOAL
  // =========================================================

  const handleDelete = async (goalId) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this goal?"
    );

    if (!confirmDelete) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/goals/${goalId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to delete goal"
        );
      }

      setGoals((currentGoals) =>
        currentGoals.filter(
          (goal) => goal.id !== goalId
        )
      );

      setTasks((currentTasks) => {
        const updatedTasks = {
          ...currentTasks,
        };

        delete updatedTasks[goalId];

        return updatedTasks;
      });

    } catch (err) {
      console.error("Delete goal error:", err);
      setError(err.message);
    }
  };


  // =========================================================
  // UPDATE PROGRESS
  // =========================================================

  const handleProgressUpdate = async (goal) => {
    const newProgress = window.prompt(
      "Enter progress (0 - 100):",
      goal.progress || 0
    );

    if (newProgress === null) {
      return;
    }

    const progress = Number(newProgress);

    if (
      Number.isNaN(progress) ||
      progress < 0 ||
      progress > 100
    ) {
      alert("Please enter a number between 0 and 100.");
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/goals/${goal.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            title: goal.title,
            description: goal.description,
            category: goal.category,
            progress: progress,
            deadline: goal.deadline,
            tasks: goal.tasks,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update progress"
        );
      }

      setGoals((currentGoals) =>
        currentGoals.map((currentGoal) =>
          currentGoal.id === goal.id
            ? data
            : currentGoal
        )
      );

    } catch (err) {
      console.error(
        "Progress update error:",
        err
      );

      setError(err.message);
    }
  };


  // =========================================================
  // ADD TASK
  // =========================================================

  const handleAddTask = async (goalId) => {
    const title = window.prompt(
      "Enter task name:"
    );

    if (!title || !title.trim()) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/tasks/${goalId}?title=${encodeURIComponent(
          title.trim()
        )}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to add task"
        );
      }

      setTasks((currentTasks) => ({
        ...currentTasks,
        [goalId]: [
          ...(currentTasks[goalId] || []),
          data,
        ],
      }));

    } catch (err) {
      console.error("Add task error:", err);
      setError(err.message);
    }
  };


  // =========================================================
  // TOGGLE TASK
  // =========================================================

  const handleToggleTask = async (
    goalId,
    task
  ) => {
    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const newCompleted =
        !task.completed;

      const response = await fetch(
        `http://127.0.0.1:8000/tasks/${task.id}?completed=${newCompleted}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update task"
        );
      }

      setTasks((currentTasks) => ({
        ...currentTasks,
        [goalId]: (
          currentTasks[goalId] || []
        ).map((currentTask) =>
          currentTask.id === task.id
            ? data
            : currentTask
        ),
      }));

    } catch (err) {
      console.error(
        "Update task error:",
        err
      );

      setError(err.message);
    }
  };


  // =========================================================
  // DELETE TASK
  // =========================================================

  const handleDeleteTask = async (
    goalId,
    taskId
  ) => {
    const confirmDelete = window.confirm(
      "Delete this task?"
    );

    if (!confirmDelete) {
      return;
    }

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `http://127.0.0.1:8000/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to delete task"
        );
      }

      setTasks((currentTasks) => ({
        ...currentTasks,
        [goalId]: (
          currentTasks[goalId] || []
        ).filter(
          (task) => task.id !== taskId
        ),
      }));

    } catch (err) {
      console.error(
        "Delete task error:",
        err
      );

      setError(err.message);
    }
  };


  // =========================================================
  // SUMMARY CALCULATIONS
  // =========================================================

  const activeGoals = goals.length;

  const overallProgress =
    goals.length > 0
      ? Math.round(
          goals.reduce(
            (total, goal) =>
              total + (goal.progress || 0),
            0
          ) / goals.length
        )
      : 0;

  const allTasks = Object.values(tasks).flat();

  const completedTasks = allTasks.filter(
    (task) => task.completed
  ).length;


  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="goals-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="goals-sidebar">

        <Link
          to="/"
          className="goals-logo"
        >
          <span>◉</span>
          Saathi
        </Link>


        <nav className="goals-nav">

          <Link to="/dashboard">
            <span>⌂</span>
            Dashboard
          </Link>


          <Link
            to="/goals"
            className="active"
          >
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


        <button
          className="goals-logout"
          onClick={handleLogout}
        >
          ↪ Logout
        </button>

      </aside>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="goals-main">

        {/* HEADER */}

        <header className="goals-header">

          <div>

            <p>YOUR JOURNEY</p>

            <h1>My Goals</h1>

            <span>
              Stay focused, stay consistent and keep moving forward.
            </span>

          </div>


          <Link
            to="/create-goal"
            className="create-goal-button"
          >
            + Create Goal
          </Link>

        </header>


        {/* ===================================================
            SUMMARY
        =================================================== */}

        <div className="goal-summary">

          <div>
            <strong>
              {activeGoals}
            </strong>

            <span>
              Active Goals
            </span>
          </div>


          <div>
            <strong>
              {completedTasks}
            </strong>

            <span>
              Completed Tasks
            </span>
          </div>


          <div>
            <strong>
              {overallProgress}%
            </strong>

            <span>
              Overall Progress
            </span>
          </div>


          <div>
            <strong>
              0 🔥
            </strong>

            <span>
              Day Streak
            </span>
          </div>

        </div>


        {/* ===================================================
            GOALS LIST
        =================================================== */}

        <section className="goals-list">

          {/* LOADING */}

          {loading && (
            <div className="goals-message">
              Loading your goals...
            </div>
          )}


          {/* ERROR */}

          {!loading && error && (
            <div className="goals-message goals-error">
              {error}
            </div>
          )}


          {/* NO GOALS */}

          {!loading &&
            !error &&
            goals.length === 0 && (

              <div className="goals-message">

                <h2>
                  No goals yet 🎯
                </h2>

                <p>
                  Create your first goal and start your journey.
                </p>

                <Link
                  to="/create-goal"
                  className="create-goal-button"
                >
                  + Create Goal
                </Link>

              </div>

            )}


          {/* =================================================
              REAL GOALS
          ================================================= */}

          {!loading &&
            !error &&
            goals.map((goal) => {

              const goalTasks =
                tasks[goal.id] || [];

              return (

                <div
                  className="goal-card"
                  key={goal.id}
                >

                  {/* GOAL ICON */}

                  <div className="goal-icon">
                    🎯
                  </div>


                  <div className="goal-content">

                    {/* TOP SECTION */}

                    <div className="goal-card-top">

                      <div>

                        <span className="goal-category">
                          {goal.category || "Other"}
                        </span>


                        <h2>
                          {goal.title}
                        </h2>


                        <p>
                          {goal.description ||
                            "No description provided."}
                        </p>

                      </div>


                      <strong className="goal-percentage">
                        {goal.progress || 0}%
                      </strong>

                    </div>


                    {/* PROGRESS BAR */}

                    <div className="goal-bar">

                      <div
                        style={{
                          width: `${goal.progress || 0}%`,
                        }}
                      ></div>

                    </div>


                    {/* =================================================
                        TASKS
                    ================================================= */}

                    <div className="goal-tasks">

                      <div className="tasks-header">

                        <h3>
                          Tasks
                        </h3>

                        <button
                          className="add-task-button"
                          onClick={() =>
                            handleAddTask(goal.id)
                          }
                        >
                          + Add Task
                        </button>

                      </div>


                      {goalTasks.length === 0 ? (

                        <p className="no-tasks">
                          No tasks yet. Add your first task.
                        </p>

                      ) : (

                        <div className="task-list">

                          {goalTasks.map((task) => (

                            <div
                              className="task-item"
                              key={task.id}
                            >

                              <label>

                                <input
                                  type="checkbox"
                                  checked={task.completed}
                                  onChange={() =>
                                    handleToggleTask(
                                      goal.id,
                                      task
                                    )
                                  }
                                />

                                <span
                                  className={
                                    task.completed
                                      ? "task-completed"
                                      : ""
                                  }
                                >
                                  {task.title}
                                </span>

                              </label>


                              <button
                                className="delete-task-button"
                                onClick={() =>
                                  handleDeleteTask(
                                    goal.id,
                                    task.id
                                  )
                                }
                              >
                                🗑
                              </button>

                            </div>

                          ))}

                        </div>

                      )}

                    </div>


                    {/* DETAILS + ACTIONS */}

                    <div className="goal-details">

                      <div className="goal-info">

                        <span>
                          ✓ {goal.tasks || "No target"}
                        </span>


                        <span>
                          📅 Due{" "}
                          {goal.deadline || "No deadline"}
                        </span>

                      </div>


                      <div className="goal-actions">

                        {/* EDIT */}

                        <button
                          className="edit-goal-button"
                          onClick={() =>
                            handleEdit(goal)
                          }
                        >
                          ✏️ Edit
                        </button>


                        {/* PROGRESS */}

                        <button
                          className="progress-goal-button"
                          onClick={() =>
                            handleProgressUpdate(goal)
                          }
                        >
                          📊 Progress
                        </button>


                        {/* DELETE */}

                        <button
                          className="delete-goal-button"
                          onClick={() =>
                            handleDelete(goal.id)
                          }
                        >
                          🗑 Delete
                        </button>

                      </div>

                    </div>

                  </div>

                </div>

              );

            })}

        </section>

      </main>

    </div>
  );
}

export default Goals;