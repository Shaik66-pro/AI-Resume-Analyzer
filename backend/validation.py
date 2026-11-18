def validate_resume_input(data):
    """
    Validates the input payload for resume analysis.
    Returns an error message string if invalid, or None if valid.
    """
    if not isinstance(data, dict):
        return "Payload must be a valid JSON object."

    candidate_name = data.get("candidate_name", "").strip()
    job_title = data.get("job_title", "").strip()
    resume_text = data.get("resume_text", "").strip()
    job_description = data.get("job_description", "").strip()

    if not candidate_name:
        return "Candidate name is required."
    
    if not job_title:
        return "Job title is required."

    if not resume_text:
        return "Resume text is required."

    if len(resume_text) < 30:
        return "Resume text is too short. Please provide meaningful resume content."

    if not job_description:
        return "Job description is required."

    if len(job_description) < 30:
        return "Job description is too short. Please provide meaningful job requirements."

    return None
