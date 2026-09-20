import {
  useEffect,
  useState
} from "react";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";

import {
  Doughnut
} from "react-chartjs-2";

import "./App.css";


ChartJS.register(
  ArcElement,
  Tooltip,
  Legend
);


const API_URL =
  "http://127.0.0.1:8000";


// ======================================================
// App
// ======================================================

function App() {

  // ======================================================
  // Authentication
  // ======================================================

  const [
    user,
    setUser
  ] = useState(() => {

    try {

      const savedUser =
        localStorage.getItem(
          "retinaAIUser"
        );

      const savedToken =
        localStorage.getItem(
          "retinaAIToken"
        );

      if (
        savedUser &&
        savedToken
      ) {

        return JSON.parse(
          savedUser
        );

      }

      return null;

    } catch {

      return null;

    }

  });


  const [
    authMode,
    setAuthMode
  ] = useState("login");


  const [
    authLoading,
    setAuthLoading
  ] = useState(false);


  const [
    authError,
    setAuthError
  ] = useState("");


  const [
    authSuccess,
    setAuthSuccess
  ] = useState("");


  const [
    authForm,
    setAuthForm
  ] = useState({

    name: "",

    email: "",

    password: ""

  });


  // ======================================================
  // Selected File
  // ======================================================

  const [
    selectedFile,
    setSelectedFile
  ] = useState(null);


  const [
    preview,
    setPreview
  ] = useState(null);


  const [
    result,
    setResult
  ] = useState(null);


  const [
    loading,
    setLoading
  ] = useState(false);


  // ======================================================
  // User History
  // ======================================================

  const [
    history,
    setHistory
  ] = useState([]);


  const [
    historyLoading,
    setHistoryLoading
  ] = useState(false);


  // ======================================================
  // User Statistics
  // ======================================================

  const [
    stats,
    setStats
  ] = useState(null);


  const [
    statsLoading,
    setStatsLoading
  ] = useState(false);


  // ======================================================
  // ADMIN STATE
  // ======================================================

  const [
    adminStats,
    setAdminStats
  ] = useState(null);


  const [
    adminUsers,
    setAdminUsers
  ] = useState([]);


  const [
    adminPredictions,
    setAdminPredictions
  ] = useState([]);


  const [
    adminLoading,
    setAdminLoading
  ] = useState(false);


  const [
    adminSection,
    setAdminSection
  ] = useState("dashboard");


  // ======================================================
  // Logout
  // ======================================================

  const handleLogout = () => {

    localStorage.removeItem(
      "retinaAIUser"
    );

    localStorage.removeItem(
      "retinaAIToken"
    );

    setUser(null);

    setHistory([]);

    setStats(null);

    setResult(null);

    setSelectedFile(null);

    setPreview(null);

    setAdminStats(null);

    setAdminUsers([]);

    setAdminPredictions([]);

    setAdminSection(
      "dashboard"
    );

  };


  // ======================================================
  // Authentication Form Change
  // ======================================================

  const handleAuthChange = (
    event
  ) => {

    setAuthForm({

      ...authForm,

      [event.target.name]:
        event.target.value

    });

    setAuthError("");

    setAuthSuccess("");

  };


  // ======================================================
  // Register / Login
  // ======================================================

  const handleAuthSubmit = async (
    event
  ) => {

    event.preventDefault();

    setAuthError("");

    setAuthSuccess("");

    setAuthLoading(true);


    try {

      const endpoint =
        authMode === "register"
          ? "/register"
          : "/login";


      const body =
        authMode === "register"
          ? {

              name:
                authForm.name.trim(),

              email:
                authForm.email.trim(),

              password:
                authForm.password

            }
          : {

              email:
                authForm.email.trim(),

              password:
                authForm.password

            };


      const response =
        await fetch(
          `${API_URL}${endpoint}`,
          {

            method: "POST",

            headers: {

              "Content-Type":
                "application/json"

            },

            body:
              JSON.stringify(body)

          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Something went wrong."
        );

      }


      // ==================================================
      // Registration
      // ==================================================

      if (
        authMode === "register"
      ) {

        setAuthSuccess(
          "Registration successful! Please login."
        );

        setAuthMode(
          "login"
        );

        setAuthForm({

          name: "",

          email:
            authForm.email,

          password: ""

        });

      }


      // ==================================================
      // Login
      // ==================================================

      else {

        const loggedInUser =
          data.user;


        const accessToken =
          data.access_token;


        if (
          !accessToken
        ) {

          throw new Error(
            "Login successful, but authentication token was not received."
          );

        }


        localStorage.setItem(
          "retinaAIUser",
          JSON.stringify(
            loggedInUser
          )
        );


        localStorage.setItem(
          "retinaAIToken",
          accessToken
        );


        setUser(
          loggedInUser
        );


        setAuthForm({

          name: "",

          email: "",

          password: ""

        });

      }

    } catch (error) {

      console.error(
        "Authentication error:",
        error
      );

      setAuthError(
        error.message ||
        "Could not connect to backend."
      );

    } finally {

      setAuthLoading(
        false
      );

    }

  };


  // ======================================================
  // Get JWT Token
  // ======================================================

  const getToken = () => {

    return localStorage.getItem(
      "retinaAIToken"
    );

  };


  // ======================================================
  // Handle Unauthorized
  // ======================================================

  const handleUnauthorized = () => {

    localStorage.removeItem(
      "retinaAIUser"
    );

    localStorage.removeItem(
      "retinaAIToken"
    );

    setUser(null);

    setHistory([]);

    setStats(null);

    setResult(null);

    setSelectedFile(null);

    setPreview(null);

    setAdminStats(null);

    setAdminUsers([]);

    setAdminPredictions([]);

  };


  // ======================================================
  // Validate Current Session
  // ======================================================

  useEffect(() => {

    if (!user) return;


    const validateSession =
      async () => {

        const token =
          getToken();


        if (!token) {

          handleUnauthorized();

          return;

        }


        try {

          const response =
            await fetch(
              `${API_URL}/me`,
              {

                headers: {

                  Authorization:
                    `Bearer ${token}`

                }

              }
            );


          if (
            !response.ok
          ) {

            handleUnauthorized();

          }

        } catch (error) {

          console.error(
            "Session validation error:",
            error
          );

        }

      };


    validateSession();

  }, [user]);


  // ======================================================
  // Fetch User History
  // ======================================================

  const fetchHistory = async () => {

    if (!user) return;


    const token =
      getToken();


    if (!token) {

      handleUnauthorized();

      return;

    }


    try {

      setHistoryLoading(
        true
      );


      const response =
        await fetch(
          `${API_URL}/history`,
          {

            headers: {

              Authorization:
                `Bearer ${token}`

            }

          }
        );


      if (
        response.status === 401
      ) {

        handleUnauthorized();

        return;

      }


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Could not load history."
        );

      }


      if (
        data.success
      ) {

        setHistory(
          data.history
        );

      }

    } catch (error) {

      console.error(
        "History error:",
        error
      );

    } finally {

      setHistoryLoading(
        false
      );

    }

  };


  // ======================================================
  // Fetch User Statistics
  // ======================================================

  const fetchStats = async () => {

    if (!user) return;


    const token =
      getToken();


    if (!token) {

      handleUnauthorized();

      return;

    }


    try {

      setStatsLoading(
        true
      );


      const response =
        await fetch(
          `${API_URL}/stats`,
          {

            headers: {

              Authorization:
                `Bearer ${token}`

            }

          }
        );


      if (
        response.status === 401
      ) {

        handleUnauthorized();

        return;

      }


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Could not load statistics."
        );

      }


      if (
        data.success
      ) {

        setStats(
          data
        );

      }

    } catch (error) {

      console.error(
        "Stats error:",
        error
      );

    } finally {

      setStatsLoading(
        false
      );

    }

  };


  // ======================================================
  // Initial User Dashboard Load
  // ======================================================

  useEffect(() => {

    if (!user) return;

    if (
      user.role === "admin"
    ) return;

    fetchHistory();

    fetchStats();

  }, [user]);


  // ======================================================
  // ADMIN DATA
  // ======================================================

  const fetchAdminData = async () => {

    if (
      !user ||
      user.role !== "admin"
    ) return;


    const token =
      getToken();


    if (!token) {

      handleUnauthorized();

      return;

    }


    try {

      setAdminLoading(
        true
      );


      const headers = {

        Authorization:
          `Bearer ${token}`

      };


      const [
        statsResponse,
        usersResponse,
        predictionsResponse
      ] = await Promise.all([

        fetch(
          `${API_URL}/admin/stats`,
          {
            headers
          }
        ),

        fetch(
          `${API_URL}/admin/users`,
          {
            headers
          }
        ),

        fetch(
          `${API_URL}/admin/predictions`,
          {
            headers
          }
        )

      ]);


      // ==================================================
      // Unauthorized
      // ==================================================

      if (
        statsResponse.status === 401 ||
        usersResponse.status === 401 ||
        predictionsResponse.status === 401
      ) {

        handleUnauthorized();

        return;

      }


      // ==================================================
      // Forbidden
      // ==================================================

      if (
        statsResponse.status === 403 ||
        usersResponse.status === 403 ||
        predictionsResponse.status === 403
      ) {

        alert(
          "Admin access required."
        );

        return;

      }


      const statsData =
        await statsResponse.json();

      const usersData =
        await usersResponse.json();

      const predictionsData =
        await predictionsResponse.json();


      if (
        !statsResponse.ok
      ) {

        throw new Error(
          statsData.detail ||
          "Could not load admin statistics."
        );

      }


      if (
        !usersResponse.ok
      ) {

        throw new Error(
          usersData.detail ||
          "Could not load users."
        );

      }


      if (
        !predictionsResponse.ok
      ) {

        throw new Error(
          predictionsData.detail ||
          "Could not load predictions."
        );

      }


      setAdminStats(
        statsData
      );


      setAdminUsers(
        usersData.users || []
      );


      setAdminPredictions(
        predictionsData.predictions || []
      );


    } catch (error) {

      console.error(
        "Admin dashboard error:",
        error
      );

    } finally {

      setAdminLoading(
        false
      );

    }

  };


  // ======================================================
  // Load Admin Dashboard
  // ======================================================

  useEffect(() => {

    if (
      !user ||
      user.role !== "admin"
    ) return;


    fetchAdminData();

  }, [user]);


  // ======================================================
  // File Selection
  // ======================================================

  const handleFileChange = (
    event
  ) => {

    const file =
      event.target.files[0];


    if (!file) return;


    setSelectedFile(
      file
    );


    setPreview(
      URL.createObjectURL(
        file
      )
    );


    setResult(null);

  };


  // ======================================================
  // Analyze Image
  // ======================================================

  const analyzeImage = async () => {

    if (!selectedFile) return;


    if (!user) {

      alert(
        "Please login first."
      );

      return;

    }


    const token =
      getToken();


    if (!token) {

      alert(
        "Your session has expired. Please login again."
      );

      handleUnauthorized();

      return;

    }


    setLoading(true);

    setResult(null);


    const formData =
      new FormData();


    formData.append(
      "file",
      selectedFile
    );


    try {

      const response =
        await fetch(
          `${API_URL}/predict`,
          {

            method: "POST",

            headers: {

              Authorization:
                `Bearer ${token}`

            },

            body:
              formData

          }
        );


      if (
        response.status === 401
      ) {

        handleUnauthorized();

        alert(
          "Your session has expired. Please login again."
        );

        return;

      }


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Prediction failed"
        );

      }


      setResult(
        data
      );


      await fetchHistory();

      await fetchStats();


    } catch (error) {

      console.error(
        "Prediction error:",
        error
      );

      alert(
        error.message ||
        "Could not connect to AI backend."
      );

    } finally {

      setLoading(
        false
      );

    }

  };


  // ======================================================
  // Format Date
  // ======================================================

  const formatDate = (
    dateString
  ) => {

    if (!dateString) {

      return "N/A";

    }


    return new Date(
      dateString
    ).toLocaleString(
      "en-IN",
      {

        dateStyle:
          "medium",

        timeStyle:
          "short"

      }
    );

  };


  // ======================================================
  // USER CHART
  // ======================================================

  const chartData = {

    labels: [

      "No DR",

      "Mild",

      "Moderate",

      "Severe",

      "Proliferative DR"

    ],


    datasets: [

      {

        label:
          "Predictions",


        data: stats

          ? [

              stats.class_distribution[
                "No DR"
              ],

              stats.class_distribution[
                "Mild"
              ],

              stats.class_distribution[
                "Moderate"
              ],

              stats.class_distribution[
                "Severe"
              ],

              stats.class_distribution[
                "Proliferative DR"
              ]

            ]

          : [

              0,

              0,

              0,

              0,

              0

            ],


        backgroundColor: [

          "#35d39a",

          "#71c7ff",

          "#ffca5c",

          "#ff9b72",

          "#ff7184"

        ],


        borderColor:
          "#101f33",


        borderWidth:
          3,


        hoverOffset:
          8

      }

    ]

  };


  // ======================================================
  // ADMIN CHART
  // ======================================================

  const adminChartData = {

    labels: [

      "No DR",

      "Mild",

      "Moderate",

      "Severe",

      "Proliferative DR"

    ],


    datasets: [

      {

        label:
          "All Predictions",


        data:
          adminStats
            ? [

                adminStats.class_distribution[
                  "No DR"
                ],

                adminStats.class_distribution[
                  "Mild"
                ],

                adminStats.class_distribution[
                  "Moderate"
                ],

                adminStats.class_distribution[
                  "Severe"
                ],

                adminStats.class_distribution[
                  "Proliferative DR"
                ]

              ]
            : [

                0,

                0,

                0,

                0,

                0

              ],


        backgroundColor: [

          "#35d39a",

          "#71c7ff",

          "#ffca5c",

          "#ff9b72",

          "#ff7184"

        ],


        borderColor:
          "#101f33",


        borderWidth:
          3,


        hoverOffset:
          8

      }

    ]

  };


  // ======================================================
  // LOGIN / REGISTER SCREEN
  // ======================================================

  if (!user) {

    return (

      <div className="auth-page">

        <div className="auth-card">

          <div className="auth-logo">
            🩺 RetinaAI
          </div>


          <div className="auth-status">

            <span className="status-dot"></span>

            AI System Online

          </div>


          <div className="auth-heading">

            <div className="badge">
              AI-ASSISTED SCREENING
            </div>


            <h1>

              {authMode === "login"
                ? "Welcome Back"
                : "Create Account"}

            </h1>


            <p>

              {authMode === "login"

                ? "Login to access your retinal screening dashboard."

                : "Create your RetinaAI account to start using the AI screening system."

              }

            </p>

          </div>


          <form
            className="auth-form"
            onSubmit={
              handleAuthSubmit
            }
          >


            {authMode === "register" && (

              <div className="form-group">

                <label>
                  Full Name
                </label>

                <input
                  type="text"
                  name="name"
                  placeholder="Enter your name"
                  value={
                    authForm.name
                  }
                  onChange={
                    handleAuthChange
                  }
                  required
                />

              </div>

            )}


            <div className="form-group">

              <label>
                Email
              </label>

              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                value={
                  authForm.email
                }
                onChange={
                  handleAuthChange
                }
                required
              />

            </div>


            <div className="form-group">

              <label>
                Password
              </label>

              <input
                type="password"
                name="password"
                placeholder="Enter your password"
                value={
                  authForm.password
                }
                onChange={
                  handleAuthChange
                }
                minLength="6"
                required
              />

            </div>


            {authError && (

              <div className="auth-error">

                ⚠️ {authError}

              </div>

            )}


            {authSuccess && (

              <div className="auth-success">

                ✓ {authSuccess}

              </div>

            )}


            <button
              className="auth-submit"
              type="submit"
              disabled={
                authLoading
              }
            >

              {authLoading

                ? "Please wait..."

                : authMode === "login"

                  ? "Login"

                  : "Create Account"

              }

            </button>


          </form>


          <div className="auth-switch">

            {authMode === "login"

              ? "Don't have an account?"

              : "Already have an account?"

            }


            <button
              type="button"
              onClick={() => {

                setAuthMode(

                  authMode === "login"
                    ? "register"
                    : "login"

                );

                setAuthError("");

                setAuthSuccess("");

              }}
            >

              {authMode === "login"
                ? " Register"
                : " Login"}

            </button>

          </div>


          <div className="auth-disclaimer">

            AI-assisted screening prototype.
            Not a medical diagnosis.

          </div>

        </div>

      </div>

    );

  }


  // ======================================================
  // ADMIN DASHBOARD
  // ======================================================

  if (
    user.role === "admin"
  ) {

    return (

      <div className="app">


        {/* ============================================
            ADMIN NAVBAR
        ============================================ */}

        <nav className="navbar">

          <div className="logo">
            🩺 RetinaAI
          </div>


          <div className="nav-right">

            <div className="nav-user">

              👤 {user.name}

              <span
                style={{
                  marginLeft: "8px",
                  padding: "4px 9px",
                  borderRadius: "999px",
                  fontSize: "11px",
                  fontWeight: "700",
                  background: "rgba(104,117,255,0.18)",
                  color: "#9ca7ff"
                }}
              >
                ADMIN
              </span>

            </div>


            <div className="nav-status">

              <span className="status-dot"></span>

              Admin System Online

            </div>


            <button
              className="logout-btn"
              onClick={
                handleLogout
              }
            >

              Logout

            </button>

          </div>

        </nav>


        {/* ============================================
            ADMIN LAYOUT
        ============================================ */}

        <div
          style={{
            display: "flex",
            minHeight: "calc(100vh - 72px)"
          }}
        >


          {/* ==========================================
              SIDEBAR
          ========================================== */}

          <aside
            style={{
              width: "230px",
              flexShrink: 0,
              background: "#0b192b",
              borderRight: "1px solid #20344d",
              padding: "28px 16px",
              boxSizing: "border-box"
            }}
          >

            <div
              style={{
                marginBottom: "25px",
                padding: "0 10px"
              }}
            >

              <div
                style={{
                  fontSize: "11px",
                  color: "#71849b",
                  fontWeight: "700",
                  letterSpacing: "1px",
                  textTransform: "uppercase"
                }}
              >
                Administration
              </div>

            </div>


            {/* Dashboard */}

            <button
              onClick={() =>
                setAdminSection(
                  "dashboard"
                )
              }
              style={{
                width: "100%",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                padding: "13px 14px",
                marginBottom: "7px",
                borderRadius: "10px",
                background:
                  adminSection === "dashboard"
                    ? "rgba(53,198,244,0.12)"
                    : "transparent",
                color:
                  adminSection === "dashboard"
                    ? "#35c6f4"
                    : "#a9bad0",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >

              📊 &nbsp; Dashboard

            </button>


            {/* Users */}

            <button
              onClick={() =>
                setAdminSection(
                  "users"
                )
              }
              style={{
                width: "100%",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                padding: "13px 14px",
                marginBottom: "7px",
                borderRadius: "10px",
                background:
                  adminSection === "users"
                    ? "rgba(53,198,244,0.12)"
                    : "transparent",
                color:
                  adminSection === "users"
                    ? "#35c6f4"
                    : "#a9bad0",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >

              👥 &nbsp; Users

            </button>


            {/* Predictions */}

            <button
              onClick={() =>
                setAdminSection(
                  "predictions"
                )
              }
              style={{
                width: "100%",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                padding: "13px 14px",
                marginBottom: "7px",
                borderRadius: "10px",
                background:
                  adminSection === "predictions"
                    ? "rgba(53,198,244,0.12)"
                    : "transparent",
                color:
                  adminSection === "predictions"
                    ? "#35c6f4"
                    : "#a9bad0",
                fontSize: "14px",
                fontWeight: "600"
              }}
            >

              🔬 &nbsp; Predictions

            </button>


            <div
              style={{
                marginTop: "30px",
                padding: "14px",
                borderRadius: "12px",
                background: "#101f33",
                border: "1px solid #20344d"
              }}
            >

              <div
                style={{
                  fontSize: "11px",
                  color: "#71849b",
                  marginBottom: "6px"
                }}
              >
                LOGGED IN AS
              </div>


              <div
                style={{
                  fontSize: "13px",
                  color: "#f5f9ff",
                  fontWeight: "600",
                  wordBreak: "break-word"
                }}
              >
                {user.email}
              </div>

            </div>

          </aside>


          {/* ==========================================
              ADMIN CONTENT
          ========================================== */}

          <main
            style={{
              flex: 1,
              padding: "35px",
              minWidth: 0,
              boxSizing: "border-box"
            }}
          >


            {/* ========================================
                DASHBOARD VIEW
            ======================================== */}

            {adminSection === "dashboard" && (

              <>

                <div
                  className="dashboard-header"
                  style={{
                    marginBottom: "25px"
                  }}
                >

                  <div>

                    <div className="badge">
                      ADMIN CONTROL CENTER
                    </div>

                    <h2
                      style={{
                        marginTop: "12px"
                      }}
                    >
                      Admin Dashboard
                    </h2>

                    <p>
                      Monitor users, AI predictions and
                      system-wide screening activity.
                    </p>

                  </div>


                  <button
                    className="refresh-btn"
                    onClick={
                      fetchAdminData
                    }
                    disabled={
                      adminLoading
                    }
                  >

                    {adminLoading
                      ? "↻ Loading..."
                      : "↻ Refresh"}

                  </button>

                </div>


                {/* ==================================
                    STAT CARDS
                ================================== */}

                <div className="stats-grid">


                  {/* Users */}

                  <div className="stat-card">

                    <div className="stat-icon">
                      👥
                    </div>

                    <span>
                      Total Users
                    </span>

                    <strong>

                      {adminLoading
                        ? "..."
                        : adminStats?.total_users ?? 0}

                    </strong>

                  </div>


                  {/* Predictions */}

                  <div className="stat-card">

                    <div className="stat-icon">
                      🔬
                    </div>

                    <span>
                      Total Predictions
                    </span>

                    <strong>

                      {adminLoading
                        ? "..."
                        : adminStats?.total_predictions ?? 0}

                    </strong>

                  </div>


                  {/* DR Detected */}

                  <div className="stat-card">

                    <div className="stat-icon">
                      🩺
                    </div>

                    <span>
                      DR Detected
                    </span>

                    <strong>

                      {adminLoading
                        ? "..."
                        : adminStats?.dr_detected ?? 0}

                    </strong>

                  </div>


                  {/* Confidence */}

                  <div className="stat-card">

                    <div className="stat-icon">
                      🎯
                    </div>

                    <span>
                      Avg. Confidence
                    </span>

                    <strong>

                      {adminLoading
                        ? "..."
                        : `${adminStats?.average_confidence ?? 0}%`}

                    </strong>

                  </div>

                </div>


                {/* ==================================
                    CHART + SYSTEM INFO
                ================================== */}

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "minmax(0, 1.3fr) minmax(280px, 0.7fr)",
                    gap: "20px",
                    marginTop: "20px"
                  }}
                >


                  {/* Chart */}

                  <div
                    className="chart-card"
                    style={{
                      marginTop: 0
                    }}
                  >

                    <div>

                      <h3>
                        System-wide DR Distribution
                      </h3>

                      <p>
                        All predictions made across
                        registered users.
                      </p>

                    </div>


                    <div className="chart-container">

                      <Doughnut

                        data={
                          adminChartData
                        }

                        options={{

                          responsive: true,

                          maintainAspectRatio:
                            false,

                          cutout:
                            "65%",

                          plugins: {

                            legend: {

                              position:
                                "bottom",

                              labels: {

                                color:
                                  "#a9bad0",

                                padding:
                                  18,

                                usePointStyle:
                                  true,

                                pointStyle:
                                  "circle",

                                font: {

                                  size:
                                    12,

                                  weight:
                                    "600"

                                }

                              }

                            },


                            tooltip: {

                              backgroundColor:
                                "#101f33",

                              titleColor:
                                "#ffffff",

                              bodyColor:
                                "#a9bad0",

                              borderColor:
                                "#20344d",

                              borderWidth:
                                1,

                              padding:
                                12,

                              callbacks: {

                                label:
                                  function(
                                    context
                                  ) {

                                    const value =
                                      context.raw;

                                    return ` ${context.label}: ${value} scans`;

                                  }

                              }

                            }

                          }

                        }}

                      />

                    </div>

                  </div>


                  {/* System Overview */}

                  <div
                    style={{
                      background: "#101f33",
                      border: "1px solid #20344d",
                      borderRadius: "16px",
                      padding: "25px"
                    }}
                  >

                    <h3
                      style={{
                        marginTop: 0,
                        color: "#f5f9ff"
                      }}
                    >
                      System Overview
                    </h3>


                    <p
                      style={{
                        color: "#71849b",
                        fontSize: "13px",
                        lineHeight: "1.6"
                      }}
                    >
                      RetinaAI provides AI-assisted
                      diabetic retinopathy screening
                      using an EfficientNet-B0 model.
                    </p>


                    <div
                      style={{
                        borderTop:
                          "1px solid #20344d",
                        marginTop: "20px",
                        paddingTop: "18px"
                      }}
                    >

                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "14px"
                        }}
                      >

                        <span
                          style={{
                            color: "#71849b",
                            fontSize: "13px"
                          }}
                        >
                          Model
                        </span>

                        <strong
                          style={{
                            color: "#35c6f4",
                            fontSize: "13px"
                          }}
                        >
                          EfficientNet-B0
                        </strong>

                      </div>


                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "14px"
                        }}
                      >

                        <span
                          style={{
                            color: "#71849b",
                            fontSize: "13px"
                          }}
                        >
                          Classes
                        </span>

                        <strong
                          style={{
                            color: "#f5f9ff",
                            fontSize: "13px"
                          }}
                        >
                          5 Stages
                        </strong>

                      </div>


                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between"
                        }}
                      >

                        <span
                          style={{
                            color: "#71849b",
                            fontSize: "13px"
                          }}
                        >
                          Explainability
                        </span>

                        <strong
                          style={{
                            color: "#35d39a",
                            fontSize: "13px"
                          }}
                        >
                          Grad-CAM
                        </strong>

                      </div>

                    </div>

                  </div>

                </div>


                {/* ==================================
                    RECENT USERS
                ================================== */}

                <div
                  className="history-section"
                  style={{
                    marginTop: "25px"
                  }}
                >

                  <div className="history-header">

                    <div>

                      <h2>
                        Recent Users
                      </h2>

                      <p>
                        Latest registered RetinaAI users
                      </p>

                    </div>


                    <button
                      className="refresh-btn"
                      onClick={() =>
                        setAdminSection(
                          "users"
                        )
                      }
                    >

                      View All

                    </button>

                  </div>


                  {adminUsers.length === 0 ? (

                    <div className="history-empty">

                      No users found.

                    </div>

                  ) : (

                    <div className="history-table-wrapper">

                      <table className="history-table">

                        <thead>

                          <tr>

                            <th>
                              #
                            </th>

                            <th>
                              Name
                            </th>

                            <th>
                              Email
                            </th>

                            <th>
                              Role
                            </th>

                            <th>
                              Joined
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {adminUsers
                            .slice(0, 5)
                            .map(
                              (item) => (

                                <tr
                                  key={
                                    item.id
                                  }
                                >

                                  <td>
                                    {item.id}
                                  </td>

                                  <td>

                                    <strong>
                                      {item.name}
                                    </strong>

                                  </td>

                                  <td>

                                    <span className="filename">
                                      {item.email}
                                    </span>

                                  </td>

                                  <td>

                                    <span
                                      style={{
                                        display: "inline-block",
                                        padding: "5px 9px",
                                        borderRadius: "999px",
                                        background:
                                          item.role === "admin"
                                            ? "rgba(104,117,255,0.15)"
                                            : "rgba(53,198,244,0.10)",
                                        color:
                                          item.role === "admin"
                                            ? "#9ca7ff"
                                            : "#71c7ff",
                                        fontSize: "11px",
                                        fontWeight: "700",
                                        textTransform: "uppercase"
                                      }}
                                    >
                                      {item.role}
                                    </span>

                                  </td>

                                  <td>
                                    {formatDate(
                                      item.created_at
                                    )}
                                  </td>

                                </tr>

                              )
                            )}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>


                {/* ==================================
                    RECENT PREDICTIONS
                ================================== */}

                <div
                  className="history-section"
                  style={{
                    marginTop: "25px"
                  }}
                >

                  <div className="history-header">

                    <div>

                      <h2>
                        Recent Predictions
                      </h2>

                      <p>
                        Latest AI screening activity
                      </p>

                    </div>


                    <button
                      className="refresh-btn"
                      onClick={() =>
                        setAdminSection(
                          "predictions"
                        )
                      }
                    >

                      View All

                    </button>

                  </div>


                  {adminPredictions.length === 0 ? (

                    <div className="history-empty">

                      No predictions found.

                    </div>

                  ) : (

                    <div className="history-table-wrapper">

                      <table className="history-table">

                        <thead>

                          <tr>

                            <th>
                              User
                            </th>

                            <th>
                              Image
                            </th>

                            <th>
                              Stage
                            </th>

                            <th>
                              Confidence
                            </th>

                            <th>
                              Date
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {adminPredictions
                            .slice(0, 8)
                            .map(
                              (item) => (

                                <tr
                                  key={
                                    item.id
                                  }
                                >

                                  <td>

                                    <div>
                                      <strong>
                                        {item.user_name}
                                      </strong>
                                    </div>

                                    <span
                                      style={{
                                        color: "#71849b",
                                        fontSize: "11px"
                                      }}
                                    >
                                      {item.user_email}
                                    </span>

                                  </td>


                                  <td>

                                    <span className="filename">

                                      {item.filename}

                                    </span>

                                  </td>


                                  <td>

                                    <span
                                      className={`stage stage-${item.class_id}`}
                                    >
                                      {item.class_name}
                                    </span>

                                  </td>


                                  <td>

                                    <strong>
                                      {item.confidence}%
                                    </strong>

                                  </td>


                                  <td>

                                    {formatDate(
                                      item.created_at
                                    )}

                                  </td>

                                </tr>

                              )
                            )}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>


              </>

            )}


            {/* ========================================
                USERS VIEW
            ======================================== */}

            {adminSection === "users" && (

              <>

                <div
                  className="dashboard-header"
                  style={{
                    marginBottom: "25px"
                  }}
                >

                  <div>

                    <div className="badge">
                      USER MANAGEMENT
                    </div>

                    <h2
                      style={{
                        marginTop: "12px"
                      }}
                    >
                      Registered Users
                    </h2>

                    <p>
                      View all registered RetinaAI
                      accounts.
                    </p>

                  </div>


                  <button
                    className="refresh-btn"
                    onClick={
                      fetchAdminData
                    }
                  >
                    ↻ Refresh
                  </button>

                </div>


                <div
                  className="history-section"
                  style={{
                    marginTop: 0
                  }}
                >

                  <div className="history-header">

                    <div>

                      <h2>
                        All Users
                      </h2>

                      <p>
                        {adminUsers.length} registered
                        account(s)
                      </p>

                    </div>

                  </div>


                  {adminUsers.length === 0 ? (

                    <div className="history-empty">
                      No users found.
                    </div>

                  ) : (

                    <div className="history-table-wrapper">

                      <table className="history-table">

                        <thead>

                          <tr>

                            <th>
                              ID
                            </th>

                            <th>
                              Name
                            </th>

                            <th>
                              Email
                            </th>

                            <th>
                              Role
                            </th>

                            <th>
                              Created
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {adminUsers.map(
                            (item) => (

                              <tr
                                key={
                                  item.id
                                }
                              >

                                <td>
                                  #{item.id}
                                </td>

                                <td>

                                  <strong>
                                    {item.name}
                                  </strong>

                                </td>

                                <td>

                                  {item.email}

                                </td>

                                <td>

                                  <span
                                    style={{
                                      display: "inline-block",
                                      padding: "5px 9px",
                                      borderRadius: "999px",
                                      background:
                                        item.role === "admin"
                                          ? "rgba(104,117,255,0.15)"
                                          : "rgba(53,198,244,0.10)",
                                      color:
                                        item.role === "admin"
                                          ? "#9ca7ff"
                                          : "#71c7ff",
                                      fontSize: "11px",
                                      fontWeight: "700",
                                      textTransform: "uppercase"
                                    }}
                                  >
                                    {item.role}
                                  </span>

                                </td>

                                <td>

                                  {formatDate(
                                    item.created_at
                                  )}

                                </td>

                              </tr>

                            )
                          )}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>

              </>

            )}


            {/* ========================================
                PREDICTIONS VIEW
            ======================================== */}

            {adminSection === "predictions" && (

              <>

                <div
                  className="dashboard-header"
                  style={{
                    marginBottom: "25px"
                  }}
                >

                  <div>

                    <div className="badge">
                      AI ACTIVITY
                    </div>

                    <h2
                      style={{
                        marginTop: "12px"
                      }}
                    >
                      Prediction History
                    </h2>

                    <p>
                      System-wide AI screening predictions.
                    </p>

                  </div>


                  <button
                    className="refresh-btn"
                    onClick={
                      fetchAdminData
                    }
                  >
                    ↻ Refresh
                  </button>

                </div>


                <div
                  className="history-section"
                  style={{
                    marginTop: 0
                  }}
                >

                  <div className="history-header">

                    <div>

                      <h2>
                        Recent Predictions
                      </h2>

                      <p>
                        Showing latest{" "}
                        {adminPredictions.length}{" "}
                        prediction(s)
                      </p>

                    </div>

                  </div>


                  {adminPredictions.length === 0 ? (

                    <div className="history-empty">

                      No predictions found.

                    </div>

                  ) : (

                    <div className="history-table-wrapper">

                      <table className="history-table">

                        <thead>

                          <tr>

                            <th>
                              ID
                            </th>

                            <th>
                              User
                            </th>

                            <th>
                              Image
                            </th>

                            <th>
                              Stage
                            </th>

                            <th>
                              Confidence
                            </th>

                            <th>
                              Date
                            </th>

                          </tr>

                        </thead>


                        <tbody>

                          {adminPredictions.map(
                            (item) => (

                              <tr
                                key={
                                  item.id
                                }
                              >

                                <td>
                                  #{item.id}
                                </td>


                                <td>

                                  <div>
                                    <strong>
                                      {item.user_name}
                                    </strong>
                                  </div>

                                  <span
                                    style={{
                                      color: "#71849b",
                                      fontSize: "11px"
                                    }}
                                  >
                                    {item.user_email}
                                  </span>

                                </td>


                                <td>

                                  <span className="filename">

                                    {item.filename}

                                  </span>

                                </td>


                                <td>

                                  <span
                                    className={`stage stage-${item.class_id}`}
                                  >

                                    {item.class_name}

                                  </span>

                                </td>


                                <td>

                                  <strong>
                                    {item.confidence}%
                                  </strong>

                                </td>


                                <td>

                                  {formatDate(
                                    item.created_at
                                  )}

                                </td>

                              </tr>

                            )
                          )}

                        </tbody>

                      </table>

                    </div>

                  )}

                </div>

              </>

            )}


            {/* ========================================
                ADMIN DISCLAIMER
            ======================================== */}

            <div
              className="disclaimer"
              style={{
                marginTop: "30px"
              }}
            >

              ⚠️ RetinaAI is an AI-assisted screening
              prototype. Predictions are not medical
              diagnoses and should not replace evaluation
              by a qualified healthcare professional.

            </div>


          </main>

        </div>

      </div>

    );

  }


  // ======================================================
  // NORMAL USER DASHBOARD
  // ======================================================

  return (

    <div className="app">


      {/* =========================
          Navbar
      ========================= */}

      <nav className="navbar">

        <div className="logo">
          🩺 RetinaAI
        </div>


        <div className="nav-right">

          <div className="nav-user">

            👤 {user.name}

          </div>


          <div className="nav-status">

            <span className="status-dot"></span>

            AI System Online

          </div>


          <button
            className="logout-btn"
            onClick={
              handleLogout
            }
          >

            Logout

          </button>

        </div>

      </nav>


      <main className="container">


        {/* =========================
            Hero
        ========================= */}

        <section className="hero">

          <div className="badge">
            AI-ASSISTED SCREENING
          </div>


          <h1>

            Diabetic Retinopathy
            <span> Detection</span>

          </h1>


          <p>

            Welcome back,{" "}
            <strong>
              {user.name}
            </strong>
            . Upload a retinal fundus image and let
            our AI model classify the stage of
            diabetic retinopathy with explainable AI.

          </p>

        </section>


        {/* =========================
            Dashboard
        ========================= */}

        <section className="dashboard">

          <div className="dashboard-header">

            <div>

              <h2>
                Analytics Dashboard
              </h2>

              <p>
                Overview of your AI screening activity
              </p>

            </div>


            <button
              className="refresh-btn"
              onClick={() => {

                fetchStats();

                fetchHistory();

              }}
            >

              ↻ Refresh

            </button>

          </div>


          <div className="stats-grid">


            <div className="stat-card">

              <div className="stat-icon">
                📊
              </div>

              <span>
                Total Scans
              </span>

              <strong>

                {statsLoading
                  ? "..."
                  : stats?.total_scans ?? 0}

              </strong>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                🔍
              </div>

              <span>
                DR Detected
              </span>

              <strong>

                {statsLoading
                  ? "..."
                  : stats?.dr_detected ?? 0}

              </strong>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                👁️
              </div>

              <span>
                No DR
              </span>

              <strong>

                {statsLoading
                  ? "..."
                  : stats?.no_dr ?? 0}

              </strong>

            </div>


            <div className="stat-card">

              <div className="stat-icon">
                🎯
              </div>

              <span>
                Avg. Confidence
              </span>

              <strong>

                {statsLoading
                  ? "..."
                  : `${stats?.average_confidence ?? 0}%`}

              </strong>

            </div>


          </div>


          {/* =========================
              Chart
          ========================= */}

          <div className="chart-card">

            <div>

              <h3>
                DR Stage Distribution
              </h3>

              <p>
                Distribution of predictions across
                diabetic retinopathy stages
              </p>

            </div>


            <div className="chart-container">

              <Doughnut

                data={chartData}

                options={{

                  responsive: true,

                  maintainAspectRatio:
                    false,

                  cutout:
                    "65%",

                  plugins: {

                    legend: {

                      position:
                        "bottom",

                      labels: {

                        color:
                          "#a9bad0",

                        padding:
                          18,

                        usePointStyle:
                          true,

                        pointStyle:
                          "circle",

                        font: {

                          size:
                            12,

                          weight:
                            "600"

                        }

                      }

                    },


                    tooltip: {

                      backgroundColor:
                        "#101f33",

                      titleColor:
                        "#ffffff",

                      bodyColor:
                        "#a9bad0",

                      borderColor:
                        "#20344d",

                      borderWidth:
                        1,

                      padding:
                        12,

                      callbacks: {

                        label:
                          function(
                            context
                          ) {

                            const value =
                              context.raw;

                            return ` ${context.label}: ${value} scans`;

                          }

                      }

                    }

                  }

                }}

              />

            </div>

          </div>

        </section>


        {/* =========================
            Upload
        ========================= */}

        <section className="upload-card">

          <h2>
            Upload Fundus Image
          </h2>


          <p className="subtitle">

            Supported formats:
            JPG, JPEG, PNG

          </p>


          <label className="upload-area">

            {preview ? (

              <img
                src={preview}
                alt="Retinal preview"
                className="preview-image"
              />

            ) : (

              <>

                <div className="upload-icon">
                  📤
                </div>


                <strong>
                  Click to upload
                </strong>


                <span>
                  or drag and drop your retinal image
                </span>

              </>

            )}


            <input
              type="file"
              accept="image/*"
              onChange={
                handleFileChange
              }
            />

          </label>


          <button
            className="analyze-btn"
            onClick={
              analyzeImage
            }
            disabled={
              !selectedFile ||
              loading
            }
          >

            {loading
              ? "Analyzing..."
              : "Analyze Retina"}

          </button>

        </section>


        {/* =========================
            Result
        ========================= */}

        {result && (

          <section className="results">

            <h2>
              Analysis Result
            </h2>


            <div className="result-grid">


              <div className="image-card">

                <h3>
                  Original Image
                </h3>


                <img
                  src={preview}
                  alt="Original retina"
                />

              </div>


              <div className="image-card">

                <h3>
                  Grad-CAM Explanation
                </h3>


                <img
                  src={`${API_URL}${result.explainability.heatmap_url}?t=${Date.now()}`}
                  alt="Grad-CAM heatmap"
                />

              </div>


            </div>


            <div className="prediction-card">

              <div>

                <span className="label">
                  Predicted Stage
                </span>


                <h3>
                  {result.prediction.class_name}
                </h3>

              </div>


              <div className="confidence">

                <span className="label">
                  Confidence
                </span>


                <strong>
                  {result.prediction.confidence}%
                </strong>

              </div>

            </div>


            <div className="disclaimer">

              ⚠️ This is an AI-assisted screening
              prototype and is not a medical diagnosis.

            </div>

          </section>

        )}


        {/* =========================
            History
        ========================= */}

        <section className="history-section">

          <div className="history-header">

            <div>

              <h2>
                Prediction History
              </h2>


              <p>
                Previous retinal image analyses
              </p>

            </div>

          </div>


          {historyLoading ? (

            <div className="history-empty">

              Loading prediction history...

            </div>

          ) : history.length === 0 ? (

            <div className="history-empty">

              <div className="history-icon">
                📋
              </div>


              <h3>
                No predictions yet
              </h3>


              <p>
                Your previous analyses will appear here.
              </p>

            </div>

          ) : (

            <div className="history-table-wrapper">

              <table className="history-table">

                <thead>

                  <tr>

                    <th>
                      #
                    </th>

                    <th>
                      Image
                    </th>

                    <th>
                      Predicted Stage
                    </th>

                    <th>
                      Confidence
                    </th>

                    <th>
                      Date
                    </th>

                  </tr>

                </thead>


                <tbody>

                  {history.map(
                    (item, index) => (

                      <tr
                        key={
                          item.id
                        }
                      >

                        <td>
                          {index + 1}
                        </td>


                        <td>

                          <span className="filename">

                            {item.filename}

                          </span>

                        </td>


                        <td>

                          <span
                            className={`stage stage-${item.class_id}`}
                          >

                            {item.class_name}

                          </span>

                        </td>


                        <td>

                          <strong>
                            {item.confidence}%
                          </strong>

                        </td>


                        <td>

                          {formatDate(
                            item.created_at
                          )}

                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </section>


      </main>

    </div>

  );

}


export default App;