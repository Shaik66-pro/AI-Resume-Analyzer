import re
import math
from collections import Counter

# Try importing scikit-learn, with graceful native mathematical fallback
try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False

# Exhaustive Technical & Soft Skills Lexicon
SKILL_BANK = [
    "python", "flask", "django", "fastapi", "react", "react.js", "javascript",
    "typescript", "node.js", "express", "html", "html5", "css", "css3", "sql", "mysql",
    "postgresql", "mongodb", "aws", "docker", "kubernetes", "git", "github",
    "rest api", "restful api", "nlp", "machine learning", "deep learning", "tf-idf",
    "cosine similarity", "scikit-learn", "pandas", "numpy", "tensorflow",
    "pytorch", "ci/cd", "linux", "agile", "data analysis", "c++", "java",
    "c#", ".net", "graphql", "redis", "azure", "gcp", "tableau", "power bi",
    "microservices", "unit testing", "redux", "tailwind css", "next.js"
]

STOP_WORDS = {
    "a", "an", "the", "and", "or", "in", "on", "at", "to", "for", "with", "by", "from",
    "of", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
    "do", "does", "did", "we", "you", "they", "it", "our", "their", "as", "about"
}


def clean_text(text):
    """Cleans raw text while preserving whitespace and common programming symbols."""
    if not text:
        return ""
    text = text.lower()
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"[^a-zA-Z0-9\s\+\#\.]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def native_tfidf_cosine_similarity(text1, text2):
    """
    Zero-dependency mathematical implementation of TF-IDF and Cosine Similarity:
    Calculates TF * IDF vectors and computes dot(A, B) / (norm(A) * norm(B)).
    """
    def tokenize(t):
        return [w for w in re.findall(r"\b[a-zA-Z0-9\+\#\.]+\b", t.lower()) if w not in STOP_WORDS]

    words1 = tokenize(text1)
    words2 = tokenize(text2)

    if not words1 or not words2:
        return 0.0

    vocab = sorted(list(set(words1 + words2)))
    doc_count = 2

    # IDF calculation
    idf = {}
    for term in vocab:
        df = (1 if term in words1 else 0) + (1 if term in words2 else 0)
        idf[term] = math.log((doc_count + 1) / (df + 1)) + 1.0

    # TF-IDF vectors
    c1, c2 = Counter(words1), Counter(words2)
    len1, len2 = len(words1), len(words2)

    v1 = [ (c1[t] / len1) * idf[t] for t in vocab ]
    v2 = [ (c2[t] / len2) * idf[t] for t in vocab ]

    # Cosine Similarity: dot product / (norm1 * norm2)
    dot = sum(a * b for a, b in zip(v1, v2))
    norm1 = math.sqrt(sum(a * a for a in v1))
    norm2 = math.sqrt(sum(b * b for b in v2))

    if norm1 == 0 or norm2 == 0:
        return 0.0

    return min(max(dot / (norm1 * norm2), 0.0), 1.0)


def extract_skills(text):
    """Extracts technical skills using word-boundary regex patterns."""
    text_lower = text.lower()
    found_skills = set()

    for skill in SKILL_BANK:
        escaped = re.escape(skill)
        pattern = r"(?<![a-zA-Z0-9])" + escaped + r"(?![a-zA-Z0-9])"
        if re.search(pattern, text_lower):
            found_skills.add(skill)

    return sorted(list(found_skills))


