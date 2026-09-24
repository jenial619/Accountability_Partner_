import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Partner.css";

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

  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);


  // =========================================================
  // TOKEN
  // =========================================================

  const getToken = () => {
    return localStorage.getItem("access_token");
  };


  // =========================================================
  // FETCH MY GOALS
  // =========================================================

  const fetchMyGoals = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/goals/",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || "Failed to fetch goals"
        );
      }

      setMyGoals(
        Array.isArray(data) ? data : []
      );
    } catch (error) {
      console.error(
        "Error fetching goals:",
        error
      );

      setMyGoals([]);
    }
  };


  // =========================================================
  // FETCH CONNECTED PARTNERS
  // =========================================================

  const fetchPartners = async () => {
    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        "http://127.0.0.1:8000/partners/my-partners",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to fetch partners"
        );
      }

      const partnerList = Array.isArray(data)
        ? data
        : data.partners || [];

      setPartners(partnerList);


      // Keep currently selected partner
      // if they still exist.
      setSelectedPartner((current) => {

        if (partnerList.length === 0) {
          return null;
        }

        if (!current) {
          return partnerList[0];
        }

        const existingPartner =
          partnerList.find(
            (partner) =>
              partner.partnership_id ===
              current.partnership_id
          );

        return existingPartner ||
          partnerList[0];
      });


      // =====================================================
      // FETCH STREAKS
      // =====================================================

      const streakMap = {};

      for (const partner of partnerList) {

        try {

          const streakResponse =
            await fetch(
              `http://127.0.0.1:8000/tasks/partner/${partner.id}/streak`,
              {
                headers: {
                  Authorization:
                    `Bearer ${token}`,
                },
              }
            );

          if (streakResponse.ok) {

            const streakData =
              await streakResponse.json();

            streakMap[partner.id] =
              streakData.streak || 0;

          } else {

            streakMap[partner.id] = 0;

          }

        } catch (error) {

          console.error(
            "Error fetching streak:",
            error
          );

          streakMap[partner.id] = 0;
        }
      }

      setPartnerStreaks(streakMap);

    } catch (error) {

      console.error(
        "Error fetching partners:",
        error
      );

      setPartners([]);
      setSelectedPartner(null);
    }
  };


  // =========================================================
  // FETCH INCOMING REQUESTS
  // =========================================================

  const fetchPartnerRequests = async () => {

    const token = getToken();

    if (!token) {
      navigate("/login");
      return;
    }

    try {

      const response = await fetch(
        "http://127.0.0.1:8000/partners/requests",
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to fetch requests"
        );
      }

      setPartnerRequests(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        "Error fetching requests:",
        error
      );

      setPartnerRequests([]);
    }
  };


  // =========================================================
  // FETCH SELECTED PARTNER'S GOALS
  // =========================================================

  const fetchPartnerGoals = async (
    partnerId
  ) => {

    const token = getToken();

    if (!token || !partnerId) {
      setPartnerGoals([]);
      return;
    }

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/partners/partner/${partnerId}/goals`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            "Failed to fetch partner goals"
        );
      }

      setPartnerGoals(
        Array.isArray(data)
          ? data
          : data.goals || []
      );

    } catch (error) {

      console.error(
        "Error fetching partner goals:",
        error
      );

      setPartnerGoals([]);
    }
  };


  // =========================================================
  // FETCH MESSAGES FOR SELECTED PARTNER
  // =========================================================

  const fetchMessages = async (
    partnerId
  ) => {

    const token = getToken();

    if (!token || !partnerId) {
      setMessages([]);
      return;
    }

    try {

      const response = await fetch(
        `http://127.0.0.1:8000/messages/partner/${partnerId}`,
        {
          headers: {
            Authorization:
              `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setMessages([]);
        return;
      }

      setMessages(
        Array.isArray(data)
          ? data
          : []
      );

    } catch (error) {

      console.error(
        "Error fetching messages:",
        error
      );

      setMessages([]);
    }
  };


  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {

    const loadData = async () => {

      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      setLoading(true);

      await Promise.all([
        fetchMyGoals(),
        fetchPartners(),
        fetchPartnerRequests(),
      ]);

      setLoading(false);
    };

    loadData();

  }, [navigate]);


  // =========================================================
  // WHEN SELECTED PARTNER CHANGES
  // =========================================================

  useEffect(() => {

    if (!selectedPartner) {

      setPartnerGoals([]);
      setMessages([]);

      return;
    }

    fetchPartnerGoals(
      selectedPartner.id
    );

    fetchMessages(
      selectedPartner.id
    );

  }, [selectedPartner]);


  // =========================================================
  // SEND PARTNER REQUEST
  // =========================================================

  const handleSendPartnerRequest =
    async () => {

      const token = getToken();

      if (!token) {
        navigate("/login");
        return;
      }

      if (!partnerUserId.trim()) {

        alert(
          "Please enter a partner user ID."
        );

        return;
      }

      if (!selectedGoalId) {

        alert(
          "Please select a goal."
        );

        return;
      }

      const userId =
        Number(partnerUserId);

      const goalId =
        Number(selectedGoalId);

      if (
        !Number.isInteger(userId) ||
        userId <= 0
      ) {

        alert(
          "Please enter a valid user ID."
        );

        return;
      }

      if (
        !Number.isInteger(goalId) ||
        goalId <= 0
      ) {

        alert(
          "Please select a valid goal."
        );

        return;
      }

      setSendingRequest(true);

      try {

        const response =
          await fetch(
            `http://127.0.0.1:8000/partners/request/${userId}?goal_id=${goalId}`,
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.detail ||
              "Failed to send request"
          );
        }

        alert(
          "Partner request sent successfully."
        );

        setPartnerUserId("");
        setSelectedGoalId("");

        await fetchPartnerRequests();

      } catch (error) {

        console.error(
          "Error sending request:",
          error
        );

        alert(error.message);

      } finally {

        setSendingRequest(false);
      }
    };


  // =========================================================
  // ACCEPT REQUEST
  // =========================================================

  const handleAcceptRequest =
    async (requestId) => {

      const token = getToken();

      try {

        const response =
          await fetch(
            `http://127.0.0.1:8000/partners/${requestId}/accept`,
            {
              method: "PUT",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.detail ||
              "Failed to accept request"
          );
        }

        alert(
          "Partner request accepted."
        );

        await fetchPartnerRequests();
        await fetchPartners();

      } catch (error) {

        console.error(
          "Error accepting request:",
          error
        );

        alert(error.message);
      }
    };


  // =========================================================
  // REJECT REQUEST
  // =========================================================

  const handleRejectRequest =
    async (requestId) => {

      const token = getToken();

      try {

        const response =
          await fetch(
            `http://127.0.0.1:8000/partners/${requestId}/reject`,
            {
              method: "PUT",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.detail ||
              "Failed to reject request"
          );
        }

        await fetchPartnerRequests();

      } catch (error) {

        console.error(
          "Error rejecting request:",
          error
        );

        alert(error.message);
      }
    };


  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const handleSendMessage =
    async () => {

      const token = getToken();

      if (!selectedPartner) {

        alert(
          "Please select a partner first."
        );

        return;
      }

      if (!messageText.trim()) {

        alert(
          "Enter a message."
        );

        return;
      }

      setSendingMessage(true);

      try {

        const response =
          await fetch(
            `http://127.0.0.1:8000/messages/send?receiver_id=${selectedPartner.id}&content=${encodeURIComponent(
              messageText.trim()
            )}`,
            {
              method: "POST",
              headers: {
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response.json();

        if (!response.ok) {

          throw new Error(
            data.detail ||
              "Failed to send message"
          );
        }

        setMessages(
          (previous) => [
            ...previous,
            data,
          ]
        );

        setMessageText("");

      } catch (error) {

        console.error(
          "Error sending message:",
          error
        );

        alert(error.message);

      } finally {

        setSendingMessage(false);
      }
    };


  // =========================================================
  // MESSAGE ENTER KEY
  // =========================================================

  const handleMessageKeyDown =
    (event) => {

      if (
        event.key === "Enter" &&
        !event.shiftKey
      ) {

        event.preventDefault();

        handleSendMessage();
      }
    };


  // =========================================================
  // LOGOUT
  // =========================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "access_token"
    );

    navigate("/login");
  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (
      <div className="partner-page">

        <aside className="partner-sidebar">

          <Link
            to="/"
            className="partner-logo"
          >
            <span>◉</span>
            Saathi
          </Link>

          <nav>

            <Link to="/dashboard">
              ⌂ Dashboard
            </Link>

            <Link to="/goals">
              🎯 My Goals
            </Link>

            <Link
              to="/partners"
              className="active"
            >
              🤝 My Partners
            </Link>

            <Link to="/profile">
              👤 Profile
            </Link>

          </nav>

          <button
            onClick={handleLogout}
            className="partner-logout"
          >
            ↪ Logout
          </button>

        </aside>

        <main className="partner-main">

          <header className="partner-page-header">

            <div>

              <p>
                ACCOUNTABILITY
              </p>

              <h1>
                My Partners
              </h1>

              <span>
                Stay accountable and grow together.
              </span>

            </div>

          </header>

          <div className="partner-empty-state">

            <h2>
              Loading partner information...
            </h2>

          </div>

        </main>

      </div>
    );
  }


  // =========================================================
  // MAIN PAGE
  // =========================================================

  return (
    <div className="partner-page">

      {/* =====================================================
          SIDEBAR
      ====================================================== */}

      <aside className="partner-sidebar">

        <Link
          to="/"
          className="partner-logo"
        >
          <span>◉</span>
          Saathi
        </Link>

        <nav>

          <Link to="/dashboard">
            ⌂ Dashboard
          </Link>

          <Link to="/goals">
            🎯 My Goals
          </Link>

          <Link
            to="/partners"
            className="active"
          >
            🤝 My Partners
          </Link>

          <Link to="/profile">
            👤 Profile
          </Link>

        </nav>

        <button
          onClick={handleLogout}
          className="partner-logout"
        >
          ↪ Logout
        </button>

      </aside>


      {/* =====================================================
          MAIN
      ====================================================== */}

      <main className="partner-main">

        <header className="partner-page-header">

          <div>

            <p>
              ACCOUNTABILITY
            </p>

            <h1>
              My Partners
            </h1>

            <span>
              Stay accountable and grow together.
            </span>

          </div>

        </header>


        {/* ===================================================
            CONNECTED PARTNERS
        ==================================================== */}

        <section className="connected-partners-card">

          <div className="partner-section-title">

            <span>
              YOUR ACCOUNTABILITY PARTNERS
            </span>

            <h2>
              Connected Partners
            </h2>

          </div>


          {partners.length === 0 ? (

            <div className="partner-empty-goals">

              <h3>
                No partners connected yet
              </h3>

              <p>
                Send a request below to connect
                with an accountability partner.
              </p>

            </div>

          ) : (

            <div className="connected-partners-list">

              {partners.map((partner) => {

                const isSelected =
                  selectedPartner?.partnership_id ===
                  partner.partnership_id;

                return (
                  <button
                    type="button"
                    key={partner.partnership_id}
                    className={
                      isSelected
                        ? "connected-partner-item selected"
                        : "connected-partner-item"
                    }
                    onClick={() =>
                      setSelectedPartner(partner)
                    }
                  >

                    <div className="partner-avatar-small">

                      {partner.name
                        ? partner.name
                            .charAt(0)
                            .toUpperCase()
                        : "P"}

                    </div>


                    <div className="connected-partner-info">

                      <strong>
                        {partner.name}
                      </strong>

                      <span>
                        {partner.email}
                      </span>

                      <small>
                        🎯{" "}
                        {partner.goal_title ||
                          "Accountability Goal"}
                      </small>

                    </div>


                    <div className="connected-partner-stats">

                      <span className="connected-badge">
                        ● Connected
                      </span>

                      <strong>
                        🔥{" "}
                        {partnerStreaks[
                          partner.id
                        ] || 0}
                      </strong>

                    </div>

                  </button>
                );
              })}

            </div>
          )}

        </section>


        {/* ===================================================
            FIND PARTNER
        ==================================================== */}

        <section className="find-partner-card">

          <div className="partner-section-title">

            <span>
              FIND A PARTNER
            </span>

            <h2>
              Connect for a specific goal
            </h2>

          </div>

          <p>
            Choose one of your goals and enter
            the user ID of the person you want
            to connect with.
          </p>


          <div className="find-partner-form">

            <select
              value={selectedGoalId}
              onChange={(event) =>
                setSelectedGoalId(
                  event.target.value
                )
              }
            >

              <option value="">
                Select your goal
              </option>

              {myGoals.map((goal) => (

                <option
                  key={goal.id}
                  value={goal.id}
                >
                  {goal.title}
                </option>

              ))}

            </select>


            <input
              type="number"
              min="1"
              value={partnerUserId}
              onChange={(event) =>
                setPartnerUserId(
                  event.target.value
                )
              }
              placeholder="Enter partner user ID"
            />


            <button
              type="button"
              onClick={
                handleSendPartnerRequest
              }
              disabled={sendingRequest}
            >
              {sendingRequest
                ? "Sending..."
                : "Send Request →"}
            </button>

          </div>

        </section>


        {/* ===================================================
            INCOMING REQUESTS
        ==================================================== */}

        <section className="partner-requests-card">

          <div className="partner-section-title">

            <span>
              CONNECTION REQUESTS
            </span>

            <h2>
              Incoming Requests
            </h2>

          </div>


          {partnerRequests.length === 0 ? (

            <div className="partner-empty-goals">

              <h3>
                No pending requests
              </h3>

              <p>
                New partner requests will
                appear here.
              </p>

            </div>

          ) : (

            <div className="requests-list">

              {partnerRequests.map(
                (request) => (

                  <div
                    className="partner-request"
                    key={request.id}
                  >

                    <div className="request-avatar">

                      {request.name
                        ? request.name
                            .charAt(0)
                            .toUpperCase()
                        : "U"}

                    </div>


                    <div className="request-info">

                      <strong>
                        {request.name}
                      </strong>

                      <span>
                        {request.email}
                      </span>

                      <small>
                        🎯 Goal:{" "}
                        {request.goal_title ||
                          "Unknown goal"}
                      </small>

                    </div>


                    <div className="request-actions">

                      <button
                        type="button"
                        className="accept-request-btn"
                        onClick={() =>
                          handleAcceptRequest(
                            request.id
                          )
                        }
                      >
                        Accept
                      </button>

                      <button
                        type="button"
                        className="reject-request-btn"
                        onClick={() =>
                          handleRejectRequest(
                            request.id
                          )
                        }
                      >
                        Reject
                      </button>

                    </div>

                  </div>
                )
              )}

            </div>

          )}

        </section>


        {/* ===================================================
            SELECTED PARTNER PROFILE
        ==================================================== */}

        {selectedPartner && (

          <>

            <section className="partner-profile-card">

              <div className="large-partner-avatar">

                {selectedPartner.name
                  ? selectedPartner.name
                      .charAt(0)
                      .toUpperCase()
                  : "P"}

              </div>


              <div className="partner-info">

                <span className="online-badge">
                  ● Connected
                </span>

                <h2>
                  {selectedPartner.name}
                </h2>

                <p>
                  {selectedPartner.email}
                </p>

                <p>
                  🎯 Accountability Goal:{" "}
                  <strong>
                    {selectedPartner.goal_title ||
                      "Not specified"}
                  </strong>
                </p>


                <div className="partner-stats">

                  <div>

                    <strong>

                      {selectedPartner.goal_id
                        ? (
                            partnerGoals.find(
                              (goal) =>
                                goal.id ===
                                selectedPartner.goal_id
                            )?.progress || 0
                          )
                        : 0}

                      %

                    </strong>

                    <span>
                      Goal Progress
                    </span>

                  </div>


                  <div>

                    <strong>
                      🔥{" "}
                      {partnerStreaks[
                        selectedPartner.id
                      ] || 0}
                    </strong>

                    <span>
                      Day Streak
                    </span>

                  </div>


                  <div>

                    <strong>
                      🤝
                    </strong>

                    <span>
                      Connected
                    </span>

                  </div>

                </div>

              </div>

            </section>


            {/* =================================================
                PARTNER GOALS
            ================================================== */}

            <section className="partner-progress-card">

              <div className="partner-section-title">

                <span>
                  PARTNER'S GOALS
                </span>

                <h2>
                  Current Progress
                </h2>

              </div>


              {partnerGoals.length === 0 ? (

                <div className="partner-empty-goals">

                  <h3>
                    No goals available
                  </h3>

                  <p>
                    Your partner has not created
                    any goals yet.
                  </p>

                </div>

              ) : (

                <div>

                  {partnerGoals.map(
                    (goal) => (

                      <div
                        className="partner-goal"
                        key={goal.id}
                      >

                        <div>

                          <h3>
                            {goal.title}
                          </h3>

                          <p>
                            {goal.description ||
                              "No description provided"}
                          </p>

                        </div>


                        <strong>
                          {goal.progress || 0}%
                        </strong>


                        <div className="partner-bar">

                          <div
                            style={{
                              width:
                                `${Math.min(
                                  Math.max(
                                    goal.progress ||
                                      0,
                                    0
                                  ),
                                  100
                                )}%`,
                            }}
                          />

                        </div>


                        {goal.deadline && (

                          <small>
                            Deadline:{" "}
                            {goal.deadline}
                          </small>

                        )}

                      </div>
                    )
                  )}

                </div>

              )}

            </section>


            {/* =================================================
                CHAT
            ================================================== */}

            <section className="message-card">

              <div className="partner-section-title">

                <span>
                  STAY CONNECTED
                </span>

                <h2>
                  Chat with{" "}
                  {selectedPartner.name}
                </h2>

              </div>


              <div className="partner-messages">

                {messages.length === 0 ? (

                  <p className="no-messages">
                    No messages yet.
                    Start the conversation!
                  </p>

                ) : (

                  messages.map(
                    (message) => (

                      <div
                        key={message.id}
                        className={
                          message.sender_id ===
                          selectedPartner.id
                            ? "message-bubble received"
                            : "message-bubble sent"
                        }
                      >

                        <p>
                          {message.content}
                        </p>

                        <small>
                          {message.created_at
                            ? new Date(
                                message.created_at
                              ).toLocaleString()
                            : ""}
                        </small>

                      </div>
                    )
                  )
                )}

              </div>


              <textarea
                value={messageText}
                onChange={(event) =>
                  setMessageText(
                    event.target.value
                  )
                }
                onKeyDown={
                  handleMessageKeyDown
                }
                placeholder={
                  "Send some encouragement..."
                }
              />


              <button
                type="button"
                onClick={handleSendMessage}
                disabled={sendingMessage}
              >
                {sendingMessage
                  ? "Sending..."
                  : "Send Message →"}
              </button>

            </section>


            {/* =================================================
                ENCOURAGEMENT
            ================================================== */}

            <section className="encouragement-card">

              <div>
                <span>💛</span>
              </div>

              <div>

                <h3>
                  Keep each other accountable
                </h3>

                <p>
                  Encourage your partners when
                  they're making progress and
                  celebrate the small wins together.
                </p>

              </div>

            </section>

          </>
        )}

      </main>

    </div>
  );
}

export default Partner;

