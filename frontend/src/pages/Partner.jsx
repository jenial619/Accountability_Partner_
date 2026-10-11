import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Partner.css";

const API_URL = "http://127.0.0.1:8000";

function Partner() {
  const navigate = useNavigate();

  const [partners, setPartners] = useState([]);
  const [myGoals, setMyGoals] = useState([]);
  const [partnerRequests, setPartnerRequests] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [partnerUserId, setPartnerUserId] = useState("");
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [partnerGoals, setPartnerGoals] = useState([]);
  const [partnerStreaks, setPartnerStreaks] = useState({});
  const [messages, setMessages] = useState([]);
  const [messageText, setMessageText] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [pageError, setPageError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  const token = () => localStorage.getItem("access_token");

  const request = useCallback(async (path, options = {}) => {
    const accessToken = token();

    if (!accessToken) {
      navigate("/login");
      throw new Error("Please log in to continue.");
    }

    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json().catch(() => null);

    if (response.status === 401) {
      localStorage.removeItem("access_token");
      navigate("/login");
      throw new Error("Your session expired. Please log in again.");
    }

    if (!response.ok) {
      throw new Error(
        data?.detail || "The request could not be completed."
      );
    }

    return data;
  }, [navigate]);

  const fetchGoals = useCallback(async () => {
    const data = await request("/goals/");
    setMyGoals(Array.isArray(data) ? data : []);
  }, [request]);

  const fetchRequests = useCallback(async () => {
    const data = await request("/partners/requests");
    setPartnerRequests(Array.isArray(data) ? data : []);
  }, [request]);

  const fetchPartners = useCallback(async () => {
    const data = await request("/partners/my-partners");
    const list = Array.isArray(data) ? data : data?.partners || [];

    setPartners(list);

    setSelectedPartner((current) => {
      if (!list.length) return null;

      if (current) {
        const match = list.find(
          (partner) =>
            partner.partnership_id === current.partnership_id
        );

        if (match) return match;
      }

      return list[0];
    });

    const streakEntries = await Promise.all(
      list.map(async (partner) => {
        try {
          const streakData = await request(
            `/tasks/partner/${partner.id}/streak`
          );

          return [partner.id, Number(streakData?.streak || 0)];
        } catch {
          return [partner.id, 0];
        }
      })
    );

    setPartnerStreaks(Object.fromEntries(streakEntries));
  }, [request]);

  const fetchPartnerDetails = useCallback(async (partnerId) => {
    if (!partnerId) {
      setPartnerGoals([]);
      setMessages([]);
      return;
    }

    const [goalsResult, messagesResult] = await Promise.allSettled([
      request(`/partners/partner/${partnerId}/goals`),
      request(`/messages/partner/${partnerId}`),
    ]);

    if (goalsResult.status === "fulfilled") {
      const data = goalsResult.value;
      setPartnerGoals(
        Array.isArray(data) ? data : data?.goals || []
      );
    } else {
      setPartnerGoals([]);
      console.error("Unable to fetch partner goals:", goalsResult.reason);
    }

    if (messagesResult.status === "fulfilled") {
      const data = messagesResult.value;
      setMessages(Array.isArray(data) ? data : []);
    } else {
      setMessages([]);
      console.error("Unable to fetch messages:", messagesResult.reason);
    }
  }, [request]);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      if (!token()) {
        navigate("/login");
        return;
      }

      setLoading(true);
      setPageError("");

      const results = await Promise.allSettled([
        fetchGoals(),
        fetchPartners(),
        fetchRequests(),
      ]);

      if (cancelled) return;

      const failed = results.find((result) => result.status === "rejected");

      if (failed) {
        setPageError(failed.reason?.message || "Unable to load partner data.");
      }

      setLoading(false);
    }

    loadPage();

    return () => {
      cancelled = true;
    };
  }, [fetchGoals, fetchPartners, fetchRequests, navigate]);

  useEffect(() => {
    let cancelled = false;

    async function loadSelectedPartner() {
      if (!selectedPartner) {
        setPartnerGoals([]);
        setMessages([]);
        return;
      }

      const [goalsResult, messagesResult] = await Promise.allSettled([
        request(`/partners/partner/${selectedPartner.id}/goals`),
        request(`/messages/partner/${selectedPartner.id}`),
      ]);

      if (cancelled) return;

      if (goalsResult.status === "fulfilled") {
        const data = goalsResult.value;
        setPartnerGoals(
          Array.isArray(data) ? data : data?.goals || []
        );
      } else {
        setPartnerGoals([]);
        console.error(goalsResult.reason);
      }

      if (messagesResult.status === "fulfilled") {
        const data = messagesResult.value;
        setMessages(Array.isArray(data) ? data : []);
      } else {
        setMessages([]);
        console.error(messagesResult.reason);
      }
    }

    loadSelectedPartner();

    return () => {
      cancelled = true;
    };
  }, [selectedPartner, request]);

  const handleSendRequest = async (event) => {
    event.preventDefault();
    setPageError("");

    const userId = Number(partnerUserId);
    const goalId = Number(selectedGoalId);

    if (!Number.isInteger(userId) || userId <= 0) {
      setPageError("Enter a valid partner user ID.");
      return;
    }

    if (!Number.isInteger(goalId) || goalId <= 0) {
      setPageError("Select one of your goals first.");
      return;
    }

    setSendingRequest(true);

    try {
      await request(
        `/partners/request/${userId}?goal_id=${goalId}`,
        { method: "POST" }
      );

      setPartnerUserId("");
      setSelectedGoalId("");
      await fetchRequests();
      alert("Partner request sent successfully.");
    } catch (error) {
      setPageError(error.message);
    } finally {
      setSendingRequest(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    setActionLoading(`${requestId}-${action}`);
    setPageError("");

    try {
      await request(`/partners/${requestId}/${action}`, {
        method: "PUT",
      });

      await fetchRequests();

      if (action === "accept") {
        await fetchPartners();
        alert("Partner request accepted.");
      }
    } catch (error) {
      setPageError(error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendMessage = async (event) => {
    event?.preventDefault();

    if (!selectedPartner || !messageText.trim()) return;

    setSendingMessage(true);
    setPageError("");

    try {
      await request(
        `/messages/send?receiver_id=${selectedPartner.id}&content=${encodeURIComponent(
          messageText.trim()
        )}`,
        { method: "POST" }
      );

      setMessageText("");

      const data = await request(
        `/messages/partner/${selectedPartner.id}`
      );

      setMessages(Array.isArray(data) ? data : []);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  const filteredPartners = partners.filter((partner) => {
    const searchText = search.toLowerCase();

    return (
      (partner.name || "").toLowerCase().includes(searchText) ||
      (partner.email || "").toLowerCase().includes(searchText) ||
      (partner.goal_title || "").toLowerCase().includes(searchText)
    );
  });

  const selectedGoalProgress = selectedPartner?.goal_id
    ? partnerGoals.find(
        (goal) => Number(goal.id) === Number(selectedPartner.goal_id)
      )?.progress || 0
    : 0;

  const isOwnMessage = (message) =>
    selectedPartner &&
    Number(message.sender_id) !== Number(selectedPartner.id);

  if (loading) {
    return (
      <div className="partner-page">
        <aside className="partner-sidebar">
          <Link to="/" className="partner-logo">
            <span>◉</span> Saathi
          </Link>
          <nav>
            <Link to="/dashboard">🏠 Dashboard</Link>
            <Link to="/goals">🎯 My Goals</Link>
            <Link to="/partners" className="active">🤝 My Partners</Link>
            <Link to="/profile">👤 Profile</Link>
          </nav>
          <button onClick={handleLogout} className="partner-logout">
            ↪ Logout
          </button>
        </aside>
        <main className="partner-main">
          <div className="partner-loading">Loading your partner workspace...</div>
        </main>
      </div>
    );
  }

  return (
    <div className="partner-page">
      <aside className="partner-sidebar">
        <Link to="/" className="partner-logo">
          <span>◉</span> Saathi
        </Link>

        <nav>
          <Link to="/dashboard">🏠 Dashboard</Link>
          <Link to="/goals">🎯 My Goals</Link>
          <Link to="/partners" className="active">🤝 My Partners</Link>
          <Link to="/profile">👤 Profile</Link>
        </nav>

        <div className="partner-sidebar-tip">
          <span>✨</span>
          <p>Small progress is still progress.</p>
        </div>

        <button onClick={handleLogout} className="partner-logout">
          ↪ Logout
        </button>
      </aside>

      <main className="partner-main">
        <header className="partner-page-header">
          <p>ACCOUNTABILITY NETWORK</p>
          <h1>My Partners</h1>
          <span>
            Stay accountable, celebrate progress, and grow together.
          </span>
        </header>

        {pageError && (
          <div className="partner-error" role="alert">
            <span>{pageError}</span>
            <button type="button" onClick={() => setPageError("")}>×</button>
          </div>
        )}

        <div className="partner-workspace-grid">
          <div className="partner-left-col">
            <section className="connected-partners-card">
              <div className="partner-section-title">
                <span>ACTIVE CONNECTIONS</span>
                <h2>Partners ({filteredPartners.length})</h2>
              </div>

              <input
                className="partner-search-input"
                type="search"
                placeholder="Search partner or goal..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />

              <div className="connected-partners-list">
                {filteredPartners.map((partner) => {
                  const selected =
                    selectedPartner?.partnership_id === partner.partnership_id;

                  return (
                    <button
                      type="button"
                      key={partner.partnership_id}
                      className={`connected-partner-item ${
                        selected ? "selected" : ""
                      }`}
                      onClick={() => setSelectedPartner(partner)}
                    >
                      <div className="partner-avatar-small">
                        {(partner.name || "P").charAt(0).toUpperCase()}
                      </div>

                      <div className="connected-partner-info">
                        <strong>{partner.name || "Partner"}</strong>
                        <span>{partner.email}</span>
                        <small>🎯 {partner.goal_title || "Accountability goal"}</small>
                      </div>

                      <div className="connected-partner-stats">
                        <span className="connected-badge">● Connected</span>
                        <strong>🔥 {partnerStreaks[partner.id] || 0}d</strong>
                      </div>
                    </button>
                  );
                })}

                {filteredPartners.length === 0 && (
                  <div className="partner-empty-goals">
                    <h3>{search ? "No matching partners" : "No partners connected yet"}</h3>
                    <p>
                      {search
                        ? "Try another name, email, or goal."
                        : "Send a request below to connect with an accountability partner."}
                    </p>
                  </div>
                )}
              </div>
            </section>

            <section className="find-partner-card">
              <div className="partner-section-title">
                <span>PAIR UP</span>
                <h2>Connect for a specific goal</h2>
              </div>

              <p className="partner-helper-text">
                Choose one of your goals and enter the other user's ID.
              </p>

              <form className="find-partner-form" onSubmit={handleSendRequest}>
                <label htmlFor="partner-goal-select">Your goal</label>
                <select
                  id="partner-goal-select"
                  value={selectedGoalId}
                  onChange={(event) => setSelectedGoalId(event.target.value)}
                  required
                >
                  <option value="">Select your goal</option>
                  {myGoals.map((goal) => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title}
                    </option>
                  ))}
                </select>

                <label htmlFor="partner-user-id">Partner user ID</label>
                <input
                  id="partner-user-id"
                  type="number"
                  min="1"
                  value={partnerUserId}
                  onChange={(event) => setPartnerUserId(event.target.value)}
                  placeholder="Enter partner user ID"
                  required
                />

                <button type="submit" disabled={sendingRequest || !myGoals.length}>
                  {sendingRequest ? "Sending request..." : "Send Request →"}
                </button>

                {!myGoals.length && (
                  <small>Create a goal before sending a request.</small>
                )}
              </form>
            </section>

            <section className="partner-requests-card">
              <div className="partner-section-title">
                <span>INVITATIONS</span>
                <h2>Incoming Requests ({partnerRequests.length})</h2>
              </div>

              {partnerRequests.length === 0 ? (
                <div className="partner-empty-goals">
                  <h3>No pending requests</h3>
                  <p>New partner requests will appear here.</p>
                </div>
              ) : (
                <div className="requests-list">
                  {partnerRequests.map((item) => (
                    <article className="partner-request" key={item.id}>
                      <div className="request-avatar">
                        {(item.name || "U").charAt(0).toUpperCase()}
                      </div>

                      <div className="request-info">
                        <strong>{item.name || "User"}</strong>
                        <span>{item.email || ""}</span>
                        <small>🎯 {item.goal_title || "Goal request"}</small>
                      </div>

                      <div className="request-actions">
                        <button
                          type="button"
                          className="accept-request-btn"
                          disabled={Boolean(actionLoading)}
                          onClick={() => handleRequestAction(item.id, "accept")}
                        >
                          {actionLoading === `${item.id}-accept` ? "..." : "Accept"}
                        </button>
                        <button
                          type="button"
                          className="reject-request-btn"
                          disabled={Boolean(actionLoading)}
                          onClick={() => handleRequestAction(item.id, "reject")}
                        >
                          {actionLoading === `${item.id}-reject` ? "..." : "Reject"}
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="partner-quote-card">
              <span className="quote-badge">A LITTLE REMINDER</span>
              <p className="quote-text">
                “You don't have to be perfect. You just have to keep showing up.”
              </p>
              <span className="quote-author">— Your Saathi reminder</span>
            </section>
          </div>

          <div className="partner-right-col">
            {selectedPartner ? (
              <>
                <section className="partner-profile-card">
                  <div className="large-partner-avatar">
                    {(selectedPartner.name || "P").charAt(0).toUpperCase()}
                  </div>

                  <div className="partner-info">
                    <span className="online-badge">● Connected partner</span>
                    <h2>{selectedPartner.name}</h2>
                    <p>{selectedPartner.email}</p>
                    <p>
                      🎯 Accountability goal:{" "}
                      <strong>{selectedPartner.goal_title || "Not specified"}</strong>
                    </p>

                    <div className="partner-stats">
                      <div>
                        <strong>{selectedGoalProgress}%</strong>
                        <span>Goal progress</span>
                      </div>
                      <div>
                        <strong>🔥 {partnerStreaks[selectedPartner.id] || 0}</strong>
                        <span>Day streak</span>
                      </div>
                      <div>
                        <strong>{partnerGoals.length}</strong>
                        <span>Goals shared</span>
                      </div>
                    </div>
                  </div>
                </section>

                <section className="partner-progress-card">
                  <div className="partner-section-title">
                    <span>PARTNER'S GOALS</span>
                    <h2>Current Progress</h2>
                  </div>

                  {partnerGoals.length === 0 ? (
                    <div className="partner-empty-goals">
                      <h3>No goals available</h3>
                      <p>Your partner has not created any goals yet.</p>
                    </div>
                  ) : (
                    partnerGoals.map((goal) => {
                      const progress = Math.min(
                        100,
                        Math.max(0, Number(goal.progress || 0))
                      );

                      return (
                        <article className="partner-goal" key={goal.id}>
                          <div className="partner-goal-copy">
                            <h3>{goal.title}</h3>
                            <p>{goal.description || "No description provided"}</p>
                          </div>

                          <strong>{progress}%</strong>

                          <div
                            className="partner-bar"
                            role="progressbar"
                            aria-valuenow={progress}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            <div style={{ width: `${progress}%` }} />
                          </div>

                          {goal.deadline && (
                            <small>Deadline: {goal.deadline}</small>
                          )}
                        </article>
                      );
                    })
                  )}
                </section>

                <section className="message-card">
                  <div className="partner-section-title">
                    <span>STAY CONNECTED</span>
                    <h2>Chat with {selectedPartner.name}</h2>
                  </div>

                  <div className="partner-messages" aria-live="polite">
                    {messages.length === 0 ? (
                      <p className="no-messages">
                        No messages yet. Start the conversation!
                      </p>
                    ) : (
                      messages.map((message) => (
                        <div
                          key={message.id}
                          className={`message-bubble ${
                            isOwnMessage(message) ? "sent" : "received"
                          }`}
                        >
                          <p>{message.content}</p>
                          <small>
                            {message.created_at
                              ? new Date(message.created_at).toLocaleString()
                              : ""}
                          </small>
                        </div>
                      ))
                    )}
                  </div>

                  <form className="partner-chat-form" onSubmit={handleSendMessage}>
                    <textarea
                      value={messageText}
                      onChange={(event) => setMessageText(event.target.value)}
                      placeholder="Send some encouragement..."
                      maxLength={1000}
                      rows={3}
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !messageText.trim()}
                    >
                      {sendingMessage ? "Sending..." : "Send Message →"}
                    </button>
                  </form>
                </section>

                <section className="encouragement-card">
                  <span className="encouragement-icon">💛</span>
                  <div>
                    <h3>Keep each other accountable</h3>
                    <p>
                      Celebrate small wins, encourage consistency, and keep
                      moving forward together.
                    </p>
                  </div>
                </section>
              </>
            ) : (
              <section className="partner-empty-selection">
                <span>🤝</span>
                <h2>Select a partner</h2>
                <p>
                  Choose a connected partner from the list to view their goals
                  and chat.
                </p>
              </section>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Partner;

