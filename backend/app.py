from flask import Flask, request, jsonify
from flask_cors import CORS
from database import get_db
from validation import validate_resume_input
from resume_service import analyze_and_save_resume
import json

app = Flask(__name__)
# Enable Cross-Origin Resource Sharing so our React.js frontend can communicate with Flask
CORS(app)


@app.route("/")
def home():
    return "AI Resume Analyzer Flask API Is Running"


# 1. GET all resume analysis reports
@app.route("/reports", methods=["GET"])
def get_reports():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, candidate_name, job_title, match_score, 
                   matched_skills, missing_skills, suggestions, created_at
            FROM resume_reports
            ORDER BY created_at DESC
        """)
        reports = cursor.fetchall()
        cursor.close()

        # Parse JSON stored fields for clean JSON response
        for item in reports:
            if isinstance(item.get("matched_skills"), str):
                item["matched_skills"] = json.loads(item["matched_skills"])
            if isinstance(item.get("missing_skills"), str):
                item["missing_skills"] = json.loads(item["missing_skills"])
            if isinstance(item.get("suggestions"), str):
                item["suggestions"] = json.loads(item["suggestions"])

        return jsonify(reports), 200
    except Exception as e:
        print(e)
        return jsonify({"error": "Unable to fetch reports"}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()


# 2. GET report by ID
@app.route("/reports/<int:id>", methods=["GET"])
def get_report(id):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM resume_reports WHERE id = %s", (id,))
        report = cursor.fetchone()
        cursor.close()

        if report:
            if isinstance(report.get("matched_skills"), str):
                report["matched_skills"] = json.loads(report["matched_skills"])
            if isinstance(report.get("missing_skills"), str):
                report["missing_skills"] = json.loads(report["missing_skills"])
            if isinstance(report.get("suggestions"), str):
                report["suggestions"] = json.loads(report["suggestions"])
            return jsonify(report), 200

        return jsonify({"message": "Report not found"}), 404
    except Exception as e:
        print(e)
        return jsonify({"error": "Unable to fetch report"}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()


# 3. GET reports by job title (search/filter)
@app.route("/reports/job/<string:job_title>", methods=["GET"])
def get_reports_by_job(job_title):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM resume_reports WHERE job_title LIKE %s ORDER BY created_at DESC", (f"%{job_title}%",))
        reports = cursor.fetchall()
        cursor.close()

        if reports:
            for item in reports:
                if isinstance(item.get("matched_skills"), str):
                    item["matched_skills"] = json.loads(item["matched_skills"])
                if isinstance(item.get("missing_skills"), str):
                    item["missing_skills"] = json.loads(item["missing_skills"])
                if isinstance(item.get("suggestions"), str):
                    item["suggestions"] = json.loads(item["suggestions"])
            return jsonify(reports), 200

        return jsonify({"message": "No reports found for this job title"}), 404
    except Exception as e:
        print(e)
        return jsonify({"error": "Unable to fetch reports"}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()


# 4. POST analyze resume and create report
@app.route("/analyze", methods=["POST"])
def analyze_resume():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Valid JSON required"}), 400

    error = validate_resume_input(data)
    if error:
        return jsonify({"error": error}), 400

    try:
        success, result = analyze_and_save_resume(data)
        if success:
            return jsonify(result), 201
        return jsonify({"error": result}), 409
    except Exception as e:
        print(e)
        return jsonify({"error": "Unable to analyze resume"}), 500


# 5. DELETE report by ID
@app.route("/reports/<int:id>", methods=["DELETE"])
def delete_report(id):
    try:
        conn = get_db()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM resume_reports WHERE id = %s", (id,))
        if cursor.rowcount == 0:
            cursor.close()
            return jsonify({"message": "Report not found"}), 404

        conn.commit()
        cursor.close()
        return jsonify({"message": "Report deleted successfully"}), 200
    except Exception as e:
        if 'conn' in locals():
            conn.rollback()
        print(e)
        return jsonify({"error": "Unable to delete report"}), 500
    finally:
        if 'conn' in locals() and conn.is_connected():
            conn.close()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
