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


function App() {

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


  // =========================
  // History
  // =========================

  const [
    history,
    setHistory
  ] = useState([]);

  const [
    historyLoading,
    setHistoryLoading
  ] = useState(true);


  // =========================
  // Statistics
  // =========================

  const [
    stats,
    setStats
  ] = useState(null);

  const [
    statsLoading,
    setStatsLoading
  ] = useState(true);


  // =========================
  // Fetch History
  // =========================

  const fetchHistory = async () => {

    try {

      const response =
        await fetch(
          `${API_URL}/history`
        );

      const data =
        await response.json();

      if (data.success) {

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

      setHistoryLoading(false);

    }

  };


  // =========================
  // Fetch Statistics
  // =========================

  const fetchStats = async () => {

    try {

      const response =
        await fetch(
          `${API_URL}/stats`
        );

      const data =
        await response.json();

      if (data.success) {

        setStats(data);

      }

    } catch (error) {

      console.error(
        "Stats error:",
        error
      );

    } finally {

      setStatsLoading(false);

    }

  };


  // =========================
  // Initial Load
  // =========================

  useEffect(() => {

    fetchHistory();

    fetchStats();

  }, []);


  // =========================
  // File Selection
  // =========================

  const handleFileChange = (
    event
  ) => {

    const file =
      event.target.files[0];

    if (!file) return;

    setSelectedFile(file);

    setPreview(
      URL.createObjectURL(file)
    );

    setResult(null);

  };


  // =========================
  // Analyze Image
  // =========================

  const analyzeImage = async () => {

    if (!selectedFile) return;

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
            body: formData
          }
        );


      const data =
        await response.json();


      if (!response.ok) {

        throw new Error(
          data.detail ||
          "Prediction failed"
        );

      }


      setResult(data);


      // Refresh dashboard
      await fetchHistory();

      await fetchStats();


    } catch (error) {

      console.error(error);

      alert(
        error.message ||
        "Could not connect to AI backend."
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================
  // Format Date
  // =========================

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
        dateStyle: "medium",
        timeStyle: "short"
      }
    );

  };


  // =========================
  // Chart Data
  // =========================

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

        /*
          Stage colours

          0 = No DR             → Green
          1 = Mild              → Blue
          2 = Moderate          → Yellow
          3 = Severe            → Orange
          4 = Proliferative DR  → Red
        */

        backgroundColor: [
          "#35d39a",
          "#71c7ff",
          "#ffca5c",
          "#ff9b72",
          "#ff7184"
        ],

        borderColor: "#101f33",

        borderWidth: 3,

        hoverOffset: 8

      }

    ]

  };


  return (

    <div className="app">


      {/* =========================
          Navbar
      ========================= */}

      <nav className="navbar">

        <div className="logo">
          🩺 RetinaAI
        </div>

        <div className="nav-status">

          <span className="status-dot"></span>

          AI System Online

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

            Upload a retinal fundus image and let
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


            {/* Total Scans */}

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


            {/* DR Detected */}

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


            {/* No DR */}

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


            {/* Average Confidence */}

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

                  maintainAspectRatio: false,

                  cutout: "65%",

                  plugins: {

                    legend: {

                      position: "bottom",

                      labels: {

                        color: "#a9bad0",

                        padding: 18,

                        usePointStyle: true,

                        pointStyle: "circle",

                        font: {

                          size: 12,

                          weight: "600"

                        }

                      }

                    },

                    tooltip: {

                      backgroundColor: "#101f33",

                      titleColor: "#ffffff",

                      bodyColor: "#a9bad0",

                      borderColor: "#20344d",

                      borderWidth: 1,

                      padding: 12,

                      callbacks: {

                        label: function(context) {

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
              onChange={handleFileChange}
            />

          </label>


          <button
            className="analyze-btn"
            onClick={analyzeImage}
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
                        key={item.id}
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