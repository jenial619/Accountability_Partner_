import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Partner.css";

const API_BASE = "http://127.0.0.1:8000";

const MOTIVATIONAL_QUOTES = [
  { text: "Consistency is what transforms average into excellence.", author: "Tony Robbins" },
  { text: "Accountability breeds response-ability.", author: "Stephen R. Covey" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Alone we can do so little; together we can do so much.", author: "Helen Keller" }
];

const INITIAL_PARTNERS = [
  {
    id: 101,
    partnership_id: 1,
    name: "riya",
    email: "kasgarnithyasri@gmail.com",
    goal_title: "tailwind",
    goal_id: 1,
    streak: 0,
    status: "Active",
  },
  {
    id: 102,
    partnership_id: 2,
    name: "Daniel Craig",
    email: "daniel.c@example.com",
    goal_title: "Exam Preparation & Revision",
    goal_id: 2,
    streak: 1,
    status: "Active",
  },
];

const INITIAL_GOALS = [
  {
    id: 1,
    title: "Daily Morning Workout & Cardio",
    description: "Hit the gym 5 days a week and complete 20m running.",
    progress: 100,
    deadline: "2026-11-30",
    completed: true,
  },
  {
    id: 2,
    title: "DSA 2 Problems Daily",
    description: "Solve two medium LeetCode algorithms every day.",
    progress: 100,
    deadline: "2026-12-15",
    completed: true,
  },
];

export default function Partner() {
  const navigate = useNavigate();
  const chatBottomRef = useRef(null);

  // Partner & Goals State
  const [partners, setPartners] = useState(INITIAL_PARTNERS);
  const [searchFilter, setSearchFilter] = useState("");
  const [myGoals, setMyGoals] = useState(INITIAL_GOALS);
  const [partnerRequests, setPartnerRequests] = useState([]);

  const [selectedGoalId, setSelectedGoalId] = useState("");
  const [partnerUserId, setPartnerUserId] = useState("");

  const [selectedPartner, setSelectedPartner] = useState(INITIAL_PARTNERS[1]);
  const [partnerGoals, setPartnerGoals] = useState(INITIAL_GOALS);
  const [partnerStreaks, setPartnerStreaks] = useState({ 101: 0, 102: 1 });

  // Motivational quote state (under pending requests)
  const [quoteIndex, setQuoteIndex] = useState(0);

  const [messages, setMessages] = useState([
    { id: 1, sender_id: 102, content: "Hey! Did you complete your morning session?", created_at: new Date().toISOString() },
    { id: 2, sender_id: 0, content: "Yes! 45 minutes completed. How is your target?", created_at: new Date().toISOString() },
    { id: 3, sender_id: 0, content: "hi", created_at: new Date().toISOString() },
    { id: 4, sender_id: 0, content: "Keep up the fire streak!", created_at: new Date().toISOString() }
  ]);
  const [messageText, setMessageText] = useState("");
  const [sendingRequest, setSendingRequest] = useState(false);

  const getToken = () => localStorage.getItem("access_token");

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleNextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % MOTIVATIONAL_QUOTES.length);
  };

  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (p.goal_title && p.goal_title.toLowerCase().includes(searchFilter.toLowerCase()))
  );

  const handleSendReaction = (text) => {
    const newMsg = {
      id: Date.now(),
      sender_id: 0,
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
  };

  const handleNudge = () => {
    alert(`🔔 Nudge sent! ${selectedPartner.name} has been notified.`);
    handleSendReaction("🔔 Sent you a nudge: Don't break your streak today!");
  };

  const handleToggleGoal = (goalId) => {
    setPartnerGoals((prev) =>
      prev.map((g) => {
        if (g.id === goalId) {
          const isDone = !g.completed;
          return { ...g, completed: isDone, progress: isDone ? 100 : 75 };
        }
        return g;
      })
    );
  };

  const handleSendMessage = () => {
    if (!messageText.trim()) return;
    const newMsg = {
      id: Date.now(),
      sender_id: 0,
      content: messageText.trim(),
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setMessageText("");
  };

  const handleMessageKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendPartnerRequest = (e) => {
    e.preventDefault();
    if (!partnerUserId.trim()) return alert("Enter partner user ID.");
    if (!selectedGoalId) return alert("Select a target goal.");

    setSendingRequest(true);
    setTimeout(() => {
      alert(`Accountability invitation sent to User #${partnerUserId}!`);
      setPartnerUserId("");
      setSelectedGoalId("");
      setSendingRequest(false);
    }, 400);
  };

  const handleAcceptRequest = (id) => {
    const req = partnerRequests.find((r) => r.id === id);
    if (req) {
      const newP = {
        id: req.id,
        partnership_id: Date.now(),
        name: req.name,
        email: req.email,
        goal_title: req.goal_title,
        streak: 1,
        status: "Active",
      };
      setPartners((prev) => [...prev, newP]);
      setPartnerRequests((prev) => prev.filter((r) => r.id !== id));
      setSelectedPartner(newP);
    }
  };

  const handleRejectRequest = (id) => {
    setPartnerRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    navigate("/login");
  };

  return (
    <div className="partner-page">
      {/* SIDEBAR */}
      <aside className="partner-sidebar">
        <Link to="/" className="partner-logo">
          <span>◉</span>
          Saathi
        </Link>
        <nav>
          <Link to="/dashboard">⌂ Dashboard</Link>
          <Link to="/goals">🎯 My Goals</Link>
          <Link to="/partners" className="active">🤝 My Partners</Link>
          <Link to="/workspace">🗂 Workspace</Link>
          <Link to="/profile">👤 Profile</Link>
        </nav>
        <button onClick={handleLogout} className="partner-logout">
          ↪ Logout
        </button>
      </aside>

      {/* MAIN VIEW */}
      <main className="partner-main">
        <header className="partner-page-header">
          <p>ACCOUNTABILITY NETWORK</p>
          <h1>Partner Workspace</h1>
          <span>Manage your partners, check daily milestones, and communicate in real-time.</span>
        </header>

        <div className="partner-workspace-grid">
          {/* LEFT COLUMN: LIST, FORM, REQUESTS, EXPANDED QUOTES */}
          <div className="partner-left-col">
            {/* 1. ACTIVE PARTNERS */}
            <section className="connected-partners-card">
              <div className="partner-section-title">
                <span>ACTIVE CONNECTIONS</span>
                <h2>Partners ({filteredPartners.length})</h2>
              </div>

              <input
                type="text"
                className="partner-search-input"
                placeholder="🔍 Search partner or target..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
              />

              <div className="connected-partners-list">
                {filteredPartners.map((partner) => {
                  const isSelected = selectedPartner?.id === partner.id;
                  const initial = partner.name ? partner.name.charAt(0).toUpperCase() : "P";
                  return (
                    <button
                      type="button"
                      key={partner.id}
                      className={isSelected ? "connected-partner-item selected" : "connected-partner-item"}
                      onClick={() => setSelectedPartner(partner)}
                    >
                      <div className="partner-avatar-small">{initial}</div>
                      <div className="connected-partner-info">
                        <strong>{partner.name}</strong>
                        <span>{partner.email}</span>
                        <small>🎯 {partner.goal_title || "Accountability Focus"}</small>
                      </div>
                      <div className="connected-partner-stats">
                        <span className="connected-badge">● Active</span>
                        <strong>🔥 {partnerStreaks[partner.id] || partner.streak || 0}d</strong>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* 2. PAIR UP FORM */}
            <section className="find-partner-card">
              <div className="partner-section-title">
                <span>PAIR UP</span>
                <h2>Connect For A Goal</h2>
              </div>
              <form className="find-partner-form" onSubmit={handleSendPartnerRequest}>
                <select value={selectedGoalId} onChange={(e) => setSelectedGoalId(e.target.value)}>
                  <option value="">Select target goal</option>
                  {myGoals.map((g) => (
                    <option key={g.id} value={g.id}>{g.title}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Enter Partner User ID..."
                  value={partnerUserId}
                  onChange={(e) => setPartnerUserId(e.target.value)}
                />

                <button type="submit" disabled={sendingRequest}>
                  {sendingRequest ? "Sending..." : "Send Request →"}
                </button>
              </form>
            </section>

            {/* 3. PENDING REQUESTS (WITH EXTRA BREATHING ROOM) */}
            <section className="partner-requests-card">
              <div className="partner-section-title">
                <span>INVITATIONS</span>
                <h2>Pending Requests ({partnerRequests.length})</h2>
              </div>
              {partnerRequests.length === 0 ? (
                <p>No pending requests.</p>
              ) : (
                partnerRequests.map((req) => (
                  <div className="partner-request" key={req.id}>
                    <div className="request-avatar">{req.name.charAt(0)}</div>
                    <div className="request-info">
                      <strong>{req.name}</strong>
                      <span>{req.goal_title}</span>
                    </div>
                    <div className="request-actions">
                      <button className="accept-request-btn" onClick={() => handleAcceptRequest(req.id)}>
                        Accept
                      </button>
                      <button className="reject-request-btn" onClick={() => handleRejectRequest(req.id)}>
                        Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </section>

            {/* 4. EXPANDED MOTIVATIONAL QUOTES (UNDER PENDING REQUESTS) */}
            <section className="partner-quote-card">
              <div className="quote-header">
                <span className="quote-badge">DAILY SPARK 💡</span>
                <button type="button" className="quote-refresh-btn" onClick={handleNextQuote}>
                  ↻ Next Quote
                </button>
              </div>
              <p className="quote-text">"{MOTIVATIONAL_QUOTES[quoteIndex].text}"</p>
              <span className="quote-author">— {MOTIVATIONAL_QUOTES[quoteIndex].author}</span>
            </section>
          </div>

          {/* RIGHT COLUMN: WORKSPACE & CHAT */}
          <div className="partner-right-col">
            {selectedPartner && (
              <>
                {/* PROFILE CARD */}
                <section className="partner-profile-card">
                  <div className="large-partner-avatar">
                    {selectedPartner.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="partner-info">
                    <div className="partner-header-actions">
                      <span className="online-badge">● Active Partner</span>
                      <button className="partner-nudge-btn" onClick={handleNudge}>
                        🔔 Ping Partner
                      </button>
                    </div>
                    <h2>{selectedPartner.name}</h2>
                    <p>{selectedPartner.email}</p>
                    <p>🎯 Goal: <strong>{selectedPartner.goal_title || "Daily Consistency"}</strong></p>
                    <div className="partner-stats">
                      <div>
                        <strong>85%</strong>
                        <span>PROGRESS</span>
                      </div>
                      <div>
                        <strong>🔥 {partnerStreaks[selectedPartner.id] || selectedPartner.streak || 0}</strong>
                        <span>DAY STREAK</span>
                      </div>
                      <div>
                        <strong>🤝 Mutual</strong>
                        <span>STATUS</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* LIVE TARGETS */}
                <section className="partner-progress-card">
                  <div className="partner-section-title">
                    <span>LIVE TARGETS</span>
                    <h2>Partner Milestones (Check to update)</h2>
                  </div>

                  <div>
                    {partnerGoals.map((goal) => (
                      <div className="partner-goal" key={goal.id}>
                        <input
                          type="checkbox"
                          className="partner-goal-checkbox"
                          checked={goal.completed || false}
                          onChange={() => handleToggleGoal(goal.id)}
                          title="Mark milestone complete"
                        />
                        <div>
                          <h3 className={goal.completed ? "completed" : ""}>{goal.title}</h3>
                          <p>{goal.description}</p>
                        </div>
                        <strong>{goal.progress}%</strong>
                        <div className="partner-bar">
                          <div style={{ width: `${goal.progress}%` }}></div>
                        </div>
                        <small>Deadline: {goal.deadline} {goal.completed && "• ✓ Completed"}</small>
                      </div>
                    ))}
                  </div>
                </section>

                {/* ACCOUNTABILITY CHAT */}
                <section className="message-card">
                  <div className="partner-section-title">
                    <span>ACCOUNTABILITY CHAT</span>
                    <h2>Check In with {selectedPartner.name.split(" ")[0]}</h2>
                  </div>

                  <div className="quick-reactions-bar">
                    <button className="reaction-pill" onClick={() => handleSendReaction("🔥 Keep up the fire streak!")}>
                      🔥 Fire Streak
                    </button>
                    <button className="reaction-pill" onClick={() => handleSendReaction("💪 Finished my goal! You got this!")}>
                      💪 Crushing It
                    </button>
                    <button className="reaction-pill" onClick={() => handleSendReaction("🎯 Don't forget today's target!")}>
                      🎯 Reminder
                    </button>
                    <button className="reaction-pill" onClick={() => handleSendReaction("👏 Great progress today!")}>
                      👏 Great Job
                    </button>
                  </div>

                  <div className="partner-messages">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={m.sender_id === selectedPartner.id ? "message-bubble received" : "message-bubble sent"}
                      >
                        <p>{m.content}</p>
                        <small>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </small>
                      </div>
                    ))}
                    <div ref={chatBottomRef} />
                  </div>

                  <textarea
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={handleMessageKeyDown}
                    placeholder="Type an encouraging note... (Press Enter to send)"
                  />

                  <button type="button" onClick={handleSendMessage} disabled={!messageText.trim()}>
                    Send Message →
                  </button>
                </section>
              </>
            )}

            <section className="encouragement-card">
              <span>💛</span>
              <div>
                <h3>Accountability multiplies success</h3>
                <p>Nudge your partner or send a quick reaction chip to keep each other in the habit loop!</p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
