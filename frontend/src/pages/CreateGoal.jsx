import { Link } from "react-router-dom";
import "./CreateGoal.css";

function CreateGoal() {
  const handleSubmit = (e) => {
    e.preventDefault();

    alert("Goal created successfully!");
  };

  return (
    <div className="create-goal-page">

      <aside className="create-sidebar">

        <Link to="/" className="create-logo">
          <span>◉</span>
          Saathi
        </Link>

        <nav>
          <Link to="/dashboard">⌂ Dashboard</Link>
          <Link to="/goals" className="active">
            🎯 My Goals
          </Link>
          <Link to="/partners">🤝 My Partner</Link>
          <Link to="/profile">👤 Profile</Link>
        </nav>

      </aside>


      <main className="create-main">

        <Link to="/goals" className="back-link">
          ← Back to Goals
        </Link>


        <div className="create-heading">
          <p>NEW GOAL</p>
          <h1>Create a Goal</h1>
          <span>
            Set a goal and make yourself accountable.
          </span>
        </div>


        <form
          className="create-goal-form"
          onSubmit={handleSubmit}
        >

          <div className="form-group">

            <label>Goal Name</label>

            <input
              type="text"
              placeholder="Example: Complete DSA practice"
              required
            />

          </div>


          <div className="form-group">

            <label>Description</label>

            <textarea
              placeholder="What do you want to accomplish?"
              rows="4"
              required
            ></textarea>

          </div>


          <div className="form-row">

            <div className="form-group">

              <label>Category</label>

              <select required>

                <option value="">
                  Select category
                </option>

                <option>Study</option>
                <option>Career</option>
                <option>Project</option>
                <option>Health</option>
                <option>Personal</option>
                <option>Other</option>

              </select>

            </div>


            <div className="form-group">

              <label>Deadline</label>

              <input
                type="date"
                required
              />

            </div>

          </div>


          <div className="form-group">

            <label>Target</label>

            <input
              type="text"
              placeholder="Example: Solve 20 problems"
              required
            />

          </div>


          <div className="form-group">

            <label>Accountability Partner</label>

            <select>

              <option>
                Alex Johnson
              </option>

              <option>
                No partner
              </option>

            </select>

          </div>


          <div className="form-actions">

            <Link to="/goals" className="cancel-button">
              Cancel
            </Link>

            <button
              type="submit"
              className="save-goal-button"
            >
              Create Goal →
            </button>

          </div>

        </form>

      </main>

    </div>
  );
}

export default CreateGoal;