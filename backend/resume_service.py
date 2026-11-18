import json
from database import get_db
from nlp_engine import extract_skills, calculate_match_score, generate_suggestions


def analyze_and_save_resume(data):
    """
    Orchestrates skill extraction, TF-IDF cosine similarity,
    scoring, suggestion generation, and MySQL persistence.
    Returns: (success: bool, payload: dict or str)
    """
    candidate_name = data["candidate_name"].strip()
    job_title = data["job_title"].strip()
    resume_text = data["resume_text"].strip()
    job_description = data["job_description"].strip()

    # 1. NLP Skill Extraction
    candidate_skills = extract_skills(resume_text)
    jd_skills = extract_skills(job_description)

    # 2. Compare candidate skills vs JD requirements
    matched_skills = sorted(list(set(candidate_skills).intersection(set(jd_skills))))
    missing_skills = sorted(list(set(jd_skills) - set(candidate_skills)))

    # 3. TF-IDF & Cosine Similarity Match Score
    match_score, cosine_sim = calculate_match_score(resume_text, job_description)

    # 4. Generate targeted suggestions
    suggestions = generate_suggestions(missing_skills, match_score)

    # 5. Save to MySQL database
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()
        
        insert_query = """
            INSERT INTO resume_reports 
            (candidate_name, job_title, match_score, matched_skills, missing_skills, suggestions, resume_text, job_description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
        """
        
        cursor.execute(insert_query, (
            candidate_name,
            job_title,
            match_score,
            json.dumps(matched_skills),
            json.dumps(missing_skills),
            json.dumps(suggestions),
            resume_text,
            job_description
        ))
        
        conn.commit()
        inserted_id = cursor.lastrowid
        cursor.close()

        result_payload = {
            "id": inserted_id,
            "candidate_name": candidate_name,
            "job_title": job_title,
            "match_score": match_score,
            "cosine_similarity": cosine_sim,
            "matched_skills": matched_skills,
            "missing_skills": missing_skills,
            "suggestions": suggestions,
            "message": "Resume analyzed and report saved successfully"
        }
        return True, result_payload

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"Database error in analyze_and_save_resume: {e}")
        return False, f"Database error: {str(e)}"
    finally:
        if conn:
            conn.close()
