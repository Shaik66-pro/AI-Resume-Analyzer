import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import * as pdfjsLib from 'pdfjs-dist'
import './App.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// STRICT Catalog of Real Technical & Domain Skills (NO generic English words, NO sentences)
const STRICT_SKILL_CATALOG = [
  // Integration & Cloud
  "mulesoft", "workato", "ipaas", "dell boomi", "boomi", "zapier", "informatica", "kafka",
  "rabbitmq", "talend", "microservices", "api integration", "digital transformation", "data flow",
  // AI & Data
  "prompt engineering", "data analytics", "data analysis", "analytical skills", "sql", "mysql",
  "postgresql", "mongodb", "oracle", "sqlite", "python", "machine learning", "deep learning",
  "nlp", "generative ai", "llm", "large language models", "tableau", "power bi", "excel",
  "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "etl", "snowflake", "bigquery",
  // Full Stack & Web
  "react", "react.js", "reactjs", "javascript", "typescript", "html", "html5", "css", "css3",
  "node.js", "express", "flask", "django", "fastapi", "spring boot", "java", "c++", "c#",
  ".net", "php", "angular", "vue.js", "next.js", "rest api", "graphql", "redux", "tailwind css",
  // Cloud & DevOps
  "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "git", "github", "gitlab", "linux", "terraform",
  // Mobile & QA
  "flutter", "android", "ios", "react native", "selenium", "manual testing", "automation testing", "jira", "agile"
];

