import React, { useState, useEffect } from "react";
import "./App.css";

// Automatically uses window location or backend port 5000
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

function App() {
  const [activeTab, setActiveTab] = useState("analyze"); // 'analyze' or 'history'

  // Input states
  const [candidateName, setCandidateName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");

  // Analysis result
  const [analysisResult, setAnalysisResult] = useState(null);

  // Status & Loaders
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  // History state
  const [reports, setReports] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  useEffect(() => {
    if (activeTab === "history") {
      fetchReports();
    }
  }, [activeTab]);

  const fetchReports = async () => {
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/reports`);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (err) {
      console.error("Could not fetch reports:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Preset 1: Fresher Candidate vs Senior 5+ Year Job Description (Mismatch Demo)
  const loadFresherVsSeniorPreset = () => {
    setCandidateName("Rahul Sharma");
    setJobTitle("Senior AI & Full Stack Architect");
    setResumeText(`
Rahul Sharma - Computer Science B.Tech Graduate (Fresher)
Email: rahul@example.com | GitHub: github.com/rahul-dev

Profile Summary:
Enthusiastic entry-level software engineer with 0 years formal industry experience. 
Passionate about Python, React, Flask, and basic NLP concepts.

Academic Projects:
- E-Commerce Web Application: Built responsive frontend using React and HTML/CSS.
- Simple Chatbot: Implemented basic keyword matching using Python and Flask.
- Student Database Management: Created MySQL queries for student record storage.

Skills:
Python, HTML5, CSS3, React, JavaScript, SQL, MySQL, Git.
    `.trim());

    setJobDescription(`
Position: Senior AI & Full Stack Architect (5+ Years Experience Required)
Company: Enterprise Cloud Systems

Requirements:
- 5+ years of extensive hands-on experience architecting high-scale distributed backends.
- Deep expertise with Python, Microservices, Flask or FastAPI, and Docker containerization.
- Proven track record with AWS cloud infrastructure (EC2, ECS, RDS, CloudFront).
- Advanced Natural Language Processing (NLP), TF-IDF, Cosine Similarity, and PyTorch.
- 4+ years designing optimized MySQL / PostgreSQL database clusters.
- Demonstrated experience leading senior engineering teams and CI/CD pipelines.
    `.trim());
  };

  // Preset 2: Experienced Candidate Matched to Mid/Senior Role (High Score Demo)
  const loadMatchedRolePreset = () => {
    setCandidateName("Sameer Nawab");
    setJobTitle("Full Stack AI Engineer");
    setResumeText(`
Sameer Nawab - Full Stack AI Engineer
Experience: 3+ years of professional software engineering and AI systems development.

Professional Experience:
- Full Stack Engineer at Tech Innovations (3 years):
  * Designed and launched high-throughput REST APIs using Python, Flask, and FastAPI.
  * Extracted candidate skills and computed similarity metrics using NLP, TF-IDF, and Cosine Similarity.
  * Implemented responsive, interactive user dashboards with React.js, TypeScript, and modern CSS.
  * Engineered robust MySQL schemas, queries, and connection pools handling 50k+ daily records.
  * Deployed containerized applications onto AWS EC2 with Nginx reverse proxy and Gunicorn.

Technical Skills:
Python, Flask, React, React.js, JavaScript, MySQL, SQL, NLP, TF-IDF, Cosine Similarity, Docker, AWS, Git, REST API, scikit-learn.
    `.trim());

    setJobDescription(`
Role: Full Stack AI Engineer (2-4 Years Experience)
Requirements:
- 2+ years of professional experience building web applications and AI tools.
- Proficiency in Python, Flask, and relational databases (MySQL or PostgreSQL).
- Experience integrating NLP algorithms, text vectorization (TF-IDF), and Cosine Similarity.
- Hands-on frontend development using React.js and modern JavaScript.
- Experience with Cloud deployment on AWS (EC2/S3) and Git version control.
    `.trim());
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setAnalysisResult(null);

    if (!candidateName.trim() || !jobTitle.trim() || !resumeText.trim() || !jobDescription.trim()) {
      setErrorMessage("Please fill in candidate details, resume text, and job description.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_name: candidateName,
          job_title: jobTitle,
          resume_text: resumeText,
          job_description: jobDescription,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setAnalysisResult(data);
        setSuccessMessage("Multi-dimensional ATS Analysis completed successfully!");
      } else {
        setErrorMessage(data.error || "Analysis failed.");
      }
    } catch (err) {
      setErrorMessage("Could not reach backend API at " + API_BASE_URL + ". Ensure Flask is running.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReport = async (id) => {
    if (!window.confirm(`Delete report #${id}?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/reports/${id}`, { method: "DELETE" });
      if (res.ok) {
        setReports(reports.filter((r) => r.id !== id));
      }
    } catch (err) {
      alert("Error deleting report.");
    }
  };

  const getChanceClass = (chance) => {
    const c = (chance || "").toLowerCase();
    if (c === "high") return "fill-high";
    if (c === "moderate") return "fill-moderate";
    return "fill-low";
  };

  return (
    <div className="app-wrapper">
      {/* Header */}
      <header className="premium-header">
        <div className="brand-badge">Next-Gen Recruitment Intelligence</div>
        <h1>AI Resume Analyzer & ATS Screener</h1>
        <p>
          Calculates experience alignment, JD keyword match percentage, TF-IDF cosine similarity, and shortlisting probabilities.
        </p>
      </header>

      {/* Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-tab ${activeTab === "analyze" ? "active" : ""}`}
          onClick={() => setActiveTab("analyze")}
        >
          ⚡ ATS Analyzer
        </button>
        <button
          className={`nav-tab ${activeTab === "history" ? "active" : ""}`}
          onClick={() => setActiveTab("history")}
        >
          🗄️ MySQL Screening History
        </button>
      </nav>

      {/* Global Alerts */}
      {errorMessage && <div className="alert-banner alert-error">{errorMessage}</div>}
      {successMessage && <div className="alert-banner alert-success">{successMessage}</div>}

      {/* TAB 1: ANALYZER */}
      {activeTab === "analyze" && (
        <>
          <div className="glass-panel">
            <div className="panel-header">
              <h2>Candidate & Job Description Input</h2>
              <div className="preset-actions">
                <button type="button" className="preset-btn" onClick={loadFresherVsSeniorPreset}>
                  Demo: Fresher vs Senior Role
                </button>
                <button type="button" className="preset-btn" onClick={loadMatchedRolePreset}>
                  Demo: Matched Role
                </button>
              </div>
            </div>

            <form onSubmit={handleAnalyze}>
              <div className="form-grid-2">
                <div className="input-group">
                  <label>Candidate Name *</label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="e.g. Sameer Nawab"
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Target Job Title *</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Full Stack AI Engineer"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Resume Content / Candidate Profile *</label>
                <textarea
                  rows="7"
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste candidate resume content, education, years of experience, and project bullet points..."
                  required
                />
              </div>

              <div className="input-group">
                <label>Job Description (JD) Requirements *</label>
                <textarea
                  rows="7"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description requirements, qualifications, and years of experience criteria..."
                  required
                />
              </div>

              <button type="submit" className="btn-submit-premium" disabled={loading}>
                {loading ? "Processing NLP & Semantic Vectors..." : "Run AI Resume Analysis"}
              </button>
            </form>
          </div>

          {/* ANALYSIS RESULTS DASHBOARD */}
          {analysisResult && (
            <div className="glass-panel">
              {/* Suitability & Experience Alignment Banner */}
              <div
                className={`suitability-banner ${
                  analysisResult.is_experience_match ? "match" : "mismatch"
                }`}
              >
                <div className="suitability-header">
                  <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                    <span className="tier-tag">Candidate: {analysisResult.career_level}</span>
                    <span className="tier-tag">Role Target: {analysisResult.jd_level}</span>
                  </div>
                  <span className="match-status-badge">
                    {analysisResult.is_experience_match
                      ? "✅ Suitable for Experience Level"
                      : "⚠️ Experience Level Mismatch"}
                  </span>
                </div>
                <p className="suitability-text">{analysisResult.suitability_feedback}</p>
              </div>

              {/* 4 Premium Stat Cards */}
              <div className="metrics-grid">
                <div className="metric-card">
                  <span className="metric-label">ATS Match Score</span>
                  <span className="metric-value" style={{ color: "#38bdf8" }}>
                    {analysisResult.ats_score}%
                  </span>
                  <div className="metric-progress">
                    <div
                      className="metric-fill"
                      style={{
                        width: `${analysisResult.ats_score}%`,
                        backgroundColor: "#38bdf8",
                      }}
                    ></div>
                  </div>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Shortlisting Probability</span>
                  <span className="metric-value">
                    {analysisResult.shortlist_chance} ({analysisResult.shortlist_probability}%)
                  </span>
                  <div className="metric-progress">
                    <div
                      className={`metric-fill ${getChanceClass(analysisResult.shortlist_chance)}`}
                      style={{ width: `${analysisResult.shortlist_probability}%` }}
                    ></div>
                  </div>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Required Experience</span>
                  <span className="metric-value" style={{ fontSize: "1.45rem", color: "#f8fafc" }}>
                    {analysisResult.total_exp_required}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
                    Extracted from JD criteria
                  </span>
                </div>

                <div className="metric-card">
                  <span className="metric-label">Found Experience</span>
                  <span className="metric-value" style={{ fontSize: "1.45rem", color: "#f8fafc" }}>
                    {analysisResult.total_exp_found}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.5rem" }}>
                    Detected in candidate profile
                  </span>
                </div>
              </div>

              {/* Experience & Skills Breakdown Table */}
              <div className="panel-header" style={{ marginBottom: "0.75rem" }}>
                <h2>Granular Requirement Breakdown</h2>
              </div>
              <div className="breakdown-table-wrapper">
                <table className="premium-table">
                  <thead>
                    <tr>
                      <th>Core JD Requirement</th>
                      <th>JD Criteria</th>
                      <th>Resume Evidence</th>
                      <th>Status</th>
                      <th>Extracted Verification Proof</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysisResult.experience_breakdown &&
                      analysisResult.experience_breakdown.map((row, idx) => (
                        <tr key={idx}>
                          <td><strong>{row.requirement}</strong></td>
                          <td>{row.required}</td>
                          <td>{row.found}</td>
                          <td>
                            <span
                              className={`status-pill ${
                                row.status === "Met" ? "status-met" : "status-missing"
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                          <td className="quote-cell">{row.extracted_proof}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              {/* Matched & Missing Keywords Matrix */}
              <div className="form-grid-2">
                <div className="skills-section">
                  <h3 style={{ color: "#34d399" }}>
                    Matched Skills ({analysisResult.matched_skills.length})
                  </h3>
                  <div className="badge-cloud">
                    {analysisResult.matched_skills.map((s, i) => (
                      <span key={i} className="skill-badge matched">
                        ✓ {s}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="skills-section">
                  <h3 style={{ color: "#fb7185" }}>
                    Missing Keywords in Resume ({analysisResult.missing_skills.length})
                  </h3>
                  <div className="badge-cloud">
                    {analysisResult.missing_skills.map((s, i) => (
                      <span key={i} className="skill-badge missing">
                        + {s}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Actionable Recommendations */}
              <div className="skills-section" style={{ marginTop: "1rem" }}>
                <h2>Targeted ATS Optimization Recommendations</h2>
                <ul className="rec-list">
                  {analysisResult.recommendations &&
                    analysisResult.recommendations.map((rec, i) => (
                      <li key={i} className="rec-item">
                        {rec}
                      </li>
                    ))}
                </ul>
              </div>
            </div>
          )}
        </>
      )}

      {/* TAB 2: SAVED REPORTS */}
      {activeTab === "history" && (
        <div className="glass-panel">
          <div className="panel-header">
            <h2>MySQL Screening History</h2>
            <button className="preset-btn" onClick={fetchReports}>
              🔄 Refresh Records
            </button>
          </div>

          {historyLoading ? (
            <p style={{ textAlign: "center", padding: "2rem" }}>Loading reports from MySQL...</p>
          ) : reports.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-dim)" }}>
              No screening records found in database. Run an analysis above to save reports here.
            </div>
          ) : (
            <div className="breakdown-table-wrapper">
              <table className="premium-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Candidate</th>
                    <th>Target Role</th>
                    <th>Candidate Level</th>
                    <th>ATS Score</th>
                    <th>Shortlist Chance</th>
                    <th>Exp Status</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((r) => (
                    <tr key={r.id}>
                      <td>#{r.id}</td>
                      <td><strong>{r.candidate_name}</strong></td>
                      <td>{r.job_title}</td>
                      <td>{r.career_level || "Not specified"}</td>
                      <td style={{ color: "#38bdf8", fontWeight: 700 }}>{r.ats_score}%</td>
                      <td>
                        <span className={`status-pill ${r.shortlist_chance === "High" ? "status-met" : "status-missing"}`}>
                          {r.shortlist_chance} ({r.shortlist_probability}%)
                        </span>
                      </td>
                      <td>
                        {r.is_experience_match ? (
                          <span style={{ color: "#34d399", fontSize: "0.85rem" }}>Matched</span>
                        ) : (
                          <span style={{ color: "#fbbf24", fontSize: "0.85rem" }}>Mismatch</span>
                        )}
                      </td>
                      <td>{new Date(r.created_at).toLocaleDateString()}</td>
                      <td>
                        <button
                          style={{
                            background: "rgba(244, 63, 94, 0.15)",
                            color: "#fb7185",
                            border: "1px solid rgba(244, 63, 94, 0.3)",
                            padding: "0.3rem 0.6rem",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.8rem"
                          }}
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
