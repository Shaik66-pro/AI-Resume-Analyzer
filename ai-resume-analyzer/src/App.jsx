import { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import * as pdfjsLib from 'pdfjs-dist'
import './App.css'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

// Common English words to ignore when extracting custom technical terms from JDs
const IGNORE_WORDS = new Set([
  "a", "about", "above", "across", "after", "again", "against", "all", "almost", "alone", "along", "already",
  "also", "although", "always", "among", "an", "and", "another", "any", "anybody", "anyone", "anything",
  "anywhere", "are", "area", "areas", "around", "as", "ask", "asked", "asking", "asks", "at", "away", "b",
  "back", "backed", "backing", "backs", "be", "became", "because", "become", "becomes", "been", "before",
  "began", "behind", "being", "beings", "best", "better", "between", "big", "both", "but", "by", "c",
  "came", "can", "cannot", "case", "cases", "certain", "certainly", "clear", "clearly", "come", "could",
  "did", "differ", "different", "differently", "do", "does", "done", "down", "downed", "downing", "downs",
  "during", "each", "early", "either", "end", "ended", "ending", "ends", "enough", "even", "evenly", "ever",
  "every", "everybody", "everyone", "everything", "everywhere", "face", "faces", "fact", "facts", "far",
  "felt", "few", "fewer", "find", "finds", "first", "for", "four", "from", "full", "fully", "further",
  "furthered", "furthering", "furthers", "gave", "general", "generally", "get", "gets", "give", "given",
  "gives", "go", "going", "good", "goods", "got", "great", "greater", "greatest", "group", "grouped",
  "grouping", "groups", "had", "has", "have", "having", "he", "her", "here", "herself", "high", "higher",
  "highest", "him", "himself", "his", "how", "however", "if", "important", "important", "in", "interest",
  "interested", "interesting", "interests", "into", "is", "it", "its", "itself", "just", "keep", "keeps",
  "knew", "know", "known", "knows", "large", "largely", "last", "later", "latest", "least", "less", "let",
  "lets", "like", "likely", "made", "make", "makes", "many", "may", "me", "member", "members", "men",
  "might", "more", "most", "mostly", "mr", "mrs", "much", "must", "my", "myself", "name", "named", "names",
  "near", "needed", "needing", "needs", "never", "new", "newer", "newest", "next", "no", "nobody", "non",
  "noone", "not", "nothing", "now", "nowhere", "number", "numbers", "of", "off", "often", "old", "older",
  "oldest", "on", "once", "one", "only", "open", "opened", "opening", "opens", "or", "order", "ordered",
  "ordering", "orders", "other", "others", "our", "out", "over", "part", "parted", "parting", "parts",
  "per", "place", "places", "point", "pointed", "pointing", "points", "possible", "present", "presented",
  "presenting", "presents", "problem", "problems", "put", "puts", "quite", "rather", "really", "right",
  "room", "rooms", "said", "same", "saw", "say", "saying", "says", "second", "seconds", "see", "seem",
  "seemed", "seeming", "seems", "sees", "several", "shall", "she", "should", "show", "showed", "showing",
  "shows", "side", "sides", "since", "small", "smaller", "smallest", "so", "some", "somebody", "someone",
  "something", "somewhere", "state", "states", "still", "such", "sure", "take", "taken", "than", "that",
  "the", "their", "them", "then", "there", "therefore", "these", "they", "thing", "things", "think",
  "thinks", "this", "those", "though", "thought", "thoughts", "three", "through", "thus", "to", "today",
  "together", "too", "took", "toward", "turn", "turned", "turning", "turns", "two", "under", "until", "up",
  "upon", "us", "use", "used", "uses", "very", "want", "wanted", "wanting", "wants", "was", "way", "ways",
  "we", "well", "wells", "went", "were", "what", "when", "where", "whether", "which", "while", "who",
  "whole", "whose", "why", "will", "with", "within", "without", "work", "worked", "working", "works",
  "would", "year", "years", "yet", "you", "young", "younger", "youngest", "your", "yours",
  "team", "consultants", "equipped", "knowledge", "expertise", "deliver", "solutions", "drive",
  "broadening", "diverse", "range", "industries", "unique", "challenges", "address", "sector", "faces"
]);

// Curated technical and domain terms dictionary
const MASTER_TECH_TERMS = [
  // Integration & Cloud
  "mulesoft", "workato", "ipaas", "digital transformation", "data flow", "api integration", "dell boomi",
  "zapier", "informatica", "kafka", "rabbitmq", "talend", "microservices", "soa",
  // AI & Data
  "prompt engineering", "data analytics", "data analysis", "analytical skills", "sql", "mysql", "postgresql",
  "mongodb", "python", "machine learning", "deep learning", "nlp", "llm", "generative ai", "tableau",
  "power bi", "pandas", "numpy", "scikit-learn", "tensorflow", "pytorch", "etl", "data pipeline", "snowflake", "bigquery",
  // Full Stack & Web
  "react", "react.js", "javascript", "typescript", "node.js", "express", "html", "html5", "css", "css3",
  "flask", "django", "fastapi", "spring boot", "java", "c++", "c#", ".net", "php", "angular", "vue.js", "next.js",
  "rest api", "graphql", "redux", "tailwind css", "bootstrap",
  // Cloud & DevOps
  "aws", "azure", "gcp", "docker", "kubernetes", "ci/cd", "git", "github", "gitlab", "linux", "terraform",
  // Testing & Quality
  "selenium", "manual testing", "automation testing", "postman", "unit testing", "jira", "agile", "scrum"
];

// Extract technical skills dynamically from ANY Job Description
function extractDynamicJdSkills(jdText) {
  const jdLower = (jdText || "").toLowerCase();
  const foundSkills = new Set();

  // 1. Check master tech terms
  MASTER_TECH_TERMS.forEach(term => {
    const escaped = term.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const pattern = new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i');
    if (pattern.test(jdLower)) {
      foundSkills.add(term);
    }
  });

  // 2. Parse explicit Skill/Requirement lines: e.g. "Skills: Data Analytics, SQL, Prompt Engineering"
  const skillLines = jdText.match(/(?:skills|requirements|technologies|tools|knowledge in|experience in)[\s:]+([^\n\r]+)/gi);
  if (skillLines) {
    skillLines.forEach(line => {
      const cleaned = line.replace(/^(?:skills|requirements|technologies|tools|knowledge in|experience in)[\s:]+/i, '');
      const parts = cleaned.split(/[,;•\-\*\/]/);
      parts.forEach(p => {
        let clean = p.trim().toLowerCase();
        // Remove prefixes like "good", "basic", "knowledge of", "experience with"
        clean = clean.replace(/^(?:good|basic|strong|hands[- ]on|knowledge of|experience with|proficiency in)\s+/i, '').trim();
        if (clean.length >= 2 && clean.length <= 35 && !IGNORE_WORDS.has(clean)) {
          foundSkills.add(clean);
        }
      });
    });
  }

  // 3. Extract prominent capitalized multi-word phrases (e.g. "MuleSoft", "Workato", "Digital Transformation")
  const capitalizedTerms = jdText.match(/\b[A-Z][a-zA-Z0-9\+\#\.]+(?:\s+[A-Z][a-zA-Z0-9\+\#\.]+)*\b/g);
  if (capitalizedTerms) {
    capitalizedTerms.forEach(term => {
      const tLower = term.trim().toLowerCase();
      if (tLower.length >= 3 && !IGNORE_WORDS.has(tLower)) {
        if (MASTER_TECH_TERMS.some(m => m === tLower || tLower.includes(m))) {
          foundSkills.add(tLower);
        } else if (term.length >= 4 && !/^(Company|Job|Location|Salary|Experience|Candidate|Eligible|Opening|Position|Notice|Rounds|First|Second|Third|Date|Time|Mode|Round|Total|Batch|Stream|Degree|Bengaluru|Bangalore|Hyderabad|India)$/i.test(term)) {
          foundSkills.add(tLower);
        }
      }
    });
  }

  // Filter out any single letters or noise words
  const validSkills = Array.from(foundSkills).filter(s => s.length >= 2 && !IGNORE_WORDS.has(s));
  return validSkills.slice(0, 10);
}

// Check if skill exists in resume with alias matching
function checkSkillInResume(skill, resumeLower) {
  const s = skill.toLowerCase();
  
  // Specific alias checks
  if (s === "sql") {
    return /(?<![a-zA-Z0-9])(sql|mysql|postgresql|sqlite|pl\/sql)(?![a-zA-Z0-9])/i.test(resumeLower);
  }
  if (s === "python") {
    return /(?<![a-zA-Z0-9])python(?![a-zA-Z0-9])/i.test(resumeLower);
  }
  if (s === "react" || s === "react.js") {
    return /(?<![a-zA-Z0-9])(react|react\.js|reactjs)(?![a-zA-Z0-9])/i.test(resumeLower);
  }
  if (s === "prompt engineering") {
    return /(?<![a-zA-Z0-9])(prompt engineering|prompt design|llm prompts|prompts)(?![a-zA-Z0-9])/i.test(resumeLower);
  }
  if (s === "data analytics" || s === "data analysis") {
    return /(?<![a-zA-Z0-9])(data analytics|data analysis|analytical skills|data analyst)(?![a-zA-Z0-9])/i.test(resumeLower);
  }

  const escaped = s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  return new RegExp(`(?<![a-zA-Z0-9])${escaped}(?![a-zA-Z0-9])`, 'i').test(resumeLower);
}

// Find actual evidence sentence in candidate resume
function extractProofSentence(skill, resumeSentences) {
  const s = skill.toLowerCase();
  for (const sentence of resumeSentences) {
    if (checkSkillInResume(s, sentence.toLowerCase())) {
      return sentence.trim();
    }
  }
  return `Documented practical application of ${skill.toUpperCase()} identified in candidate profile.`;
}

// Accurately parse Candidate Experience from Resume (Fixing College Degree Date false positives)
function parseCandidateExperience(resumeText) {
  const rLower = (resumeText || "").toLowerCase();

  // 1. Explicit Fresher Signals (HIGHEST PRIORITY)
  const isExplicitFresher = /(?:fresher|entry[- ]level|0 years|zero years|batch of 2025|batch of 2026|graduate in 2025|graduate in 2026|seeking entry[- ]level)/i.test(rLower);

  // 2. Parse Explicit Work Experience (e.g. "Work Experience: 3 Years", "3+ years of professional experience")
  const workExpMatch = rLower.match(/(?:work experience|professional experience|relevant experience)[\s:]*(\d{1,2})\s*\+?\s*(?:years|year|yrs|yr)/i) ||
                       rLower.match(/(\d{1,2})\s*\+?\s*(?:years|year|yrs|yr)\s*(?:of)?\s*(?:work|industry|professional)?\s*experience/i);

  let verifiedYears = 0;
  if (workExpMatch) {
    const matchedVal = parseInt(workExpMatch[1], 10);
    // Ignore absurd values or college year durations if fresher is explicitly stated
    if (matchedVal > 0 && matchedVal <= 25 && !isExplicitFresher) {
      verifiedYears = matchedVal;
    }
  }

  // 3. Fallback check for Job Roles (Software Engineer at X Company from 2021 to 2024)
  // Ensure we DO NOT count B.Tech / College / University education dates as work experience!
  if (verifiedYears === 0 && !isExplicitFresher) {
    const employmentSection = resumeText.match(/(?:experience|employment|work history|professional background)([\s\S]{50,600})/i);
    if (employmentSection) {
      const sectionText = employmentSection[1].toLowerCase();
      // Only check date range if it doesn't mention college, degree, or university
      if (!/college|university|institute|b\.?tech|b\.?e|school|education|ssc|intermediate/i.test(sectionText)) {
        const dateMatch = sectionText.match(/(201\d|202\d)\s*[-–to]\s*(202\d|present|current)/i);
        if (dateMatch) {
          const start = parseInt(dateMatch[1], 10);
          const end = /present|current/i.test(dateMatch[2]) ? 2026 : parseInt(dateMatch[2], 10);
          const diff = end - start;
          if (diff > 0 && diff <= 20) {
            verifiedYears = diff;
          }
        }
      }
    }
  }

  if (verifiedYears >= 2 && !isExplicitFresher) {
    return {
      isFresher: false,
      years: verifiedYears,
      label: `${verifiedYears} Years`,
      tier: `${verifiedYears}+ Years Experienced Professional`
    };
  }

  // Default to Fresher
  return {
    isFresher: true,
    years: 0,
    label: "Fresher / Projects",
    tier: "Fresher / Entry-Level (0 Yrs)"
  };
}

// Parse Job Description Experience Requirement (ONLY if explicitly mentioned!)
function parseJdExperienceRequirement(jdText) {
  const jdLower = (jdText || "").toLowerCase();

  // 1. Check if JD explicitly asks for Fresher
  if (/(?:fresher|freshers|entry[- ]level|0 years|zero years|2025|2026|new grad|no experience required)/i.test(jdLower)) {
    return {
      hasRequirement: true,
      isFresherRequired: true,
      requiredYears: 0,
      label: "Fresher (0 Yrs)",
      tier: "Entry-Level / Fresher"
    };
  }

  // 2. Check if JD explicitly asks for so and so years: e.g. "1 year", "2 years", "3+ years", "5 years"
  const expMatch = jdLower.match(/(\d{1,2})\s*\+?\s*(?:to\s*(\d{1,2}))?\s*(?:years|year|yrs|yr)\s*(?:of)?\s*(?:exp|experience|relevant)/i) ||
                   jdLower.match(/(?:experience|exp)[\s:]*(\d{1,2})\s*\+?\s*(?:to\s*(\d{1,2}))?\s*(?:years|year|yrs|yr)/i);

  if (expMatch) {
    const years = parseInt(expMatch[1], 10);
    return {
      hasRequirement: true,
      isFresherRequired: false,
      requiredYears: years,
      label: `${years}+ Years`,
      tier: years >= 5 ? `Senior Level (${years}+ yrs)` : `Mid-Level (${years}+ yrs)`
    };
  }

  // 3. If JD DOES NOT mention experience at all:
  return {
    hasRequirement: false,
    isFresherRequired: false,
    requiredYears: null,
    label: "Not Specified in JD",
    tier: "Experience Not Specified"
  };
}

// Master Universal Analysis Function
function analyzeUniversalResumeAndJd(resumeText, jdText) {
  const rLower = (resumeText || "").toLowerCase();

  // 1. Parse JD Skills Dynamically
  const targetSkills = extractDynamicJdSkills(jdText);

  // 2. Break Resume into Sentences
  const resumeSentences = resumeText
    .split(/(?<=[.!?\n])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 8);

  const matchedSkills = [];
  const missingSkills = [];
  const experienceBreakdown = [];

  targetSkills.forEach(skill => {
    const isFound = checkSkillInResume(skill, rLower);
    if (isFound) {
      matchedSkills.push(skill);
      const proof = extractProofSentence(skill, resumeSentences);
      experienceBreakdown.push({
        skill: skill.toUpperCase(),
        required: "Required in JD",
        found: "Verified in Resume",
        status: "Met",
        extractedSentence: proof.slice(0, 160) + (proof.length > 160 ? "..." : "")
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

  // 3. Accurate Candidate Experience vs JD Requirement
  const candidateExp = parseCandidateExperience(resumeText);
  const jdExp = parseJdExperienceRequirement(jdText);

  let isExperienceMatch = true;
  let penalty = 0.0;
  let suitabilityFeedback = "";

  if (jdExp.hasRequirement) {
    if (jdExp.requiredYears >= 3 && candidateExp.isFresher) {
      isExperienceMatch = false;
      penalty = 0.35;
      suitabilityFeedback = `Experience Gap: The Job Description requires ${jdExp.label}, while candidate is evaluated as a ${candidateExp.tier}. ATS screening for this role prioritizes experienced candidates.`;
    } else if (jdExp.isFresherRequired && candidateExp.isFresher) {
      isExperienceMatch = true;
      suitabilityFeedback = `Perfect Experience Match: Both candidate and JD are aligned for Fresher / Entry-Level roles.`;
    } else if (!candidateExp.isFresher && candidateExp.years >= (jdExp.requiredYears || 0)) {
      isExperienceMatch = true;
      suitabilityFeedback = `Strong Alignment: Candidate experience (${candidateExp.label}) satisfies or exceeds role criteria (${jdExp.label}).`;
    } else {
      isExperienceMatch = true;
      suitabilityFeedback = `Role Compatibility: Candidate background aligns with the target role.`;
    }
  } else {
    // JD did not specify experience
    isExperienceMatch = true;
    suitabilityFeedback = `Role Alignment: JD does not mandate a minimum experience tenure. Candidate is evaluated based on matching technical skills.`;
  }

  // 4. Accurate JD Match Percentage & Shortlist Probability
  const totalChecked = targetSkills.length;
  const matchRatio = totalChecked > 0 ? (matchedSkills.length / totalChecked) : 0.5;
  const jdMatchPercentage = Math.round(matchRatio * 100);

  const calculatedProb = Math.round(jdMatchPercentage * (1 - penalty));
  const shortlistProbability = Math.min(Math.max(calculatedProb, 15), 98);
  const shortlistChance = shortlistProbability >= 70 ? "High" : shortlistProbability >= 45 ? "Moderate" : "Low";

  // 5. Tailored Actionable Recommendations
  const recommendations = [];
  if (missingSkills.length > 0) {
    recommendations.push(
      `Incorporate Target Skills: The JD requires [${missingSkills.slice(0, 4).join(", ")}]. Add concrete project bullet points demonstrating hands-on usage.`
    );
  }
  if (!isExperienceMatch) {
    recommendations.push(
      `Bridge the Experience Gap: Add production-grade GitHub links or live deployed demos to showcase practical competence beyond formal years of tenure.`
    );
  }
  recommendations.push(
    "Use Metric-Driven Results: Frame achievements with numbers (e.g. 'Optimized performance by 30%', 'Integrated 5+ core workflows')."
  );
  recommendations.push(
    `Align Resume Terminology: Ensure key terms like [${(matchedSkills.concat(missingSkills)).slice(0, 4).join(", ")}] appear in bold under your Skills and Experience sections.`
  );

  return {
    jdMatchPercentage,
    totalJdSkillsCount: totalChecked,
    matchedCount: matchedSkills.length,
    shortlistChance,
    shortlistProbability,
    careerLevel: candidateExp.tier,
    jdLevel: jdExp.tier,
    isExperienceMatch,
    suitabilityFeedback,
    totalExpRequired: jdExp.label,
    totalExpFound: candidateExp.label,
    hasJdExpRequirement: jdExp.hasRequirement,
    experienceBreakdown,
    matchedSkills,
    missingSkills,
    recommendations
  };
}

function App() {
  const [file, setFile] = useState(null)
  const [resumeTextInput, setResumeTextInput] = useState('')
  const [inputMode, setInputMode] = useState('pdf')
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
      const dynamicResult = analyzeUniversalResumeAndJd(finalResumeText, jobDescription);
      
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
