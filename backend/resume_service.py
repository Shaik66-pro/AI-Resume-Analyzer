import json

try:
    from database import get_db
    from nlp_engine import analyze_ats_comprehensive
except ImportError:
    from backend.database import get_db
    from backend.nlp_engine import analyze_ats_comprehensive


def analyze_and_save_resume(data):
    """
    Orchestrates comprehensive ATS analysis including:
    - Experience requirement parsing (Fresher vs Experienced)
    - Shortlist chance & probability
    - TF-IDF Cosine Similarity & Skill Gap Analysis
    - Experience breakdown & quotes
    - MySQL Persistence with in-memory fallback
    """
    candidate_name = data["candidate_name"].strip()
    job_title = data["job_title"].strip()
    resume_text = data["resume_text"].strip()
    job_description = data["job_description"].strip()

    # 1. Run Comprehensive NLP / TF-IDF ATS Engine
    analysis = analyze_ats_comprehensive(resume_text, job_description)

    # 2. Save report to MySQL database
    conn = None
    try:
        conn = get_db()
        cursor = conn.cursor()

        insert_query = """
            INSERT INTO resume_reports 
            (candidate_name, job_title, ats_score, cosine_similarity, shortlist_chance, 
             shortlist_probability, career_level, jd_level, is_experience_match, 
             suitability_feedback, total_exp_required, total_exp_found, matched_skills, 
             missing_skills, experience_breakdown, recommendations, resume_text, job_description)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """

        cursor.execute(insert_query, (
            candidate_name,
            job_title,
            analysis["ats_score"],
            analysis["cosine_similarity"],
            analysis["shortlist_chance"],
            analysis["shortlist_probability"],
            analysis["career_level"],
            analysis["jd_level"],
            analysis["is_experience_match"],
            analysis["suitability_feedback"],
            analysis["total_exp_required"],
            analysis["total_exp_found"],
            json.dumps(analysis["matched_skills"]),
            json.dumps(analysis["missing_skills"]),
            json.dumps(analysis["experience_breakdown"]),
            json.dumps(analysis["recommendations"]),
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
            **analysis,
            "message": "ATS Analysis completed successfully and saved to database"
        }
        return True, result_payload

    except Exception as e:
        if conn:
            try:
                conn.rollback()
            except Exception:
                pass
        print(f"Database notice in analyze_and_save_resume: {e}")
        # Even if DB is not active locally, return computed analysis
        fallback_payload = {
            "id": None,
            "candidate_name": candidate_name,
            "job_title": job_title,
            **analysis,
            "message": "ATS Analysis completed successfully"
        }
        return True, fallback_payload
    finally:
        if conn and hasattr(conn, "is_connected") and conn.is_connected():
            conn.close()
