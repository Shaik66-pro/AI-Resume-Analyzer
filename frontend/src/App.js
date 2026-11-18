import React, { useState, useEffect } from "react";
import "./App.css";

// Backend API Base URL
const API_BASE_URL = "http://localhost:5000";

function App() {
  const [activeTab, setActiveTab] = useState("analyze"); // 'analyze' or 'history'

  // Form states
  const [candidateName, setCandidateName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // Current analysis result
  const [currentResult, setCurrentResult] = useState(null);

  // Past reports history state
  const [reports, setReports] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch reports when switching to the 'history' tab
  useEffect(() => {
    if (activeTab === "history") {
      fetchReports();
    }
  }, [activeTab]);

  // Function to fetch past reports from MySQL via Flask API
  const fetchReports = async () => {
    setHistoryLoading(true);
    setErrorMessage("");
    try {
      const response = await fetch(`${API_BASE_URL}/reports`);
      const data = await response.json();
      if (response.ok) {
        setReports(data);
      } else {
        setErrorMessage(data.error || "Failed to fetch reports");
      }
    } catch (err) {
      setErrorMessage("Could not connect to Flask backend. Please make sure it is running.");
    } finally {
      setHistoryLoading(false);
    }
  };

  // Helper to load sample test data for instant testing
  const handleLoadSample = () => {
    setCandidateName("Alex Mercer");
    setJobTitle("Full Stack Python & AI Engineer");
    setResumeText(`
Alex Mercer - Software Engineer
Skills: Python, Flask, React, JavaScript, SQL, MySQL, Git, Docker, REST API.
Experience:
- Developed REST APIs with Flask and integrated with MySQL database.
- Created interactive web applications using React.js and modern CSS.
- Implemented basic data analysis and NLP workflows with scikit-learn.
- Containerized microservices using Docker and managed Git workflows.
    `.trim());
    setJobDescription(`
We are looking for an experienced Full Stack Python & AI Engineer.
Required Qualifications:
- Strong proficiency in Python, Flask or FastAPI, React.js, and TypeScript.
- Deep hands-on experience with MySQL or PostgreSQL databases.
- Experience with NLP, TF-IDF, Cosine Similarity, and Machine Learning models.
- Familiarity with Cloud platforms (AWS, Docker, CI/CD).
- Excellent communication and problem-solving skills.
    `.trim());
  };

  // Handle Form Submission for Resume Analysis
  const handleAnalyze = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setCurrentResult(null);

    // Basic frontend check
    if (!candidateName.trim() || !jobTitle.trim() || !resumeText.trim() || !jobDescription.trim()) {
      setErrorMessage("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          candidate_name: candidateName,
          job_title: jobTitle,
          resume_text: resumeText,
          job_description: jobDescription,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentResult(data);
        setSuccessMessage("Resume successfully analyzed and saved to MySQL!");
      } else {
        setErrorMessage(data.error || "Analysis failed");
      }
    } catch (err) {
      setErrorMessage("Network error: Make sure Flask backend is running on http://localhost:5000");
    } finally {
      setLoading(false);
    }
  };

  // Delete a report
  const handleDeleteReport = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report?")) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reports/${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        setReports(reports.filter((r) => r.id !== id));
      } else {
        alert("Failed to delete report.");
      }
    } catch (err) {
      alert("Error deleting report: Backend unreachable.");
    }
  };

  // Score color helper
  const getScoreClass = (score) => {
    if (score >= 75) return "score-high";
    if (score >= 50) return "score-medium";
    return "score-low";
  };

  return (
    <div className="container">
      {/* App Header */}
      <header className="app-header">
        <h1>AI Resume Analyzer</h1>
        <p>
          Compare resumes with job descriptions using NLP, TF-IDF, and Cosine Similarity
        </p>
      </header>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === "analyze" ? "active" : ""}`}
          onClick={() => setActiveTab("analyze")}
        >
          Analyze Resume
        </button>
        <button
          className={`tab-btn ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          Saved Reports History
        </button>
      </div>

      {/* Global Alerts */}
      {errorMessage && <div className="alert alert-error">{errorMessage}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      {/* TAB 1: ANALYZE RESUME */}
      {activeTab === "analyze" && (
        <>
          <div className="card">
            <div className="card-title">
              <span>Resume & Job Description Input</span>
              <button
                type="button"
                className="link-btn"
                onClick={handleLoadSample}
              >
                + Load Sample Data
              </button>
            </div>

            <form onSubmit={handleAnalyze}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="candidateName">Candidate Name *</label>
                  <input
                    type="text"
                    id="candidateName"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. Alex Mercer"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="jobTitle">Target Job Title *</label>
                  <input
                    type="text"
                    id="jobTitle"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Full Stack Python Developer"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="resumeText">Resume Content / Plain Text *</label>
                <textarea
                  id="resumeText"
                  rows="6"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste candidate resume text or bullet points here..."
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="jobDescription">Job Description Requirements *</label>
                <textarea
                  id="jobDescription"
                  rows="6"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description requirements here..."
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
              >
                {loading ? "Analyzing with NLP & TF-IDF..." : "Analyze & Calculate ATS Score"}
              </button>
            </form>
          </div>

          {/* Analysis Result Card */}
          {currentResult && (
            <div className="card">
              <h2 className="card-title">ATS Match Assessment Report</h2>

              {/* Scorecard Banner */}
              <div className="score-badge-container">
                <div className={`score-circle ${getScoreClass(currentResult.match_score)}`}>
                  <span>{currentResult.match_score}%</span>
                  <span className="score-label">ATS Score</span>
                </div>
                <div className="score-details">
                  <h3>
                    {currentResult.candidate_name} &bull; {currentResult.job_title}
                  </h3>
                  <p>
                    Cosine Similarity: <strong>{currentResult.cosine_similarity}</strong>
                  </p>
                </div>
              </div>

              {/* Matched Skills */}
              <div className="skills-container">
                <h4>Matched Skills ({currentResult.matched_skills.length})</h4>
                {currentResult.matched_skills.length > 0 ? (
                  <div className="badge-list">
                    {currentResult.matched_skills.map((skill, index) => (
                      <span key={index} className="badge badge-match">
                        ✓ {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#64748b", fontSize: "0.9rem" }}>
                    No common technical skills identified.
                  </p>
                )}
              </div>

              {/* Missing Skills */}
              <div className="skills-container">
                <h4>Missing / Recommended JD Skills ({currentResult.missing_skills.length})</h4>
                {currentResult.missing_skills.length > 0 ? (
                  <div className="badge-list">
                    {currentResult.missing_skills.map((skill, index) => (
                      <span key={index} className="badge badge-missing">
                        + {skill}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ color: "#16a34a", fontSize: "0.9rem" }}>
                    All target skills matched!
                  </p>
                )}
              </div>

              {/* Actionable Suggestions */}
              <div className="skills-container" style={{ marginTop: "1.5rem" }}>
                <h4>Targeted Resume Improvement Suggestions</h4>
                <ul className="suggestions-list">
                  {currentResult.suggestions.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: SAVED REPORTS HISTORY */}
      {activeTab === "history" && (
        <div className="card">
          <div className="card-title">
            <span>MySQL Saved Analysis History</span>
            <button
              type="button"
              className="link-btn"
              onClick={fetchReports}
            >
              🔄 Refresh List
            </button>
          </div>

          {historyLoading ? (
            <p style={{ textAlign: "center", padding: "1.5rem" }}>Loading reports...</p>
          ) : reports.length === 0 ? (
            <div className="empty-state">
              <p>No analysis reports found in the database.</p>
              <p>Analyze a resume in the first tab to save reports here.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Candidate</th>
                    <th>Target Role</th>
                    <th>ATS Score</th>
                    <th>Matched Skills</th>
                    <th>Missing Skills</th>
                    <th>Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td><strong>{r.candidate_name}</strong></td>
                      <td>{r.job_title}</td>
                      <td>
                        <span className={`badge ${getScoreClass(r.match_score)}`}>
                          {r.match_score}%
                        </span>
                      </td>
                      <td>
                        {Array.isArray(r.matched_skills)
                          ? r.matched_skills.slice(0, 3).join(", ") +
                            (r.matched_skills.length > 3 ? "..." : "")
                          : "None"}
                      </td>
                      <td>
                        {Array.isArray(r.missing_skills)
                          ? r.missing_skills.slice(0, 3).join(", ") +
                            (r.missing_skills.length > 3 ? "..." : "")
                          : "None"}
                      </td>
                      <td>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          className="btn-delete"
                          onClick={() => handleDeleteReport(r.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
