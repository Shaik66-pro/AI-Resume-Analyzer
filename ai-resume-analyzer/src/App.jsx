import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import * as pdfjsLib from 'pdfjs-dist'
import './App.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Broad technical dictionary for keyword normalization
const TECH_DICTIONARY = [
  "python", "sql", "data analytics", "data analysis", "prompt engineering", "analytical skills",
  "mysql", "postgresql", "mongodb", "database", "machine learning", "deep learning", "nlp",
  "generative ai", "llm", "tableau", "power bi", "excel", "pandas", "numpy", "scikit-learn",
  "react", "react.js", "javascript", "typescript", "html", "css", "node.js", "express",
  "flask", "django", "fastapi", "spring boot", "java", "c++", "c#", ".net", "rest api",
  "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "git", "github", "linux",
  "mulesoft", "workato", "ipaas", "digital transformation", "data flow", "api integration",
  "selenium", "manual testing", "automation testing", "jira", "agile"
];

// Normalize and match skill against text
function textContainsSkill(textLower, skill) {
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
  const escaped = s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i').test(textLower);
}

// Extract specific lines/sections from Job Description text
function parseJdSections(jdText) {
  const lines = jdText.split(/[\r\n]+/);
  
  let targetRole = "";
  let primarySkillsRaw = [];
  let secondarySkillsRaw = [];
  let minQualRaw = [];
  let prefQualRaw = [];

  let currentSection = "";

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // Detect Target Role / Designation
    const roleMatch = trimmed.match(/(?:designation|position|job title|role)[\s:]+(.+)/i);
    if (roleMatch && !targetRole) {
      targetRole = roleMatch[1].trim();
      return;
    }

    // Detect Section Headers
    if (/^(?:primary skills?|core skills?|mandatory skills?|must[- ]have skills?)/i.test(trimmed)) {
      currentSection = "primary";
      const inline = trimmed.replace(/^(?:primary skills?|core skills?|mandatory skills?|must[- ]have skills?)[\s:]*/i, '');
      if (inline) primarySkillsRaw.push(inline);
      return;
    }

    if (/^(?:secondary skills?|preferred skills?|good to have|nice to have|additional skills?)/i.test(trimmed)) {
      currentSection = "secondary";
      const inline = trimmed.replace(/^(?:secondary skills?|preferred skills?|good to have|nice to have|additional skills?)[\s:]*/i, '');
      if (inline) secondarySkillsRaw.push(inline);
      return;
    }

    if (/^(?:minimum qualifications?|eligibility criteria?|eligibility|education|qualification)/i.test(trimmed)) {
      currentSection = "minQual";
      const inline = trimmed.replace(/^(?:minimum qualifications?|eligibility criteria?|eligibility|education|qualification)[\s:]*/i, '');
      if (inline) minQualRaw.push(inline);
      return;
    }

    if (/^(?:preferred qualifications?|desired qualifications?)/i.test(trimmed)) {
      currentSection = "prefQual";
      const inline = trimmed.replace(/^(?:preferred qualifications?|desired qualifications?)[\s:]*/i, '');
      if (inline) prefQualRaw.push(inline);
      return;
    }

    if (/^(?:technical skills required|skills required|skills)[\s:]*/i.test(trimmed)) {
      if (!currentSection) currentSection = "primary";
      const inline = trimmed.replace(/^(?:technical skills required|skills required|skills)[\s:]*/i, '');
      if (inline) primarySkillsRaw.push(inline);
      return;
    }

    // Capture content under the active section
    if (currentSection === "primary") {
      primarySkillsRaw.push(trimmed);
    } else if (currentSection === "secondary") {
      secondarySkillsRaw.push(trimmed);
    } else if (currentSection === "minQual") {
      minQualRaw.push(trimmed);
    } else if (currentSection === "prefQual") {
      prefQualRaw.push(trimmed);
    }
  });

  // Helper to split and clean tokens from raw strings
  const cleanTokens = (rawArr) => {
    const tokens = [];
    rawArr.join(" ").split(/[,;\n•\-\*\/]/).forEach(item => {
      let t = item.trim().toLowerCase();
      // Clean prefixes
      t = t.replace(/^(?:good|basic|strong|hands[- ]on|knowledge of|experience in|proficiency in)\s+/i, '').trim();
      if (t.length >= 2 && !/^(skills|location|bangalore|hyd|candidates|note|work|details)$/i.test(t)) {
        tokens.push(t);
      }
    });
    return Array.from(new Set(tokens));
  };

  let primarySkills = cleanTokens(primarySkillsRaw);
  let secondarySkills = cleanTokens(secondarySkillsRaw);

  // If no explicit primary/secondary tags were provided, extract automatically from entire JD text
  if (primarySkills.length === 0 && secondarySkills.length === 0) {
    const jdLower = jdText.toLowerCase();
    const allFound = TECH_DICTIONARY.filter(tech => textContainsSkill(jdLower, tech));
    // Split first half as primary, remainder as secondary
    primarySkills = allFound.slice(0, Math.ceil(allFound.length * 0.6));
    secondarySkills = allFound.slice(Math.ceil(allFound.length * 0.6));
  }

  // Deduplicate between primary and secondary
  secondarySkills = secondarySkills.filter(s => !primarySkills.includes(s));

  return {
    targetRole: targetRole || "Designation as specified in JD",
    primarySkills,
    secondarySkills,
    minQualText: minQualRaw.join(" "),
    prefQualText: prefQualRaw.join(" ")
  };
}