def extract_experience_info(text, is_job_desc=False):
    """
    Extracts experience level, detected years, and career tier (Fresher vs Experienced).
    """
    text_lower = text.lower()

    # Fresher keywords
    fresher_patterns = [
        r"\bfresher\b", r"\bfreshers\b", r"\bentry[- ]level\b", r"\b0 years\b",
        r"\bzero years\b", r"\bcollege graduate\b", r"\bnew grad\b",
        r"\bundergraduate\b", r"\bstudent\b", r"\b0-1 years\b"
    ]
    is_fresher_explicit = any(re.search(pat, text_lower) for pat in fresher_patterns)

    # Years of experience extraction (e.g. '3+ years', '5 years of experience', '2 to 4 yrs')
    year_patterns = [
        r"(\d{1,2})\s*\+?\s*(?:to\s*(\d{1,2}))?\s*(?:years|year|yrs|yr)\s*(?:of\s*)?(?:experience|exp)?",
        r"experience\s*(?:of)?\s*(\d{1,2})\s*\+?\s*(?:to\s*(\d{1,2}))?\s*(?:years|year|yrs|yr)"
    ]

    detected_years = []
    for pat in year_patterns:
        matches = re.findall(pat, text_lower)
        for m in matches:
            if isinstance(m, tuple):
                for val in m:
                    if val and val.isdigit():
                        detected_years.append(int(val))
            elif isinstance(m, str) and m.isdigit():
                detected_years.append(int(m))

    max_years = max(detected_years) if detected_years else 0

    if is_job_desc:
        if is_fresher_explicit and max_years <= 1:
            level = "Entry-Level / Fresher (0-1 yrs)"
            req_label = "0-1 Years (Fresher)"
            numeric_req = 0
        elif max_years >= 5:
            level = f"Senior Level ({max_years}+ yrs)"
            req_label = f"{max_years}+ Years"
            numeric_req = max_years
        elif max_years >= 2:
            level = f"Mid-Level ({max_years}+ yrs)"
            req_label = f"{max_years}+ Years"
            numeric_req = max_years
        else:
            level = "Entry to Junior Level"
            req_label = "0-2 Years"
            numeric_req = 1
        return level, req_label, numeric_req

    else:
        # Candidate Resume Analysis
        if is_fresher_explicit or max_years == 0:
            level = "Fresher / Entry-Level"
            found_label = "0 Years / Fresher"
            numeric_found = 0
        elif max_years >= 5:
            level = f"Senior Professional ({max_years}+ yrs)"
            found_label = f"{max_years}+ Years"
            numeric_found = max_years
        elif max_years >= 2:
            level = f"Mid-Level ({max_years}+ yrs)"
            found_label = f"{max_years} Years"
            numeric_found = max_years
        else:
            level = "Junior (1-2 yrs)"
            found_label = f"{max_years} Year"
            numeric_found = max_years
        return level, found_label, numeric_found


def generate_experience_breakdown(resume_text, jd_text, matched_skills, missing_skills):
    """
    Creates a granular breakdown of JD requirements against resume findings with quotes/proof.
    """
    breakdown = []
    resume_sentences = re.split(r"[.\n;]+", resume_text)

    # 1. Break down top matched skills
    for skill in matched_skills[:4]:
        found_sentence = "Demonstrated in resume project/skills portfolio."
        for s in resume_sentences:
            if re.search(r"\b" + re.escape(skill) + r"\b", s, re.IGNORECASE):
                found_sentence = s.strip()
                break

        breakdown.append({
            "requirement": f"Proficiency in {skill.title()}",
            "required": "Required",
            "found": "Found in Resume",
            "status": "Met",
            "extracted_proof": found_sentence[:120] + ("..." if len(found_sentence) > 120 else "")
        })

    # 2. Break down missing skills
    for skill in missing_skills[:3]:
        breakdown.append({
            "requirement": f"Experience with {skill.title()}",
            "required": "Required",
            "found": "Not Mentioned",
            "status": "Missing",
            "extracted_proof": f"Candidate resume does not highlight hands-on work with {skill}."
        })

    return breakdown


def analyze_ats_comprehensive(resume_text, job_description):
    """
    Multi-dimensional ATS Engine:
    - Calculates TF-IDF and Cosine Similarity
    - Identifies Fresher vs Experienced candidate & JD expectations
    - Assesses Experience Match vs Mismatch
    - Computes Shortlist Probability percentage and qualitative status (High/Moderate/Low)
    - Generates detailed feedback and improvement recommendations
    """
    cleaned_resume = clean_text(resume_text)
    cleaned_jd = clean_text(job_description)

    # 1. TF-IDF & Cosine Similarity
    if SKLEARN_AVAILABLE:
        vectorizer = TfidfVectorizer(stop_words="english")
        tfidf_matrix = vectorizer.fit_transform([cleaned_resume, cleaned_jd])
        cos_sim = float(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0])
    else:
        cos_sim = float(native_tfidf_cosine_similarity(cleaned_resume, cleaned_jd))

    # 2. Skill Extraction
    candidate_skills = extract_skills(cleaned_resume)
    jd_skills = extract_skills(cleaned_jd)

    matched_skills = sorted(list(set(candidate_skills).intersection(set(jd_skills))))
    missing_skills = sorted(list(set(jd_skills) - set(candidate_skills)))

    skill_overlap_ratio = len(matched_skills) / len(jd_skills) if jd_skills else cos_sim

    # 3. Experience Level Detection
    cand_level, exp_found_str, cand_years = extract_experience_info(cleaned_resume, is_job_desc=False)
    jd_level, exp_req_str, req_years = extract_experience_info(cleaned_jd, is_job_desc=True)

    # 4. Experience Match Assessment
    is_exp_match = True
    penalty = 0.0

    if req_years >= 3 and cand_years == 0:
        # Fresher applying for Senior/Mid-level
        is_exp_match = False
        penalty = 0.35  # Severe penalty for major experience mismatch
        suitability_feedback = (
            f"Experience Gap Detected: The Job Description requires {exp_req_str}, "
            f"whereas the candidate profile reflects {exp_found_str}. "
            "ATS screening for this senior role typically prioritizes seasoned candidates."
        )
    elif req_years >= 2 and cand_years == 0:
        is_exp_match = False
        penalty = 0.20
        suitability_feedback = (
            f"Moderate Experience Gap: The role seeks {exp_req_str}, but the candidate is evaluated as a Fresher. "
            "Highlighting production-level internships and personal projects can bridge this gap."
        )
    elif cand_years >= req_years:
        is_exp_match = True
        suitability_feedback = (
            f"Strong Experience Alignment: Candidate qualifications ({exp_found_str}) meet or exceed "
            f"the role requirements ({exp_req_str})."
        )
    else:
        is_exp_match = True
        suitability_feedback = (
            f"Good Alignment: The candidate profile ({exp_found_str}) is suitable for this {jd_level} position."
        )

    # 5. Composite ATS Match Score (0 - 100)
    base_score = (cos_sim * 0.40 + skill_overlap_ratio * 0.60) * 100
    final_score = round(min(max(base_score, 5.0), 100.0), 1)

    # 6. Shortlisting Probability
    shortlist_calc = (final_score * (1.0 - penalty))
    shortlist_prob = round(min(max(shortlist_calc, 5.0), 98.0), 1)

    if shortlist_prob >= 75:
        shortlist_chance = "High"
    elif shortlist_prob >= 50:
        shortlist_chance = "Moderate"
    else:
        shortlist_chance = "Low"

    # 7. Experience Breakdown Items
    experience_breakdown = generate_experience_breakdown(
        resume_text, job_description, matched_skills, missing_skills
    )

    # 8. Actionable Targeted Recommendations
    recommendations = []
    if not is_exp_match:
        recommendations.append(
            f"Address Experience Requirements: The JD expects {exp_req_str}. "
            "Add verifiable project deliverables, open-source contributions, or freelance experience to simulate industry tenure."
        )
    if missing_skills:
        top_missing = ", ".join(missing_skills[:4])
        recommendations.append(f"Incorporate Critical Missing Keywords: Add hands-on sections for {top_missing}.")

    recommendations.append(
        "Quantify Achievements: Use metrics (e.g. 'Reduced latency by 35%', 'Engineered 12 REST endpoints') to pass automated ATS filters."
    )
    recommendations.append(
        "Standardize Section Headers: Use recognizable ATS headings ('Professional Experience', 'Technical Skills', 'Projects', 'Education')."
    )

    return {
        "ats_score": final_score,
        "cosine_similarity": round(cos_sim, 4),
        "shortlist_chance": shortlist_chance,
        "shortlist_probability": shortlist_prob,
        "career_level": cand_level,
        "jd_level": jd_level,
        "is_experience_match": is_exp_match,
        "suitability_feedback": suitability_feedback,
        "total_exp_required": exp_req_str,
        "total_exp_found": exp_found_str,
        "matched_skills": matched_skills,
        "missing_skills": missing_skills,
        "experience_breakdown": experience_breakdown,
        "recommendations": recommendations
    }
