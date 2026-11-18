import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import * as pdfjsLib from 'pdfjs-dist'
import './App.css'

// Secure CDN for PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Comprehensive multi-domain skill dictionary (Web, AI, Cloud, Mobile, QA, Data, Core)
const COMPREHENSIVE_SKILL_CATALOG = [
  // Programming Languages
  "python", "java", "c++", "c#", "c", "javascript", "typescript", "php", "ruby", "golang", "go",
  "kotlin", "swift", "dart", "r", "scala", "rust", "perl", "bash", "shell", "powershell",
  // AI, Data Science & Analytics
  "prompt engineering", "data analytics", "data analysis", "analytical skills", "sql", "mysql",
  "postgresql", "mongodb", "oracle", "sqlite", "nosql", "redis", "cassandra", "snowflake", "bigquery",
  "machine learning", "deep learning", "nlp", "natural language processing", "generative ai", "llm", "large language models",
  "computer vision", "opencv", "tensorflow", "pytorch", "keras", "scikit-learn", "pandas", "numpy", "scipy",
  "tableau", "power bi", "excel", "data visualization", "data mining", "etl", "spark", "hadoop", "pyspark",
  // Full Stack & Web
  "react", "react.js", "reactjs", "angular", "vue", "vue.js", "next.js", "node.js", "nodejs", "express", "express.js",
  "flask", "django", "fastapi", "spring", "spring boot", "asp.net", ".net", "html", "html5", "css", "css3",
  "tailwind css", "bootstrap", "sass", "redux", "graphql", "rest api", "restful", "rest apis", "microservices",
  // Cloud & DevOps
  "aws", "amazon web services", "azure", "gcp", "google cloud", "docker", "kubernetes", "k8s",
  "ci/cd", "ci-cd", "jenkins", "git", "github", "gitlab", "bitbucket", "linux", "unix", "terraform", "ansible",
  // Mobile & Testing
  "android", "ios", "flutter", "react native", "selenium", "cypress", "junit", "pytest", "unit testing", "manual testing", "automation testing",
  // Methodologies & Tools
  "agile", "scrum", "jira", "postman", "problem solving", "communication skills", "teamwork"
];

// Alias and synonyms mapping for robust ATS matching
const SKILL_ALIASES = {
  "react": ["react.js", "reactjs", "react"],
  "node.js": ["node", "nodejs", "node.js"],
  "python": ["python", "python3", "python 3"],
  "sql": ["sql", "mysql", "postgresql", "postgres", "sqlite", "pl/sql", "t-sql"],
  "prompt engineering": ["prompt engineering", "prompt design", "prompting", "llm prompts", "prompts"],
  "data analytics": ["data analytics", "data analysis", "data analyst", "analytical skills", "analytics"],
  "analytical skills": ["analytical skills", "analytical", "problem solving", "data analytics"],
  "machine learning": ["machine learning", "ml"],
  "deep learning": ["deep learning", "dl"],
  "nlp": ["nlp", "natural language processing", "text processing"],
  "rest api": ["rest api", "rest apis", "restful api", "restful", "apis", "api integration"],
  "aws": ["aws", "amazon web services", "ec2", "s3"],
  "docker": ["docker", "containerization", "dockerfile", "containers"],
  "git": ["git", "github", "gitlab", "version control"]
};