// Master ATS Targeted Evaluation
function evaluateResumeAgainstJd(resumeText, jdText) {
  const rLower = (resumeText || "").toLowerCase();
  const jdLower = (jdText || "").toLowerCase();

  // 1. Parse JD Sections
  const { targetRole, primarySkills, secondarySkills, minQualText, prefQualText } = parseJdSections(jdText);

  // 2. Evaluate Primary Skills (Mandatory)
  const matchedPrimary = [];
  const missingPrimary = [];
  primarySkills.forEach(skill => {
    if (textContainsSkill(rLower, skill)) {
      matchedPrimary.push(skill);
    } else {
      missingPrimary.push(skill);
    }
  });

  // 3. Evaluate Secondary Skills (Preferred / Bonus)
  const matchedSecondary = [];
  const missingSecondary = [];
  secondarySkills.forEach(skill => {
    if (textContainsSkill(rLower, skill)) {
      matchedSecondary.push(skill);
    } else {
      missingSecondary.push(skill);
    }
  });

  // 4. Minimum Qualifications Check (Degree, Batch, Experience)
  // Education Check
  const jdRequiresDegree = /b\.?tech|b\.?e|m\.?tech|m\.?e|bachelor|master|mca|degree/i.test(jdLower);
  const resumeHasDegree = /b\.?tech|b\.?e|m\.?tech|m\.?e|bachelor|master|mca|degree|computer science|engineering/i.test(rLower);
  const educationStatus = jdRequiresDegree ? (resumeHasDegree ? "MET" : "NOT SPECIFIED") : "NOT SPECIFIED IN JD";

  // Experience Check (ONLY if JD mentions it)
  const jdExpMatch = jdLower.match(/(\d{1,2})\s*\+?\s*(?:to\s*(\d{1,2}))?\s*(?:years|year|yrs|yr)/i);
  const jdIsFresher = /fresher|entry[- ]level|0 years|2025|2026/i.test(jdLower);
  
  let jdExpLabel = "Not Specified in JD";
  let expStatus = "N/A";

  if (jdIsFresher) {
    jdExpLabel = "Fresher (0 Yrs)";
    // Check if candidate is fresher
    const candidateIsFresher = /fresher|entry[- ]level|0 years|batch of 2025|batch of 2026|student/i.test(rLower) ||
                               !/(?:work experience|experience)[\s:]*[2-9]\s*\+?\s*years/i.test(rLower);
    expStatus = candidateIsFresher ? "MET (Candidate is Fresher)" : "EXPERIENCED";
  } else if (jdExpMatch) {
    const requiredYears = parseInt(jdExpMatch[1], 10);
    jdExpLabel = `${requiredYears}+ Years`;
    const candYearsMatch = rLower.match(/(?:work experience|experience)[\s:]*(\d{1,2})\s*\+?\s*years/i);
    const candYears = candYearsMatch ? parseInt(candYearsMatch[1], 10) : 0;
    expStatus = candYears >= requiredYears ? "MET" : `GAP (${candYears} yrs vs ${requiredYears} required)`;
  }

  // 5. Target Role Compatibility Verdict
  const totalPrimary = primarySkills.length;
  const primaryMatchRatio = totalPrimary > 0 ? (matchedPrimary.length / totalPrimary) : 0.6;
  
  let roleVerdict = "MATCHED";
  let verdictColor = "#4ade80"; // Green
  let verdictSummary = "";

  if (primaryMatchRatio >= 0.75 && (expStatus.startsWith("MET") || expStatus === "N/A")) {
    roleVerdict = "✅ HIGH MATCH FOR TARGET ROLE";
    verdictColor = "#4ade80";
    verdictSummary = `Your profile aligns strongly with the ${targetRole} requirements. Core primary skills are well-represented.`;
  } else if (primaryMatchRatio >= 0.40) {
    roleVerdict = "⚠️ PARTIAL MATCH FOR TARGET ROLE";
    verdictColor = "#facc15";
    verdictSummary = `Your profile has a partial match. You satisfy ${matchedPrimary.length} of ${totalPrimary} primary skills, but addressing the missing primary skills is crucial for shortlisting.`;
  } else {
    roleVerdict = "❌ LOW MATCH FOR TARGET ROLE";
    verdictColor = "#f87171";
    verdictSummary = `Significant skill gaps detected for this ${targetRole} role. Most primary skills required by the recruiter are absent.`;
  }

  // Exact Match Percentage
  const allJdSkills = primarySkills.concat(secondarySkills);
  const totalSkillsCount = allJdSkills.length;
  const matchedTotalCount = matchedPrimary.length + matchedSecondary.length;
  const matchPercentage = totalSkillsCount > 0 ? Math.round((matchedTotalCount / totalSkillsCount) * 100) : 50;

  // Shortlist Probability
  let probCalc = Math.round(primaryMatchRatio * 70 + (matchedSecondary.length > 0 ? 15 : 5) + (educationStatus === "MET" ? 15 : 10));
  const shortlistProbability = Math.min(Math.max(probCalc, 15), 98);
  const shortlistChance = shortlistProbability >= 70 ? "HIGH" : shortlistProbability >= 45 ? "MODERATE" : "LOW";

  // 6. Actionable AI Improvement Tips (Direct & Clear)
  const improvementTips = [];
  if (missingPrimary.length > 0) {
    improvementTips.push(
      `Add Missing Primary Skills: The recruiter marked [${missingPrimary.join(", ").toUpperCase()}] as mandatory. Add these keywords in your Technical Skills section and mention how you used them in your projects.`
    );
  }
  if (missingSecondary.length > 0) {
    improvementTips.push(
      `Incorporate Secondary Skills for Competitive Edge: Add [${missingSecondary.join(", ").toUpperCase()}] to stand out over other applicants.`
    );
  }
  if (educationStatus === "MET") {
    improvementTips.push(
      `Eligibility Verified: Your education meets the JD's minimum criteria (${jdRequiresDegree ? "B.Tech/Degree" : "Specified"}). Ensure your graduation batch (e.g. 2025/2026) is highlighted prominently.`
    );
  }
  improvementTips.push(
    `Align Resume Heading: Update your resume headline to match the target role "${targetRole}" to instantly pass ATS keyword filters.`
  );

  return {
    targetRole,
    matchPercentage,
    shortlistChance,
    shortlistProbability,
    roleVerdict,
    verdictColor,
    verdictSummary,
    primarySkills,
    matchedPrimary,
    missingPrimary,
    secondarySkills,
    matchedSecondary,
    missingSecondary,
    educationStatus,
    jdExpLabel,
    expStatus,
    improvementTips
  };
}

