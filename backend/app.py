from flask import Flask, request, jsonify
import json

try:
    from database import get_db
    from validation import validate_resume_input
    from resume_service import analyze_and_save_resume
except ImportError:
    from backend.database import get_db
    from backend.validation import validate_resume_input
    from backend.resume_service import analyze_and_save_resume

app = Flask(__name__)

# Native Zero-Dependency CORS support with flask-cors fallback
try:
    from flask_cors import CORS
    CORS(app)
except ImportError:
    @app.after_request
    def apply_cors(response):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type,Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET,POST,PUT,DELETE,OPTIONS"
        return response


@app.route("/")
def home():
    return "AI Resume Analyzer & ATS Screening API is running"


# 1. GET all resume analysis reports
@app.route("/reports", methods=["GET"])
def get_reports():
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, candidate_name, job_title, ats_score, shortlist_chance, 
                   shortlist_probability, career_level, jd_level, is_experience_match,
                   total_exp_required, total_exp_found, matched_skills, missing_skills, 
                   created_at
            FROM resume_reports
            ORDER BY created_at DESC
        """)
        reports = cursor.fetchall()
        cursor.close()

        for item in reports:
            if isinstance(item.get("matched_skills"), str):
                try:
                    item["matched_skills"] = json.loads(item["matched_skills"])
                except Exception:
                    item["matched_skills"] = []
            if isinstance(item.get("missing_skills"), str):
                try:
                    item["missing_skills"] = json.loads(item["missing_skills"])
                except Exception:
                    item["missing_skills"] = []

        return jsonify(reports), 200
    except Exception as e:
        print(f"Notice fetching reports: {e}")
        return jsonify([]), 200
    finally:
        if 'conn' in locals() and conn and hasattr(conn, "is_connected") and conn.is_connected():
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
            for field in ["matched_skills", "missing_skills", "experience_breakdown", "recommendations"]:
                if isinstance(report.get(field), str):
                    try:
                        report[field] = json.loads(report[field])
                    except Exception:
                        report[field] = []
            return jsonify(report), 200

        return jsonify({"message": "Report not found"}), 404
    except Exception as e:
        print(f"Error fetching report #{id}: {e}")
        return jsonify({"error": "Unable to fetch report"}), 500
    finally:
        if 'conn' in locals() and conn and hasattr(conn, "is_connected") and conn.is_connected():
            conn.close()


# 3. POST analyze resume against job description
@app.route("/analyze", methods=["POST", "OPTIONS"])
def analyze_resume():
    if request.method == "OPTIONS":
        return "", 204

    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Valid JSON required"}), 400

    error = validate_resume_input(data)
    if error:
        return jsonify({"error": error}), 400

    try:
        success, result = analyze_and_save_resume(data)
        if success:
            return jsonify(result), 200
        return jsonify({"error": result}), 409
    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({"error": "Unable to complete ATS analysis"}), 500


# 4. DELETE report by ID
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
        if 'conn' in locals() and conn:
            conn.rollback()
        print(f"Error deleting report #{id}: {e}")
        return jsonify({"error": "Unable to delete report"}), 500
    finally:
        if 'conn' in locals() and conn and hasattr(conn, "is_connected") and conn.is_connected():
            conn.close()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