// Check if a skill exists in text using word boundaries and aliases
function skillExistsInText(textLower, skill) {
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

// Extract ONLY valid technical skills (Primary and Secondary) from ANY Job Description
function extractJdSkillsCategorized(jdText) {
  const jdLower = (jdText || "").toLowerCase();
  
  // Extract Target Role
  let targetRole = "";
  const roleMatch = jdText.match(/(?:designation|position|job title|role)[\s:]+([^\n\r]+)/i);
  if (roleMatch) {
    targetRole = roleMatch[1].trim();
  }

  const primaryFound = new Set();
  const secondaryFound = new Set();

  // 1. Check for Explicit "Primary Skills" & "Secondary Skills" labels in JD
  const primarySection = jdText.match(/(?:primary skills?|core skills?|mandatory skills?|must[- ]have)[\s:]+([^\n\r]+(?:\n[•\-\*][^\n\r]+)*)/i);
  if (primarySection) {
    const tokens = primarySection[1].split(/[,;\n•\-\*\/]/);
    tokens.forEach(t => {
      const clean = t.trim().toLowerCase().replace(/^(?:good|basic|strong|hands[- ]on)\s+/i, '');
      const matched = STRICT_SKILL_CATALOG.find(s => s === clean || clean.includes(s));
      if (matched) primaryFound.add(matched);
    });
  }

  const secondarySection = jdText.match(/(?:secondary skills?|preferred skills?|good to have|nice to have)[\s:]+([^\n\r]+(?:\n[•\-\*][^\n\r]+)*)/i);
  if (secondarySection) {
    const tokens = secondarySection[1].split(/[,;\n•\-\*\/]/);
    tokens.forEach(t => {
      const clean = t.trim().toLowerCase().replace(/^(?:good|basic|strong|hands[- ]on)\s+/i, '');
      const matched = STRICT_SKILL_CATALOG.find(s => s === clean || clean.includes(s));
      if (matched) secondaryFound.add(matched);
    });
  }

  // 2. If no explicit Primary/Secondary headers, scan entire JD against strict technical catalog
  if (primaryFound.size === 0 && secondaryFound.size === 0) {
    const allDetected = STRICT_SKILL_CATALOG.filter(skill => skillExistsInText(jdLower, skill));
    if (allDetected.length > 0) {
      // First 1-2 key skills as Primary, rest as Secondary
      allDetected.slice(0, Math.min(2, allDetected.length)).forEach(s => primaryFound.add(s));
      allDetected.slice(Math.min(2, allDetected.length)).forEach(s => secondaryFound.add(s));
    }
  }

  // If still empty (e.g. general description), fall back cleanly
  const primaryList = Array.from(primaryFound);
  const secondaryList = Array.from(secondaryFound).filter(s => !primaryFound.has(s));

  return {
    targetRole: targetRole || "Role as Specified in JD",
    primarySkills: primaryList,
    secondarySkills: secondaryList
  };
}

// Master Evaluation Function
function evaluateCandidate(resumeText, jdText) {
  const rLower = (resumeText || "").toLowerCase();
  const jdLower = (jdText || "").toLowerCase();

  // 1. Extract Primary & Secondary Skills
  const { targetRole, primarySkills, secondarySkills } = extractJdSkillsCategorized(jdText);

  // Match Primary Skills
  const matchedPrimary = [];
  const missingPrimary = [];
  primarySkills.forEach(skill => {
    if (skillExistsInText(rLower, skill)) {
      matchedPrimary.push(skill);
    } else {
      missingPrimary.push(skill);
    }
  });

  // Match Secondary Skills
  const matchedSecondary = [];
  const missingSecondary = [];
  secondarySkills.forEach(skill => {
    if (skillExistsInText(rLower, skill)) {
      matchedSecondary.push(skill);
    } else {
      missingSecondary.push(skill);
    }
  });

  // 2. Minimum Qualifications & Experience Logic
  // Candidate experience check (distinguish Fresher from 1-7+ years)
  const isCandidateFresher = /fresher|entry[- ]level|0 years|batch of 2025|batch of 2026/i.test(rLower) ||
                             !/(?:work experience|experience)[\s:]*[1-9]\s*\+?\s*years/i.test(rLower);

  const candYearsMatch = rLower.match(/(?:work experience|experience)[\s:]*(\d{1,2})\s*\+?\s*years/i);
  const candidateYears = candYearsMatch ? parseInt(candYearsMatch[1], 10) : 0;

  // JD Experience check: ONLY if JD explicitly specifies years or fresher!
  const jdExpMatch = jdLower.match(/(\d{1,2})\s*\+?\s*(?:to\s*(\d{1,2}))?\s*(?:years|year|yrs|yr)/i) ||
                     jdLower.match(/(?:experience|exp)[\s:]*(\d{1,2})\s*\+?\s*(?:to\s*(\d{1,2}))?\s*(?:years|year|yrs|yr)/i);

  const jdIsFresher = /(?:fresher|freshers|entry[- ]level|0 years|zero years|2025|2026)/i.test(jdLower);

  let hasJdExp = false;
  let jdExpText = "Not Specified in JD";
  let isExpQualified = true;
  let expStatus = "N/A";

  if (jdExpMatch) {
    hasJdExp = true;
    const reqYears = parseInt(jdExpMatch[1], 10);
    jdExpText = `${reqYears}+ Years`;

    // Strict Rule: If JD requires 1, 2, 3, 4, 5, 6, 7+ years and candidate is Fresher -> NOT QUALIFIED
    if (reqYears >= 1 && isCandidateFresher && candidateYears < reqYears) {
      isExpQualified = false;
      expStatus = `NOT QUALIFIED (JD requires ${reqYears}+ yrs, Candidate is Fresher)`;
    } else if (candidateYears >= reqYears) {
      isExpQualified = true;
      expStatus = `MET (${candidateYears} yrs verified)`;
    } else {
      isExpQualified = false;
      expStatus = `NOT QUALIFIED (${candidateYears} yrs vs ${reqYears}+ yrs required)`;
    }
  } else if (jdIsFresher) {
    hasJdExp = true;
    jdExpText = "Fresher (0-1 Yrs)";
    if (isCandidateFresher) {
      isExpQualified = true;
      expStatus = "MET (Candidate is Fresher)";
    } else {
      isExpQualified = true;
      expStatus = "QUALIFIED (Fresher role)";
    }
  }

  // Degree / Education Check
  const jdNeedsDegree = /b\.?tech|b\.?e|m\.?tech|m\.?e|mca|bachelor|master|degree/i.test(jdLower);
  const candHasDegree = /b\.?tech|b\.?e|m\.?tech|m\.?e|mca|bachelor|master|degree|engineering/i.test(rLower);
  const degreeStatus = jdNeedsDegree ? (candHasDegree ? "MET" : "NOT SPECIFIED IN RESUME") : "NOT SPECIFIED IN JD";

  // 3. Exact Matching Percentage Calculation
  const totalSkills = primarySkills.length + secondarySkills.length;
  const matchedTotal = matchedPrimary.length + matchedSecondary.length;
  const matchPercentage = totalSkills > 0 ? Math.round((matchedTotal / totalSkills) * 100) : 0;

  // 4. Target Role Match Verdict & Shortlisting Status
  // If primary skills are 0 or experience requirement is failed -> NOT QUALIFIED & NOT SHORTLISTED
  let roleVerdict = "";
  let verdictColor = "#f87171"; // Red
  let shortlistStatus = "NOT SHORTLISTED";
  let shortlistProb = 0;
  let verdictExplanation = "";

  if (!isExpQualified) {
    roleVerdict = "❌ NOT QUALIFIED FOR TARGET ROLE";
    verdictColor = "#f87171";
    shortlistStatus = "NOT SHORTLISTED (Experience Mismatch)";
    shortlistProb = Math.min(matchPercentage, 20);
    verdictExplanation = `Candidate does not satisfy the minimum experience requirements (${jdExpText}) for ${targetRole}.`;
  } else if (primarySkills.length > 0 && matchedPrimary.length === 0) {
    roleVerdict = "❌ NOT QUALIFIED FOR TARGET ROLE";
    verdictColor = "#f87171";
    shortlistStatus = "NOT SHORTLISTED (Primary Skills Missing)";
    shortlistProb = Math.min(matchPercentage, 25);
    verdictExplanation = `Zero primary mandatory skills matched. Recruiter requires [${primarySkills.join(", ").toUpperCase()}], which are absent from the resume.`;
  } else if (primarySkills.length > 0 && matchedPrimary.length === primarySkills.length && matchPercentage >= 70) {
    roleVerdict = "✅ HIGH MATCH FOR TARGET ROLE";
    verdictColor = "#4ade80";
    shortlistStatus = "SHORTLISTED (HIGH CHANCE)";
    shortlistProb = Math.max(matchPercentage, 75);
    verdictExplanation = `Candidate satisfies all mandatory primary skills and meets minimum eligibility criteria for ${targetRole}.`;
  } else if (matchedPrimary.length > 0 || matchPercentage >= 40) {
    roleVerdict = "⚠️ PARTIAL MATCH FOR TARGET ROLE";
    verdictColor = "#facc15";
    shortlistStatus = "UNDER REVIEW (MODERATE CHANCE)";
    shortlistProb = matchPercentage;
    verdictExplanation = `Candidate satisfies some skills, but missing core requirements will lower ATS ranking for ${targetRole}.`;
  } else {
    roleVerdict = "❌ NOT QUALIFIED FOR TARGET ROLE";
    verdictColor = "#f87171";
    shortlistStatus = "NOT SHORTLISTED";
    shortlistProb = matchPercentage;
    verdictExplanation = `Low keyword alignment (${matchPercentage}% match) between resume and job description.`;
  }

  // 5. Targeted AI Improvement Tips (Direct & Actionable)
  const improvementTips = [];
  if (missingPrimary.length > 0) {
    improvementTips.push(
      `Mandatory Primary Skills Missing: Add hands-on experience for [${missingPrimary.join(", ").toUpperCase()}]. Recruiters filter out profiles missing primary skills.`
    );
  }
  if (missingSecondary.length > 0) {
    improvementTips.push(
      `Add Preferred Secondary Skills: Include [${missingSecondary.join(", ").toUpperCase()}] to boost your match score from ${matchPercentage}% to 90%+.`
    );
  }
  if (!isExpQualified) {
    improvementTips.push(
      `Experience Discrepancy: The role requires ${jdExpText}. Highlight verifiable independent projects or open-source work if applying without formal years.`
    );
  }
  improvementTips.push(
    `Headline Optimization: Set your resume title/headline explicitly to "${targetRole}" to pass automated ATS title matching.`
  );

  return {
    targetRole,
    matchPercentage,
    shortlistStatus,
    shortlistProb,
    roleVerdict,
    verdictColor,
    verdictExplanation,
    primarySkills,
    matchedPrimary,
    missingPrimary,
    secondarySkills,
    matchedSecondary,
    missingSecondary,
    hasJdExp,
    jdExpText,
    expStatus,
    isExpQualified,
    degreeStatus,
    improvementTips
  };
}

function App() {
  const [file, setFile] = useState(null)
  const [resumeTextInput, setResumeTextInput] = useState('')
  const [inputMode, setInputMode] = useState('pdf')
  const [jobDescription, setJobDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [evalResult, setEvalResult] = useState(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0])
      setEvalResult(null)
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
      alert("Please upload a resume (PDF) first.");
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
    setEvalResult(null);

    try {
      let finalResumeText = '';
      if (inputMode === 'pdf' && file) {
        finalResumeText = await extractTextFromPDF(file);
      } else {
        finalResumeText = resumeTextInput;
      }

      const res = evaluateCandidate(finalResumeText, jobDescription);
      await new Promise(resolve => setTimeout(resolve, 400));
      setEvalResult(res);

    } catch (error) {
      console.error("Evaluation Error:", error);
      alert("Error evaluating resume: " + error.message);
    } finally {
      setIsAnalyzing(false);
    }
  }

  return (
    <div className="container">
      <header className="glass-panel">
        <h1>AI Resume Analyzer</h1>
        <p>Smart ATS Parsing & Shortlisting Probability</p>
      </header>

      <main className="main-content">
        {/* Input Switch */}
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
                    setEvalResult(null)
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
            placeholder="Paste Job Description with Primary Skills, Secondary Skills, Minimum Qualifications, etc..."
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
          {isAnalyzing ? 'Matching Skills & Qualifications...' : 'Evaluate Match against JD'}
        </button>

        {evalResult && (
          <div className="dashboard-container glass-panel">
            
            {/* 1. Target Role Match Verdict Card */}
            <div className="target-role-verdict-box" style={{ borderLeft: `6px solid ${evalResult.verdictColor}` }}>
              <div className="verdict-header">
                <div>
                  <span className="verdict-badge" style={{ color: evalResult.verdictColor }}>
                    {evalResult.roleVerdict}
                  </span>
                  <h2 style={{ fontSize: '1.25rem', marginTop: '0.4rem', color: '#fff' }}>
                    Target Role: {evalResult.targetRole}
                  </h2>
                </div>
                <div className="verdict-scores">
                  <div className="score-pill">
                    <span>JD Match:</span>
                    <strong style={{ fontSize: '1.1rem', color: '#00f0ff' }}>{evalResult.matchPercentage}%</strong>
                  </div>
                  <div className="score-pill">
                    <span>Shortlisting:</span>
                    <strong style={{ color: evalResult.verdictColor }}>
                      {evalResult.shortlistStatus}
                    </strong>
                  </div>
                </div>
              </div>
              <p className="verdict-summary">{evalResult.verdictExplanation}</p>
            </div>

            {/* 2. Primary Skills vs Secondary Skills Cards */}
            <div className="skills-evaluation-grid">
              
              {/* Primary Skills Card */}
              <div className="eval-card primary-card">
                <div className="eval-card-header">
                  <h3>⚡ Primary Skills (Mandatory)</h3>
                  <span className="skill-counter">
                    {evalResult.matchedPrimary.length} of {evalResult.primarySkills.length} Matched
                  </span>
                </div>

                <div className="skill-group">
                  <span className="group-label success-label">✅ Matched in Resume:</span>
                  <div className="tag-cluster">
                    {evalResult.matchedPrimary.length > 0 ? (
                      evalResult.matchedPrimary.map((s, idx) => (
                        <span key={idx} className="skill-tag match">{s}</span>
                      ))
                    ) : (
                      <span className="none-text">None found in resume</span>
                    )}
                  </div>
                </div>

                <div className="skill-group" style={{ marginTop: '1rem' }}>
                  <span className="group-label danger-label">❌ Missing from Resume:</span>
                  <div className="tag-cluster">
                    {evalResult.missingPrimary.length > 0 ? (
                      evalResult.missingPrimary.map((s, idx) => (
                        <span key={idx} className="skill-tag miss">{s}</span>
                      ))
                    ) : (
                      <span className="success-text">All primary skills matched!</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Secondary Skills Card */}
              <div className="eval-card secondary-card">
                <div className="eval-card-header">
                  <h3>🌟 Secondary Skills (Preferred / Bonus)</h3>
                  <span className="skill-counter">
                    {evalResult.matchedSecondary.length} of {evalResult.secondarySkills.length} Matched
                  </span>
                </div>

                <div className="skill-group">
                  <span className="group-label success-label">✅ Matched in Resume:</span>
                  <div className="tag-cluster">
                    {evalResult.matchedSecondary.length > 0 ? (
                      evalResult.matchedSecondary.map((s, idx) => (
                        <span key={idx} className="skill-tag match">{s}</span>
                      ))
                    ) : (
                      <span className="none-text">None found in resume</span>
                    )}
                  </div>
                </div>

                <div className="skill-group" style={{ marginTop: '1rem' }}>
                  <span className="group-label warning-label">⚠️ Missing Preferred Skills:</span>
                  <div className="tag-cluster">
                    {evalResult.missingSecondary.length > 0 ? (
                      evalResult.missingSecondary.map((s, idx) => (
                        <span key={idx} className="skill-tag miss-secondary">{s}</span>
                      ))
                    ) : (
                      <span className="success-text">All secondary skills matched!</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Minimum Qualifications & Eligibility Check */}
            <div className="qualifications-panel glass-panel">
              <h3 style={{ fontSize: '1.05rem', marginBottom: '1rem', color: '#00f0ff' }}>
                🎓 Minimum Qualifications & Eligibility Check
              </h3>
              <div className="qual-grid">
                <div className="qual-item">
                  <span className="qual-title">Degree / Education Requirement:</span>
                  <span className={`status-pill ${evalResult.degreeStatus === 'MET' ? 'high' : 'moderate'}`}>
                    {evalResult.degreeStatus}
                  </span>
                </div>
                {evalResult.hasJdExp && (
                  <div className="qual-item">
                    <span className="qual-title">Experience Requirement:</span>
                    <span><strong>{evalResult.jdExpText}</strong></span>
                    <span className={`status-pill ${evalResult.isExpQualified ? 'high' : 'low'}`} style={{ marginLeft: '0.5rem' }}>
                      {evalResult.expStatus}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 4. Actionable AI Improvement Tips */}
            <div className="tips-panel glass-panel">
              <h3 style={{ fontSize: '1.05rem', color: '#00f0ff', marginBottom: '0.75rem' }}>
                💡 Direct AI Improvement Tips for this Job Description:
              </h3>
              <ul className="tips-list">
                {evalResult.improvementTips.map((tip, idx) => (
                  <li key={idx} className="tip-item">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        )}
      </main>
    </div>
  )
}

export default App
