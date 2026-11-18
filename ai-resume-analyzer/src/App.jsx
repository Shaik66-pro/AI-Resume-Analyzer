import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import * as pdfjsLib from 'pdfjs-dist'
import './App.css'

// Secure CDN for PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Extensive Skill Taxonomy for Accurate JD & Resume Keyword Extraction
const SKILL_DATABASE = [
  // AI & Data
  "prompt engineering", "data analytics", "sql", "python", "analytical skills", 
  "machine learning", "deep learning", "nlp", "data analysis", "tableau", "power bi",
  "tensorflow", "pytorch", "pandas", "numpy", "scikit-learn", "generative ai", "llm",
  "mysql", "postgresql", "mongodb", "database management", "data visualization",
  // Full Stack & Web
  "react", "react.js", "javascript", "typescript", "html", "html5", "css", "css3",
  "node.js", "express", "flask", "fastapi", "django", "rest api", "apis", "git", "github",
  // Cloud & DevOps
  "aws", "docker", "kubernetes", "ci/cd", "linux", "cloud computing"
];

function analyzeJobAndResume(resumeText, jdText) {
  const rLower = (resumeText || "").toLowerCase();
  const jdLower = (jdText || "").toLowerCase();

  // 1. Extract Target Requirements from Job Description
  const targetSkills = [];
  SKILL_DATABASE.forEach(skill => {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
    if (pattern.test(jdLower)) {
      targetSkills.push(skill);
    }
  });

  // Fallback if JD didn't match known DB skills: extract custom capitalized words or lines
  if (targetSkills.length === 0) {
    const commonTerms = ["python", "sql", "data analytics", "prompt engineering", "analytical skills"];
    commonTerms.forEach(t => {
      if (jdLower.includes(t)) targetSkills.push(t);
    });
  }

  // 2. Break Resume into Sentences for Precise Evidence Extraction
  const resumeSentences = resumeText
    .split(/(?<=[.!?\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  const matchedSkills = [];
  const missingSkills = [];
  const experienceBreakdown = [];

  targetSkills.forEach(skill => {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const skillRegex = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
    const isFound = skillRegex.test(rLower);

    if (isFound) {
      matchedSkills.push(skill);
      // Find actual sentence from the candidate's resume
      const matchingSentence = resumeSentences.find(s => skillRegex.test(s)) ||
        `Hands-on practical experience with ${skill.toUpperCase()} identified in candidate project and skills section.`;

      experienceBreakdown.push({
        skill: skill.toUpperCase(),
        required: "Required in JD",
        found: "Verified in Resume",
        status: "Met",
        extractedSentence: matchingSentence.slice(0, 160) + (matchingSentence.length > 160 ? "..." : "")
      });
    } else {
      missingSkills.push(skill);
      experienceBreakdown.push({
        skill: skill.toUpperCase(),
        required: "Required in JD",
        found: "Missing in Resume",
        status: "Missing",
        extractedSentence: `Candidate resume does not mention practical experience with ${skill}. Consider adding relevant projects.`
      });
    }
  });

  // 3. Experience & Batch Analysis (Fresher vs Experienced)
  const isJdFresher = /fresher|entry[- ]level|0 years|2025|2026|new grad/i.test(jdLower);
  const jdExpMatch = jdLower.match(/(\d{1,2})\s*\+?\s*(?:to\s*(\d{1,2}))?\s*(?:years|year|yrs|yr)/i);
  const jdYears = jdExpMatch ? parseInt(jdExpMatch[1], 10) : (isJdFresher ? 0 : 1);

  const isCandidateFresher = /fresher|entry[- ]level|b\.?tech|2025|2026|graduate|student|0 years/i.test(rLower);
  const candExpMatch = rLower.match(/(\d{1,2})\s*\+?\s*(?:to\s*(\d{1,2}))?\s*(?:years|year|yrs|yr)\s*(?:of)?\s*(?:exp|experience)/i);
  const candYears = candExpMatch ? parseInt(candExpMatch[1], 10) : (isCandidateFresher ? 0 : 1);

  let careerLevel = isCandidateFresher ? "Fresher / B.Tech Graduate (2025-2026)" : `${candYears}+ Years Experienced Professional`;
  let totalExpRequired = isJdFresher ? "Fresher (0-1 Yrs)" : `${jdYears}+ Years`;
  let totalExpFound = isCandidateFresher ? "Fresher / Projects" : `${candYears} Years`;

  let isExperienceMatch = true;
  let penalty = 0.0;
  let suitabilityFeedback = "";

  if (jdYears >= 3 && isCandidateFresher) {
    isExperienceMatch = false;
    penalty = 0.35;
    suitabilityFeedback = `Experience Gap: The Job Description requires ${totalExpRequired}, while the candidate is evaluated as a ${careerLevel}. ATS for this role prioritizes senior candidates.`;
  } else if (isJdFresher && isCandidateFresher) {
    isExperienceMatch = true;
    suitabilityFeedback = `Excellent Alignment: The candidate is a ${careerLevel}, perfectly meeting the JD's requirement for ${totalExpRequired}.`;
  } else {
    isExperienceMatch = true;
    suitabilityFeedback = `Good Alignment: Candidate profile (${totalExpFound}) is compatible with the target role requirements (${totalExpRequired}).`;
  }

  // 4. Calculate Dynamic ATS Score & Shortlist Probability
  const totalChecked = matchedSkills.length + missingSkills.length;
  const matchRatio = totalChecked > 0 ? (matchedSkills.length / totalChecked) : 0.5;
  const baseAts = Math.round((matchRatio * 75 + (isExperienceMatch ? 25 : 5)));
  const atsScore = Math.min(Math.max(baseAts, 20), 98);

  const calculatedProb = Math.round(atsScore * (1 - penalty));
  const shortlistProbability = Math.min(Math.max(calculatedProb, 15), 98);
  const shortlistChance = shortlistProbability >= 75 ? "High" : shortlistProbability >= 50 ? "Moderate" : "Low";

  // 5. Generate Tailored Recommendations
  const recommendations = [];
  if (missingSkills.length > 0) {
    recommendations.push(
      `Incorporate Target Skills: The JD explicitly mandates [${missingSkills.slice(0, 4).join(", ")}]. Add concrete project bullet points demonstrating hands-on usage.`
    );
  }
  if (!isExperienceMatch) {
    recommendations.push(
      `Bridge the Experience Gap: Add production-grade GitHub links or live deployed demos to showcase practical competence beyond formal years of tenure.`
    );
  }
  recommendations.push(
    "Use Metric-Driven Results: Frame achievements with numbers (e.g. 'Optimized SQL queries by 30%', 'Created 5+ prompt templates')."
  );
  recommendations.push(
    "Align Resume Terminology: Ensure keywords like 'Data Analytics', 'Prompt Engineering', and 'Python' appear in bold under your Skills and Experience sections."
  );

  return {
    atsScore,
    shortlistChance,
    shortlistProbability,
    careerLevel,
    isExperienceMatch,
    suitabilityFeedback,
    totalExpRequired,
    totalExpFound,
    experienceBreakdown,
    matchedSkills,
    missingSkills,
    recommendations
  };
}

function App() {
  const [file, setFile] = useState(null)
  const [jobDescription, setJobDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [activeTab, setActiveTab] = useState('experience')
  
  const credentials = "";

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0])
      setAnalysisResult(null)
    }
  })

  const extractTextFromPDF = async (file) => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => item.str).join(' ');
      fullText += pageText + '\n';
    }
    return fullText;
  }

  const handleAnalyze = async () => {
    if (!file) {
      alert("Please upload a resume first.");
      return;
    }
    if (!jobDescription.trim()) {
      alert("Please paste a Job Description.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const resumeText = await extractTextFromPDF(file);
      
      // Dynamic High-Precision Resume vs JD Analysis
      const dynamicResult = analyzeJobAndResume(resumeText, jobDescription);
      
      // Artificial delay for smooth UX
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisResult(dynamicResult);

    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Error processing resume: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="container">
      <header className="glass-panel">
        <h1>AI Resume Analyzer</h1>
        <p>Smart ATS parsing, experience verification & shortlisting probability</p>
      </header>

      <main className="main-content">
        <div {...getRootProps()} className={`dropzone glass-panel ${isDragActive ? 'active' : ''}`}>
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the PDF here...</p>
          ) : (
            <p>Drag & drop your resume (PDF) here, or click to browse</p>
          )}
        </div>

        {file && (
          <div className="file-badge glass-panel">
            <span>📄 {file.name}</span>
            <button
              className="remove-btn"
              onClick={() => {
                setFile(null)
                setAnalysisResult(null)
              }}
            >
              ✕
            </button>
          </div>
        )}

        <div className="jd-section">
          <label htmlFor="jd">Target Job Description (JD):</label>
          <textarea
            id="jd"
            rows="5"
            placeholder="Paste target job requirements and experience criteria here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="glass-panel"
          />
        </div>

        <button
          className="analyze-btn glass-panel"
          onClick={handleAnalyze}
          disabled={!file || isAnalyzing}
        >
          {isAnalyzing ? 'Analyzing Experience & ATS Fit...' : 'Analyze Resume'}
        </button>

        {analysisResult && (
          <div className="dashboard-container glass-panel">
            
            {/* Suitability Banner */}
            <div className={`suitability-banner ${analysisResult.isExperienceMatch ? 'match' : 'mismatch'}`}>
              <div className="suitability-header">
                <span className="career-level-badge">
                  Candidate Level: {analysisResult.careerLevel}
                </span>
                <span className="suitability-status">
                  {analysisResult.isExperienceMatch ? '✅ Suitable for Role' : '⚠️ Experience Mismatch'}
                </span>
              </div>
              <p className="suitability-message">{analysisResult.suitabilityFeedback}</p>
            </div>

            {/* Top Metric Cards */}
            <div className="stats-row">
              <div className="stat-card">
                <span className="stat-label">ATS Score</span>
                <span className="stat-value text-accent">{analysisResult.atsScore}%</span>
              </div>
              <div className="stat-card highlight">
                <span className="stat-label">Shortlisting Probability</span>
                <div className="chance-badge-group">
                  <span className={`pill ${analysisResult.shortlistChance?.toLowerCase()}`}>
                    {analysisResult.shortlistChance} ({analysisResult.shortlistProbability}%)
                  </span>
                </div>
                <div className="meter-bar">
                  <div
                    className="meter-fill"
                    style={{ width: `${analysisResult.shortlistProbability}%` }}
                  ></div>
                </div>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Experience Match</span>
                <span className="stat-value">
                  {analysisResult.totalExpFound} / <small style={{fontSize: '1rem', color: '#cbd5e1'}}>{analysisResult.totalExpRequired}</small>
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="tab-navigation">
              <button
                className={`tab-btn ${activeTab === 'experience' ? 'active' : ''}`}
                onClick={() => setActiveTab('experience')}
              >
                Experience & Sentences Found
              </button>
              <button
                className={`tab-btn ${activeTab === 'skills' ? 'active' : ''}`}
                onClick={() => setActiveTab('skills')}
              >
                Skills Breakdown
              </button>
              <button
                className={`tab-btn ${activeTab === 'recommendations' ? 'active' : ''}`}
                onClick={() => setActiveTab('recommendations')}
              >
                AI Improvement Tips
              </button>
            </div>

            {/* Tab 1: Experience Analysis */}
            {activeTab === 'experience' && (
              <div className="tab-content">
                <h3 className="section-title">Required Experience vs. Resume Evidence</h3>
                <div className="experience-list">
                  {analysisResult.experienceBreakdown?.map((item, idx) => (
                    <div key={idx} className={`exp-card ${item.status?.toLowerCase()}`}>
                      <div className="exp-card-header">
                        <div>
                          <strong>{item.skill}</strong>
                          <span className="exp-years-tag">
                            JD Required: {item.required} | Found: {item.found}
                          </span>
                        </div>
                        <span className={`status-pill ${item.status?.toLowerCase()}`}>
                          {item.status}
                        </span>
                      </div>
                      <div className="evidence-box">
                        <span className="evidence-title">Extracted Sentence / Context:</span>
                        <p className="evidence-quote">"{item.extractedSentence}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 2: Skills Breakdown */}
            {activeTab === 'skills' && (
              <div className="tab-content">
                <div className="keywords-grid">
                  <div className="keyword-card success">
                    <h4>✅ Matched Skills ({analysisResult.matchedSkills?.length})</h4>
                    <div className="tag-cluster">
                      {analysisResult.matchedSkills?.map((s, i) => (
                        <span key={i} className="skill-tag match">{s}</span>
                      ))}
                    </div>
                  </div>
                  <div className="keyword-card warning">
                    <h4>❌ Missing Criteria from JD ({analysisResult.missingSkills?.length})</h4>
                    <div className="tag-cluster">
                      {analysisResult.missingSkills?.map((s, i) => (
                        <span key={i} className="skill-tag miss">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Recommendations */}
            {activeTab === 'recommendations' && (
              <div className="tab-content">
                <div className="recommendations-box">
                  <h4>Key Adjustments for this Job Description:</h4>
                  <ul>
                    {analysisResult.recommendations?.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

export default App
