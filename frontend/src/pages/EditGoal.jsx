import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./CreateGoal.css";

const API_URL = "http://127.0.0.1:8000";

function EditGoal() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [goal, setGoal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [targetDate, setTargetDate] = useState("");

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        setLoading(true);

        const token = localStorage.getItem("access_token");

        if (!token) {
          setError("Please login again.");
          setLoading(false);
          return;
        }

        const response = await fetch(`${API_URL}/goals/${id}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));

          console.error("Get goal error:", errorData);

          setError(errorData.detail || "Goal not found");
          setLoading(false);
          return;
        }

        const data = await response.json();

        console.log("Goal received:", data);

        setGoal(data);

        setTitle(data.title || "");
        setDescription(data.description || "");
        setCategory(data.category || "");
        setTargetDate(
          data.target_date
            ? data.target_date.substring(0, 10)
            : ""
        );

        setLoading(false);
      } catch (err) {
        console.error("Fetch goal error:", err);
        setError("Unable to load goal.");
        setLoading(false);
      }
    };

    if (id) {
      fetchGoal();
    } else {
      setError("Goal ID is missing.");
      setLoading(false);
    }
  }, [id]);

  const handleUpdate = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("access_token");

      const response = await fetch(`${API_URL}/goals/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          category,
          target_date: targetDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("Update error:", data);
        alert(data.detail || "Failed to update goal");
        return;
      }

      alert("Goal updated successfully!");

      navigate("/goals");
    } catch (err) {
      console.error("Update goal error:", err);
      alert("Something went wrong while updating the goal.");
    }
  };

  if (loading) {
    return (
      <div className="edit-goal-page">
        <h2>Loading goal...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className="edit-goal-page">
        <h2>Goal not found</h2>
        <p>{error}</p>

        <button onClick={() => navigate("/goals")}>
          ← Back to Goals
        </button>
      </div>
    );
  }

  return (
    <div className="edit-goal-page">
      <div className="edit-goal-container">
        <h1>Edit Goal</h1>

        <form onSubmit={handleUpdate}>
          <div className="form-group">
            <label>Goal Title</label>

            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Description</label>

            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Category</label>

            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label>Target Date</label>

            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
            />
          </div>

          <button type="submit">
            Update Goal
          </button>

          <button
            type="button"
            onClick={() => navigate("/goals")}
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditGoal;