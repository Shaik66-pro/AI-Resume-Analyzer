import re
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Common technology, software, and data science skills dictionary for extraction
SKILL_BANK = [
    "python", "flask", "django", "fastapi", "react", "react.js", "javascript",
    "typescript", "node.js", "express", "html", "css", "sql", "mysql",
    "postgresql", "mongodb", "aws", "docker", "kubernetes", "git", "github",
    "rest api", "nlp", "machine learning", "deep learning", "tf-idf",
    "cosine similarity", "scikit-learn", "pandas", "numpy", "tensorflow",
    "pytorch", "ci/cd", "linux", "agile", "data analysis", "c++", "java",
    "c#", ".net", "graphql", "redis", "azure", "gcp", "tableau", "power bi"
]


def clean_text(text):
    """
    Cleans raw text by converting to lowercase and removing non-alphanumeric characters,
    while preserving meaningful spacing.
    """
    if not text:
        return ""
    text = text.lower()
    # Replace newlines and tabs with spaces
    text = re.sub(r"[\r\n\t]+", " ", text)
    # Remove special punctuation but keep spaces and common word separators
    text = re.sub(r"[^a-zA-Z0-9\s\+\#\.]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def extract_skills(text):
    """
    Extracts recognizable tech skills from text using boundary-aware regex matching
    against the predefined skill bank.
    """
    text_lower = text.lower()
    found_skills = set()

    for skill in SKILL_BANK:
        # Create pattern with word boundary to avoid partial substring false positives
        # E.g. 'c' shouldn't match in 'react'
        escaped_skill = re.escape(skill)
        pattern = r"(?<![a-zA-Z0-9])" + escaped_skill + r"(?![a-zA-Z0-9])"
        if re.search(pattern, text_lower):
            found_skills.add(skill)

    return sorted(list(found_skills))


def calculate_match_score(resume_text, job_description):
    """
    Calculates ATS score using TF-IDF and Cosine Similarity combined with Skill Overlap.
    Returns:
        score (float): 0.0 to 100.0 percentage score
        cosine_sim (float): Raw cosine similarity
    """
    cleaned_resume = clean_text(resume_text)
    cleaned_jd = clean_text(job_description)

    # 1. TF-IDF & Cosine Similarity
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform([cleaned_resume, cleaned_jd])
    
    # Cosine similarity between resume (row 0) and JD (row 1)
    cos_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]

    # 2. Skill Overlap Ratio
    resume_skills = set(extract_skills(cleaned_resume))
    jd_skills = set(extract_skills(cleaned_jd))

    if jd_skills:
        skill_match_ratio = len(resume_skills.intersection(jd_skills)) / len(jd_skills)
    else:
        skill_match_ratio = cos_sim

    # Composite ATS Score: 50% TF-IDF Cosine Similarity + 50% Skill Keyword Match
    combined_score = (cos_sim * 0.50 + skill_match_ratio * 0.50) * 100
    final_score = round(min(max(combined_score, 0.0), 100.0), 2)

    return final_score, round(float(cos_sim), 4)


def generate_suggestions(missing_skills, match_score):
    """
    Generates actionable resume enhancement recommendations.
    """
    suggestions = []

    if match_score >= 80:
        suggestions.append("Outstanding match! Your profile aligns strongly with this job description.")
    elif match_score >= 50:
        suggestions.append("Moderate match. Adding relevant missing keywords will significantly boost your ranking.")
    else:
        suggestions.append("Low match. Your resume needs closer alignment with the primary requirements of this job.")

    if missing_skills:
        top_missing = ", ".join(missing_skills[:5])
        suggestions.append(f"Consider integrating high-priority required skills: {top_missing}.")
        suggestions.append("Provide concrete project bullet points demonstrating hands-on experience with these missing tools.")

    suggestions.append("Ensure your work experience highlights measurable metrics (e.g., 'improved latency by 30%').")
    suggestions.append("Use standard headings (Experience, Skills, Projects, Education) so ATS scanners parse your layout cleanly.")

    return suggestions