// Extract skills directly from ANY Job Description text
function extractSkillsFromJD(jdText) {
  const jdLower = (jdText || "").toLowerCase();
  const extracted = new Set();

  // 1. Look for explicit skill bullet points and comma-separated lists
  // e.g. "Skills: SQL, Python, Prompt Engineering"
  const skillSectionMatches = jdText.match(/(?:skills|requirements|technologies|qualifications|must have|competencies|primary skills|secondary skills)[\s:]+([^\n\r]+(?:\n[•\-\*][^\n\r]+)*)/gi);
  if (skillSectionMatches) {
    skillSectionMatches.forEach(section => {
      // Split on commas, semicolons, bullets, and slashes
      const tokens = section.replace(/^(?:skills|requirements|technologies|qualifications|must have|competencies|primary skills|secondary skills)[\s:]+/i, '')
        .split(/[,;\n•\-\*\/]/)
        .map(t => t.trim().toLowerCase())
        .filter(t => t.length >= 2 && t.length <= 40);

      tokens.forEach(token => {
        // Clean prefixes like "good", "basic", "knowledge of", "experience with"
        const cleanToken = token.replace(/^(?:good|basic|strong|advanced|solid|hands[- ]on|knowledge of|experience with|proficiency in)\s+/i, '').trim();
        if (cleanToken.length >= 2) {
          // Check if matches known catalog or is a clean alphanumeric phrase
          const matchedCatalog = COMPREHENSIVE_SKILL_CATALOG.find(s => s === cleanToken || cleanToken.includes(s));
          if (matchedCatalog) {
            extracted.add(matchedCatalog);
          } else if (/^[a-z0-9\+\#\.\s]+$/i.test(cleanToken) && cleanToken.split(' ').length <= 3) {
            extracted.add(cleanToken);
          }
        }
      });
    });
  }

  // 2. Scan entire JD body against comprehensive catalog
  COMPREHENSIVE_SKILL_CATALOG.forEach(skill => {
    const escaped = skill.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
    if (pattern.test(jdLower)) {
      extracted.add(skill);
    }
  });

  return Array.from(extracted);
}

// Check if a skill exists in resume using aliases and word boundaries
function isSkillInResume(skill, resumeLower) {
  const aliases = SKILL_ALIASES[skill.toLowerCase()] || [skill.toLowerCase()];
  return aliases.some(alias => {
    const escaped = alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
    return pattern.test(resumeLower);
  });
}

// Find the best sentence in resume providing evidence for a skill
function findEvidenceSentence(skill, resumeSentences) {
  const aliases = SKILL_ALIASES[skill.toLowerCase()] || [skill.toLowerCase()];
  for (const sentence of resumeSentences) {
    const sLower = sentence.toLowerCase();
    for (const alias of aliases) {
      const escaped = alias.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const pattern = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
      if (pattern.test(sLower)) {
        return sentence.trim();
      }
    }
  }
  return `Demonstrated knowledge and application of ${skill.toUpperCase()} documented in resume.`;
}

// Advanced Multi-Domain Universal ATS Engine
function analyzeJobAndResume(resumeText, jdText) {
  const rLower = (resumeText || "").toLowerCase();
  const jdLower = (jdText || "").toLowerCase();

  // 1. Extract Target Requirements from ANY Job Description dynamically
  let targetSkills = extractSkillsFromJD(jdText);

  // Fallback if JD is extremely brief: grab general top keywords
  if (targetSkills.length === 0) {
    COMPREHENSIVE_SKILL_CATALOG.forEach(skill => {
      if (jdLower.includes(skill)) targetSkills.push(skill);
    });
  }

  // Deduplicate and filter noise
  targetSkills = Array.from(new Set(targetSkills)).slice(0, 12);

  // 2. Break Resume into clean sentences
  const resumeSentences = resumeText
    .split(/(?<=[.!?\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 8);

  const matchedSkills = [];
  const missingSkills = [];
  const experienceBreakdown = [];

  targetSkills.forEach(skill => {
    const found = isSkillInResume(skill, rLower);

    if (found) {
      matchedSkills.push(skill);
      const sentence = findEvidenceSentence(skill, resumeSentences);
      experienceBreakdown.push({
        skill: skill.toUpperCase(),
        required: "Required in JD",
        found: "Verified in Resume",
        status: "Met",
        extractedSentence: sentence.slice(0, 160) + (sentence.length > 160 ? "..." : "")
      });
    } else {
      missingSkills.push(skill);
      experienceBreakdown.push({
        skill: skill.toUpperCase(),
        required: "Required in JD",
        found: "Missing in Resume",
        status: "Missing",
        extractedSentence: `Candidate resume does not mention practical experience with ${skill.toUpperCase()}. Consider adding relevant projects.`
      });
    }
  });

  // 3. Real Experience Level Detection (Accurate for Freshers AND Experienced)
  // Check explicit years mentioned in Resume
  const expPatterns = [
    /(\d{1,2})\s*\+?\s*(?:to\s*(\d{1,2}))?\s*(?:years|year|yrs|yr)\s*(?:of)?\s*(?:exp|experience)/i,
    /experience\s*[:\-]?\s*(\d{1,2})\s*\+?\s*(?:years|year|yrs|yr)/i,
    /(?:worked|working)\s*(?:for)?\s*(\d{1,2})\s*\+?\s*(?:years|year|yrs|yr)/i
  ];

  let detectedCandidateYears = 0;
  for (const pat of expPatterns) {
    const match = rLower.match(pat);
    if (match) {
      detectedCandidateYears = parseInt(match[1], 10);
      break;
    }
  }

  // Check date ranges like 2021 - 2024 (approx 3 years)
  const dateRangeMatch = rLower.match(/(201\d|202\d)\s*[-–to]\s*(202\d|present|current)/i);
  if (dateRangeMatch && detectedCandidateYears === 0) {
    const startYear = parseInt(dateRangeMatch[1], 10);
    const endYear = dateRangeMatch[2].toLowerCase().includes('present') || dateRangeMatch[2].toLowerCase().includes('current')
      ? 2026 : parseInt(dateRangeMatch[2], 10);
    const diff = endYear - startYear;
    if (diff > 0 && diff <= 25) {
      detectedCandidateYears = diff;
    }
  }

  // Check Fresher indications
  const hasFresherKeyword = /fresher|entry[- ]level|0 years|batch of 2025|batch of 2026|graduating in|seeking entry/i.test(rLower);
  const isCandidateFresher = (detectedCandidateYears === 0) && (hasFresherKeyword || /student|intern/i.test(rLower));

  // Check JD Experience Requirement
  const isJdFresher = /fresher|entry[- ]level|0 years|2025|2026|new grad|no experience required/i.test(jdLower);
  const jdExpMatch = jdLower.match(/(\d{1,2})\s*\+?\s*(?:to\s*(\d{1,2}))?\s*(?:years|year|yrs|yr)/i);
  const jdRequiredYears = jdExpMatch ? parseInt(jdExpMatch[1], 10) : (isJdFresher ? 0 : 1);

  let careerLevel = isCandidateFresher 
    ? "Fresher / Entry-Level (2025-2026)" 
    : `${detectedCandidateYears || 1}+ Years Experienced Professional`;

  let totalExpRequired = isJdFresher ? "Fresher (0-1 Yrs)" : `${jdRequiredYears}+ Years`;
  let totalExpFound = isCandidateFresher ? "Fresher / Projects" : `${detectedCandidateYears || 1} Years`;

  let isExperienceMatch = true;
  let penalty = 0.0;
  let suitabilityFeedback = "";

  if (jdRequiredYears >= 3 && isCandidateFresher) {
    isExperienceMatch = false;
    penalty = 0.35;
    suitabilityFeedback = `Experience Gap: The Job Description requires ${totalExpRequired}, while the candidate is evaluated as a ${careerLevel}. ATS for this role prioritizes senior candidates.`;
  } else if (isJdFresher && isCandidateFresher) {
    isExperienceMatch = true;
    suitabilityFeedback = `Excellent Alignment: The candidate is a ${careerLevel}, perfectly meeting the JD requirement for ${totalExpRequired}.`;
  } else if (!isCandidateFresher && detectedCandidateYears >= jdRequiredYears) {
    isExperienceMatch = true;
    suitabilityFeedback = `Strong Alignment: Candidate experience (${totalExpFound}) meets or exceeds the target role requirements (${totalExpRequired}).`;
  } else {
    isExperienceMatch = true;
    suitabilityFeedback = `Good Alignment: Candidate profile (${totalExpFound}) is suitable for the ${totalExpRequired} position.`;
  }

  // 4. Calculate Exact JD Match % and Shortlisting Chance
  const totalJdSkillsCount = targetSkills.length;
  const matchedCount = matchedSkills.length;
  const jdMatchPercentage = totalJdSkillsCount > 0 ? Math.round((matchedCount / totalJdSkillsCount) * 100) : 50;

  // Shortlisting probability merges JD keyword match rate and experience compatibility
  const calculatedProb = Math.round(jdMatchPercentage * (1 - penalty));
  const shortlistProbability = Math.min(Math.max(calculatedProb, 15), 98);
  const shortlistChance = shortlistProbability >= 70 ? "High" : shortlistProbability >= 45 ? "Moderate" : "Low";
  const atsScore = jdMatchPercentage;

  // 5. Dynamic Tailored Recommendations
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
    `Align Resume Terminology: Ensure key terms like [${(matchedSkills.concat(missingSkills)).slice(0, 4).join(", ")}] appear in bold under your Skills and Experience sections.`
  );

  return {
    atsScore,
    jdMatchPercentage,
    totalJdSkillsCount,
    matchedCount,
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
  const [resumeTextInput, setResumeTextInput] = useState('')
  const [inputMode, setInputMode] = useState('pdf') // 'pdf' or 'text'
  const [jobDescription, setJobDescription] = useState('')
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState(null)
  const [activeTab, setActiveTab] = useState('experience')

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
    if (inputMode === 'pdf' && !file) {
      alert("Please upload a resume (PDF) first or switch to Paste Text mode.");
      return;
    }
    if (inputMode === 'text' && !resumeTextInput.trim()) {
      alert("Please paste your resume text first.");
      return;
    }
    if (!jobDescription.trim()) {
      alert("Please paste a Job Description.");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      let finalResumeText = '';
      if (inputMode === 'pdf' && file) {
        finalResumeText = await extractTextFromPDF(file);
      } else {
        finalResumeText = resumeTextInput;
      }

      // Universal Dynamic Resume vs JD Analysis
      const dynamicResult = analyzeJobAndResume(finalResumeText, jobDescription);
      
      await new Promise(resolve => setTimeout(resolve, 600));
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
                    setAnalysisResult(null)
                  }}
                >
                  ✕
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="jd-section">
            <label htmlFor="resumeText">Paste Candidate Resume Content:</label>
            <textarea
              id="resumeText"
              rows="6"
              placeholder="Paste candidate resume content, skills, work experience, and projects here..."
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
            placeholder="Paste target job requirements, skills, and experience criteria here..."
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
          {isAnalyzing ? 'Analyzing Experience & ATS Fit...' : 'Analyze Resume'}
        </button>

        {analysisResult && (
          <div className="dashboard-container glass-panel">
            
            {/* Top Match Rate & Shortlist Banner */}
            <div className="jd-match-summary-card glass-panel">
              <div className="summary-col">
                <span className="summary-badge">🎯 Job Description Match</span>
                <div className="summary-metric">
                  <span className="summary-big-num">{analysisResult.jdMatchPercentage}%</span>
                  <span className="summary-subtext">
                    {analysisResult.matchedCount} of {analysisResult.totalJdSkillsCount} Required Skills Found in Resume
                  </span>
                </div>
                <div className="meter-bar" style={{ marginTop: '0.6rem' }}>
                  <div
                    className="meter-fill"
                    style={{ width: `${analysisResult.jdMatchPercentage}%`, backgroundColor: '#00f0ff' }}
                  ></div>
                </div>
              </div>

              <div className="summary-col">
                <span className="summary-badge">📈 Chance of Getting Shortlisted</span>
                <div className="summary-metric">
                  <span className={`pill ${analysisResult.shortlistChance?.toLowerCase()} large`}>
                    {analysisResult.shortlistChance} ({analysisResult.shortlistProbability}%)
                  </span>
                  <span className="summary-subtext">
                    {analysisResult.shortlistChance === 'High' 
                      ? 'High probability of clearing ATS screening & receiving interview call' 
                      : analysisResult.shortlistChance === 'Moderate'
                      ? 'Moderate probability — add missing keywords to increase chances'
                      : 'Low probability — critical skill gaps or experience mismatch'}
                  </span>
                </div>
                <div className="meter-bar" style={{ marginTop: '0.6rem' }}>
                  <div
                    className="meter-fill"
                    style={{ 
                      width: `${analysisResult.shortlistProbability}%`,
                      backgroundColor: analysisResult.shortlistChance === 'High' ? '#4ade80' : analysisResult.shortlistChance === 'Moderate' ? '#facc15' : '#f87171'
                    }}
                  ></div>
                </div>
              </div>
            </div>

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
                <span className="stat-label">JD Match Score</span>
                <span className="stat-value text-accent">{analysisResult.jdMatchPercentage}%</span>
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
