import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import "./CreateGoal.css";

function CreateGoal() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category: "Study",
    priority: "Medium",
    deadline: "",
    targetAmount: "",
    targetUnit: "Tasks",
    partner: "No partner",
  });

  // Dynamic milestone items
  const [milestones, setMilestones] = useState([
    "Review basics",
    "Complete practice set",
  ]);
  const [newMilestone, setNewMilestone] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const categories = [
    { label: "Study", icon: "📚" },
    { label: "Career", icon: "💼" },
    { label: "Project", icon: "💻" },
    { label: "Health", icon: "🏃" },
    { label: "Personal", icon: "🌱" },
    { label: "Other", icon: "✨" },
  ];

  const priorities = ["Low", "Medium", "High"];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleAddMilestone = (e) => {
    e.preventDefault();
    if (!newMilestone.trim()) return;
    setMilestones([...milestones, newMilestone.trim()]);
    setNewMilestone("");
  };

  const handleRemoveMilestone = (indexToRemove) => {
    setMilestones(milestones.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("access_token");
    if (!token) {
      navigate("/login");
      return;
    }

    setError("");
    setLoading(true);

    // Keep tasks strictly under 100 chars so PostgreSQL VARCHAR(100) does not crash
    let safeTasksString = "";
    if (formData.targetAmount) {
      safeTasksString = `${formData.targetAmount} ${formData.targetUnit}`;
    }
    if (milestones.length > 0) {
      const msList = milestones.join(", ");
      safeTasksString = safeTasksString ? `${safeTasksString} - ${msList}` : msList;
    }
    if (safeTasksString.length > 95) {
      safeTasksString = safeTasksString.substring(0, 92) + "...";
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/goals/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          category: formData.category,
          progress: 0,
          deadline: formData.deadline,
          tasks: safeTasksString || "No tasks set",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to create goal");
      }

      alert("Goal created successfully!");
      navigate("/goals");
    } catch (err) {
      console.error("Create goal error:", err);
      if (err.message === "Failed to fetch") {
        setError("Unable to connect to the server. Please make sure FastAPI is running.");
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="create-goal-page">
      {/* SIDEBAR */}
      <aside className="create-sidebar">
        <Link to="/" className="create-logo">
          <span>◉</span>
          Saathi
        </Link>
        <nav>
          <Link to="/dashboard">⌂ Dashboard</Link>
          <Link to="/goals" className="active">🎯 My Goals</Link>
          <Link to="/partners">🤝 My Partner</Link>
          <Link to="/profile">👤 Profile</Link>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="create-main">
        <Link to="/goals" className="back-link">
          ← Back to Goals
        </Link>

        <div className="create-heading">
          <p>NEW GOAL</p>
          <h1>Create a Goal</h1>
          <span>Break down your ambitious objectives into trackable milestones.</span>
        </div>

        <form className="create-goal-form" onSubmit={handleSubmit}>
          {error && <div className="create-goal-error">{error}</div>}

          {/* 1. OVERVIEW */}
          <div className="form-card">
            <h3 className="section-title">1. Goal Overview</h3>

            <div className="form-group">
              <label htmlFor="title">Goal Name</label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="e.g. Complete DSA practice"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="description">Why this goal matters</label>
              <textarea
                id="description"
                name="description"
                placeholder="Explain the motivation and definition of done..."
                rows="3"
                value={formData.description}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label>Select Category</label>
              <div className="chips-container">
                {categories.map((cat) => (
                  <button
                    type="button"
                    key={cat.label}
                    className={`category-chip ${formData.category === cat.label ? "selected" : ""}`}
                    onClick={() => setFormData({ ...formData, category: cat.label })}
                  >
                    <span>{cat.icon}</span> {cat.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. TIMELINE & TARGET */}
          <div className="form-card">
            <h3 className="section-title">2. Planning & Target</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="deadline">Target Deadline</label>
                <input
                  type="date"
                  id="deadline"
                  name="deadline"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Priority Level</label>
                <div className="priority-pill-group">
                  {priorities.map((lvl) => (
                    <button
                      type="button"
                      key={lvl}
                      className={`priority-pill ${lvl.toLowerCase()} ${
                        formData.priority === lvl ? "active" : ""
                      }`}
                      onClick={() => setFormData({ ...formData, priority: lvl })}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label>Measurable Target</label>
              <div className="target-input-row">
                <input
                  type="number"
                  name="targetAmount"
                  placeholder="e.g. 20"
                  value={formData.targetAmount}
                  onChange={handleChange}
                  min="1"
                />
                <select
                  name="targetUnit"
                  value={formData.targetUnit}
                  onChange={handleChange}
                >
                  <option value="Tasks">Tasks</option>
                  <option value="Problems">Problems</option>
                  <option value="Hours">Hours</option>
                  <option value="Chapters">Chapters</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. MILESTONES */}
          <div className="form-card">
            <h3 className="section-title">3. Actionable Milestones</h3>
            <p className="section-desc">Add concrete micro-steps to stay on course.</p>

            <div className="milestone-add-row">
              <input
                type="text"
                placeholder="Add sub-task or milestone..."
                value={newMilestone}
                onChange={(e) => setNewMilestone(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddMilestone(e);
                  }
                }}
              />
              <button
                type="button"
                className="add-milestone-btn"
                onClick={handleAddMilestone}
              >
                + Add Step
              </button>
            </div>

            <ul className="milestone-list">
              {milestones.map((item, index) => (
                <li key={index} className="milestone-item">
                  <span className="milestone-bullet">✓</span>
                  <span className="milestone-text">{item}</span>
                  <button
                    type="button"
                    className="delete-milestone-btn"
                    onClick={() => handleRemoveMilestone(index)}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. ACCOUNTABILITY */}
          <div className="form-card">
            <h3 className="section-title">4. Accountability</h3>
            <div className="form-group">
              <label htmlFor="partner">Assigned Accountability Partner</label>
              <select
                id="partner"
                name="partner"
                value={formData.partner}
                onChange={handleChange}
              >
                <option value="No partner">No partner (Solo)</option>
                <option value="Alex Johnson">Alex Johnson</option>
              </select>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="form-actions">
            <Link to="/goals" className="cancel-button">
              Cancel
            </Link>
            <button
              type="submit"
              className="save-goal-button"
              disabled={loading}
            >
              {loading ? "Creating Goal..." : "Create Goal →"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default CreateGoal;