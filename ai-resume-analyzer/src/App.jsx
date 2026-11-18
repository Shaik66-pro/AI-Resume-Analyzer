import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import * as pdfjsLib from 'pdfjs-dist'
import './App.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Broad Catalog of Technical Skills across Software, AI, Data, Cloud & Engineering
const TECHNICAL_SKILLS_CATALOG = [
  // AI & Data
  "prompt engineering", "data analytics", "data analysis", "analytical skills", "sql", "mysql",
  "postgresql", "mongodb", "oracle", "sqlite", "python", "machine learning", "deep learning",
  "nlp", "generative ai", "llm", "tableau", "power bi", "excel", "pandas", "numpy", "scikit-learn",
  "tensorflow", "pytorch", "etl", "snowflake", "bigquery", "data pipeline", "database management",
  // Full Stack & Web
  "react", "react.js", "reactjs", "javascript", "typescript", "html", "html5", "css", "css3",
  "node.js", "express", "flask", "fastapi", "django", "spring boot", "java", "c++", "c#",
  ".net", "php", "angular", "vue.js", "next.js", "rest api", "apis", "graphql", "redux", "tailwind css",
  // Integration & Cloud
  "mulesoft", "workato", "ipaas", "boomi", "dell boomi", "zapier", "informatica", "kafka",
  "rabbitmq", "talend", "microservices", "digital transformation", "data flow", "api integration",
  // Cloud & DevOps
  "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "git", "github", "gitlab", "linux", "terraform",
  // Testing & Core
  "selenium", "manual testing", "automation testing", "jira", "agile", "postman"
];

// Check if skill exists in text using word boundaries and aliases
function isSkillInText(textLower, skill) {
  const s = skill.toLowerCase().trim();
  if (s === "sql") {
    return /(?<![a-zA-Z0-9])(sql|mysql|postgresql|sqlite|pl\/sql)(?![a-zA-Z0-9])/i.test(textLower);
  }
  if (s === "python") {
    return /(?<![a-zA-Z0-9])python(?![a-zA-Z0-9])/i.test(textLower);
  }
  if (s === "prompt engineering") {
    return /(?<![a-zA-Z0-9])(prompt engineering|prompt design|llm prompts|prompts)(?![a-zA-Z0-9])/i.test(textLower);
  }
  if (s === "data analytics" || s === "data analysis" || s === "dataanalytics") {
    return /(?<![a-zA-Z0-9])(data analytics|data analysis|analytical skills|data analyst)(?![a-zA-Z0-9])/i.test(textLower);
  }
  if (s === "analytical skills") {
    return /(?<![a-zA-Z0-9])(analytical skills|analytical|problem solving|data analytics)(?![a-zA-Z0-9])/i.test(textLower);
  }
  if (s === "boomi" || s === "dell boomi") {
    return /(?<![a-zA-Z0-9])(boomi|dell boomi)(?![a-zA-Z0-9])/i.test(textLower);
  }
  const escaped = s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i').test(textLower);
}

// Scan all required technical skills directly from the Job Description
function scanJdRequirements(jdText) {
  const jdLower = (jdText || "").toLowerCase();
  const foundSkills = new Set();

  // 1. Check Technical Catalog against the Job Description
  TECHNICAL_SKILLS_CATALOG.forEach(skill => {
    if (isSkillInText(jdLower, skill)) {
      foundSkills.add(skill);
    }
  });

  // 2. Also check lines following "Skills:", "Requirements:", "Technologies:" for comma-separated items
  const skillLines = jdText.match(/(?:skills|requirements|technologies|tools|knowledge of)[\s:]+([^\n\r]+)/gi);
  if (skillLines) {
    skillLines.forEach(line => {
      const cleaned = line.replace(/^(?:skills|requirements|technologies|tools|knowledge of)[\s:]+/i, '');
      const tokens = cleaned.split(/[,;•\-\*\/]/);
      tokens.forEach(t => {
        let cleanToken = t.trim().toLowerCase().replace(/^(?:good|basic|strong|hands[- ]on|experience in|proficiency in)\s+/i, '').trim();
        const catalogMatch = TECHNICAL_SKILLS_CATALOG.find(s => s === cleanToken || cleanToken.includes(s));
        if (catalogMatch) {
          foundSkills.add(catalogMatch);
        }
      });
    });
  }

  return Array.from(foundSkills);
}