function App() {
  const [file, setFile] = useState(null)
  const [resumeTextInput, setResumeTextInput] = useState('')
  const [inputMode, setInputMode] = useState('pdf')
  const [jobDescription, setJobDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState(null)

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setFile(acceptedFiles[0])
      setResult(null)
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
    setResult(null);

    try {
      let finalResumeText = '';
      if (inputMode === 'pdf' && file) {
        finalResumeText = await extractTextFromPDF(file);
      } else {
        finalResumeText = resumeTextInput;
      }

      const evalResult = evaluateResumeAgainstJd(finalResumeText, jobDescription);
      await new Promise(resolve => setTimeout(resolve, 500));
      setResult(evalResult);

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
        {/* Input Mode Switch */}
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
                    setResult(null)
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
            placeholder="Paste Job Description with Primary Skills, Secondary Skills, and Qualifications..."
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

        {result && (
          <div className="dashboard-container glass-panel">
            
            {/* 1. Target Role Compatibility Banner */}
            <div className="target-role-verdict-box" style={{ borderLeft: `6px solid ${result.verdictColor}` }}>
              <div className="verdict-header">
                <div>
                  <span className="verdict-badge" style={{ color: result.verdictColor }}>
                    {result.roleVerdict}
                  </span>
                  <h2 style={{ fontSize: '1.3rem', marginTop: '0.4rem', color: '#fff' }}>
                    Target Role: {result.targetRole}
                  </h2>
                </div>
                <div className="verdict-scores">
                  <div className="score-pill">
                    <span>JD Match:</span>
                    <strong>{result.matchPercentage}%</strong>
                  </div>
                  <div className="score-pill">
                    <span>Shortlisting:</span>
                    <strong style={{ color: result.shortlistChance === 'HIGH' ? '#4ade80' : result.shortlistChance === 'MODERATE' ? '#facc15' : '#f87171' }}>
                      {result.shortlistChance} ({result.shortlistProbability}%)
                    </strong>
                  </div>
                </div>
              </div>
              <p className="verdict-summary">{result.verdictSummary}</p>
            </div>

            {/* 2. Primary Skills vs Secondary Skills Grid */}
            <div className="skills-evaluation-grid">
              
              {/* Primary Skills Card */}
              <div className="eval-card primary-card">
                <div className="eval-card-header">
                  <h3>⚡ Primary Skills (Mandatory)</h3>
                  <span className="skill-counter">
                    {result.matchedPrimary.length} of {result.primarySkills.length} Matched
                  </span>
                </div>

                <div className="skill-group">
                  <span className="group-label success-label">✅ Matched in Resume:</span>
                  <div className="tag-cluster">
                    {result.matchedPrimary.length > 0 ? (
                      result.matchedPrimary.map((s, idx) => (
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
                    {result.missingPrimary.length > 0 ? (
                      result.missingPrimary.map((s, idx) => (
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
                    {result.matchedSecondary.length} of {result.secondarySkills.length} Matched
                  </span>
                </div>

                <div className="skill-group">
                  <span className="group-label success-label">✅ Matched in Resume:</span>
                  <div className="tag-cluster">
                    {result.matchedSecondary.length > 0 ? (
                      result.matchedSecondary.map((s, idx) => (
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
                    {result.missingSecondary.length > 0 ? (
                      result.missingSecondary.map((s, idx) => (
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
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#00f0ff' }}>
                🎓 Minimum Qualifications & Eligibility Check
              </h3>
              <div className="qual-grid">
                <div className="qual-item">
                  <span className="qual-title">Degree / Education Eligibility:</span>
                  <span className={`status-pill ${result.educationStatus === 'MET' ? 'high' : 'moderate'}`}>
                    {result.educationStatus}
                  </span>
                </div>
                <div className="qual-item">
                  <span className="qual-title">Experience Requirement:</span>
                  <span><strong>{result.jdExpLabel}</strong></span>
                  <span className={`status-pill ${result.expStatus.startsWith('MET') ? 'high' : 'moderate'}`} style={{ marginLeft: '0.5rem' }}>
                    {result.expStatus}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. Actionable AI Improvement Tips */}
            <div className="tips-panel glass-panel">
              <h3 style={{ fontSize: '1.15rem', color: '#00f0ff', marginBottom: '1rem' }}>
                💡 Direct AI Improvement Tips for this Job Description:
              </h3>
              <ul className="tips-list">
                {result.improvementTips.map((tip, idx) => (
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
