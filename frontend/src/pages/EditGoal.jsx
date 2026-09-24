import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./CreateGoal.css";

function EditGoal() {
  const navigate = useNavigate();
  const location = useLocation();

  const goal = location.state?.goal;

  // If someone opens /edit-goal directly
  // without selecting a goal first
  if (!goal) {
    return (
      <div className="create-goal-page">
        <main className="create-main">
          <h1>Goal not found</h1>

          <Link to="/goals" className="back-link">
            ← Back to Goals
          </Link>
        </main>
      </div>
    );
  }

  const [formData, setFormData] = useState({
    title: goal.title || "",
    description: goal.description || "",
    category: goal.category || "",
    deadline: goal.deadline || "",
    tasks: goal.tasks || "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // =========================================================
  // HANDLE INPUT
  // =========================================================

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  // =========================================================
  // UPDATE GOAL
  // =========================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("access_token");

    if (!token) {
      navigate("/login");
      return;
    }

    setError("");
    setLoading(true);

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
            title: formData.title,
            description: formData.description,
            category: formData.category,
            progress: goal.progress || 0,
            deadline: formData.deadline,
            tasks: formData.tasks,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to update goal"
        );
      }

      alert("Goal updated successfully!");

      navigate("/goals");

    } catch (err) {
      console.error("Update goal error:", err);

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

  return (
    <div className="create-goal-page">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="create-sidebar">

        <Link to="/" className="create-logo">
          <span>◉</span>
          Saathi
        </Link>

        <nav>

          <Link to="/dashboard">
            ⌂ Dashboard
          </Link>

          <Link to="/goals" className="active">
            🎯 My Goals
          </Link>

          <Link to="/partners">
            🤝 My Partner
          </Link>

          <Link to="/profile">
            👤 Profile
          </Link>

        </nav>

      </aside>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="create-main">

        <Link to="/goals" className="back-link">
          ← Back to Goals
        </Link>


        <div className="create-heading">

          <p>UPDATE GOAL</p>

          <h1>Edit Goal</h1>

          <span>
            Update your goal and keep moving forward.
          </span>

        </div>


        <form
          className="create-goal-form"
          onSubmit={handleSubmit}
        >

          {/* GOAL NAME */}

          <div className="form-group">

            <label htmlFor="title">
              Goal Name
            </label>

            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
            />

          </div>


          {/* DESCRIPTION */}

          <div className="form-group">

            <label htmlFor="description">
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              required
            ></textarea>

          </div>


          {/* CATEGORY + DEADLINE */}

          <div className="form-row">

            <div className="form-group">

              <label htmlFor="category">
                Category
              </label>

              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
              >

                <option value="">
                  Select category
                </option>

                <option value="Study">
                  Study
                </option>

                <option value="Career">
                  Career
                </option>

                <option value="Project">
                  Project
                </option>

                <option value="Health">
                  Health
                </option>

                <option value="Personal">
                  Personal
                </option>

                <option value="Other">
                  Other
                </option>

              </select>

            </div>


            <div className="form-group">

              <label htmlFor="deadline">
                Deadline
              </label>

              <input
                type="date"
                id="deadline"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                required
              />

            </div>

          </div>


          {/* TARGET */}

          <div className="form-group">

            <label htmlFor="tasks">
              Target
            </label>

            <input
              type="text"
              id="tasks"
              name="tasks"
              value={formData.tasks}
              onChange={handleChange}
              required
            />

          </div>


          {/* ERROR */}

          {error && (
            <p className="create-goal-error">
              {error}
            </p>
          )}


          {/* BUTTONS */}

          <div className="form-actions">

            <Link
              to="/goals"
              className="cancel-button"
            >
              Cancel
            </Link>


            <button
              type="submit"
              className="save-goal-button"
              disabled={loading}
            >
              {loading
                ? "Updating..."
                : "Update Goal →"}
            </button>

          </div>

        </form>

      </main>

    </div>
  );
}

export default EditGoal;