// Match Resume against Scanned JD Requirements
function matchResumeToJd(resumeText, jdText) {
  const rLower = (resumeText || "").toLowerCase();
  const jdLower = (jdText || "").toLowerCase();

  // 1. Scan all requirements from JD
  const requiredSkills = scanJdRequirements(jdText);

  // 2. Check each skill against resume
  const matchedSkills = [];
  const missingSkills = [];

  requiredSkills.forEach(skill => {
    if (isSkillInText(rLower, skill)) {
      matchedSkills.push(skill);
    } else {
      missingSkills.push(skill);
    }
  });

  // 3. Exact Resume Match Percentage
  const totalRequired = requiredSkills.length;
  const matchedCount = matchedSkills.length;
  const matchPercentage = totalRequired > 0 ? Math.round((matchedCount / totalRequired) * 100) : 0;

  // 4. Chance of Getting Shortlisted
  let shortlistChance = "LOW";
  let chanceColor = "#f87171"; // Red
  let chanceDescription = "Low chance of getting shortlisted due to missing core requirements.";

  if (matchPercentage >= 70) {
    shortlistChance = "HIGH";
    chanceColor = "#4ade80"; // Green
    chanceDescription = "High probability of clearing ATS screening and getting an interview call!";
  } else if (matchPercentage >= 40) {
    shortlistChance = "MODERATE";
    chanceColor = "#facc15"; // Yellow
    chanceDescription = "Moderate chance. Adding the missing skills below will boost your ranking.";
  }

  // 5. Target Role from JD
  let roleTitle = "Job Role Specified in JD";
  const roleMatch = jdText.match(/(?:designation|position|job title|role)[\s:]+([^\n\r]+)/i);
  if (roleMatch) {
    roleTitle = roleMatch[1].trim();
  }

  return {
    roleTitle,
    totalRequired,
    matchedCount,
    matchPercentage,
    shortlistChance,
    chanceColor,
    chanceDescription,
    matchedSkills,
    missingSkills
  };
}

function App() {
  const [file, setFile] = useState(null)
  const [resumeTextInput, setResumeTextInput] = useState('')
  const [inputMode, setInputMode] = useState('pdf')
  const [jobDescription, setJobDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0])
      setAnalysis(null)
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
    if (inputMode === 'pdf' && !file) {
      alert("Please upload your resume (PDF) first.");
      return;
    }
    if (inputMode === 'text' && !resumeTextInput.trim()) {
      alert("Please paste your resume text first.");
      return;
    }
    if (!jobDescription.trim()) {
      alert("Please paste the Job Description.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      let finalResumeText = '';
      if (inputMode === 'pdf' && file) {
        finalResumeText = await extractTextFromPDF(file);
      } else {
        finalResumeText = resumeTextInput;
      }

      const result = matchResumeToJd(finalResumeText, jobDescription);
      await new Promise(resolve => setTimeout(resolve, 400));
      setAnalysis(result);

    } catch (error) {
      console.error("Analysis Error:", error);
      alert("Error analyzing resume: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="container">
      <header className="glass-panel">
        <h1>AI Resume Analyzer</h1>
        <p>Scan Job Description Requirements vs. Resume Skills</p>
      </header>

      <main className="main-content">
        {/* Toggle between Upload PDF and Paste Text */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            className={`tab-btn ${inputMode === 'pdf' ? 'active' : ''}`}
            onClick={() => setInputMode('pdf')}
          >
            📁 Upload Resume (PDF)
          </button>
          <button
            type="button"
            className={`tab-btn ${inputMode === 'text' ? 'active' : ''}`}
            onClick={() => setInputMode('text')}
          >
            📝 Paste Resume Text
          </button>
        </div>

        {inputMode === 'pdf' ? (
          <>
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
                    setAnalysis(null)
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="jd-section">
            <label htmlFor="resumeText">Candidate Resume Content:</label>
            <textarea
              id="resumeText"
              rows="6"
              placeholder="Paste candidate resume skills, education, and experience..."
              value={resumeTextInput}
              onChange={(e) => setResumeTextInput(e.target.value)}
              className="glass-panel"
            />
          </div>
        )}

        <div className="jd-section" style={{ marginTop: '1rem' }}>
          <label htmlFor="jd">Target Job Description (JD):</label>
          <textarea
            id="jd"
            rows="6"
            placeholder="Paste target Job Description here..."
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="glass-panel"
          />
        </div>

        <button
          className="analyze-btn glass-panel"
          onClick={handleAnalyze}
          disabled={isAnalyzing || (inputMode === 'pdf' && !file) || (inputMode === 'text' && !resumeTextInput.trim())}
        >
          {isAnalyzing ? 'Scanning JD Requirements against Resume...' : 'Analyze Resume against JD'}
        </button>

        {analysis && (
          <div className="dashboard-container glass-panel">
            
            {/* Top Score Banner: Resume Match % & Chance of Getting Shortlisted */}
            <div className="jd-match-summary-card glass-panel">
              <div className="summary-col">
                <span className="summary-badge">🎯 Resume Match Percentage</span>
                <div className="summary-metric">
                  <span className="summary-big-num">{analysis.matchPercentage}%</span>
                  <span className="summary-subtext">
                    {analysis.matchedCount} of {analysis.totalRequired} Required Skills Found in Resume
                  </span>
                </div>
                <div className="meter-bar" style={{ marginTop: '0.6rem' }}>
                  <div
                    className="meter-fill"
                    style={{ width: `${analysis.matchPercentage}%`, backgroundColor: '#00f0ff' }}
                  ></div>
                </div>
              </div>

              <div className="summary-col">
                <span className="summary-badge">📈 Chance of Getting Shortlisted</span>
                <div className="summary-metric">
                  <span className="pill large" style={{ backgroundColor: `${analysis.chanceColor}25`, color: analysis.chanceColor, border: `1px solid ${analysis.chanceColor}` }}>
                    {analysis.shortlistChance} ({analysis.matchPercentage}%)
                  </span>
                  <span className="summary-subtext" style={{ marginTop: '0.4rem' }}>
                    {analysis.chanceDescription}
                  </span>
                </div>
                <div className="meter-bar" style={{ marginTop: '0.6rem' }}>
                  <div
                    className="meter-fill"
                    style={{ width: `${analysis.matchPercentage}%`, backgroundColor: analysis.chanceColor }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Matched vs Missing Skills Grid */}
            <div className="skills-evaluation-grid" style={{ marginTop: '1.5rem' }}>
              
              {/* Matched Skills Card */}
              <div className="eval-card primary-card">
                <div className="eval-card-header">
                  <h3>✅ Matched Skills ({analysis.matchedCount})</h3>
                  <span className="skill-counter">
                    {analysis.matchedCount} / {analysis.totalRequired}
                  </span>
                </div>
                <div className="tag-cluster" style={{ marginTop: '0.5rem' }}>
                  {analysis.matchedSkills.length > 0 ? (
                    analysis.matchedSkills.map((s, idx) => (
                      <span key={idx} className="skill-tag match">
                        ✓ {s.toUpperCase()}
                      </span>
                    ))
                  ) : (
                    <span className="none-text">No matching skills found in resume</span>
                  )}
                </div>
              </div>

              {/* Missing Skills Card */}
              <div className="eval-card secondary-card">
                <div className="eval-card-header">
                  <h3>❌ Missing Skills from JD ({analysis.missingSkills.length})</h3>
                  <span className="skill-counter" style={{ color: '#f87171', background: 'rgba(248, 113, 113, 0.1)' }}>
                    {analysis.missingSkills.length} Missing
                  </span>
                </div>
                <div className="tag-cluster" style={{ marginTop: '0.5rem' }}>
                  {analysis.missingSkills.length > 0 ? (
                    analysis.missingSkills.map((s, idx) => (
                      <span key={idx} className="skill-tag miss">
                        ✕ {s.toUpperCase()}
                      </span>
                    ))
                  ) : (
                    <span className="success-text">🎉 100% of required skills matched!</span>
                  )}
                </div>
              </div>

            </div>

          </div>
        )}
      </main>
    </div>
  )
}

export default App
