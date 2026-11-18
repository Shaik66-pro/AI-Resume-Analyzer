# AI Resume Analyzer

An intelligent, beginner-friendly full-stack application that analyzes resumes against job descriptions, calculates an ATS (Applicant Tracking System) match score using **NLP, TF-IDF, and Cosine Similarity**, extracts candidate skills, flags missing keywords, generates targeted improvement suggestions, and stores analysis reports in **MySQL**.

---

## 🚀 Features

- **ATS Match Score**: Computes similarity using TF-IDF vectorization and Cosine Similarity combined with domain skill overlap.
- **NLP Skill Extraction**: Automatically identifies tech and soft skills from both resumes and job descriptions.
- **Missing Skills & Suggestions**: Identifies skill gaps and provides targeted bullet-point recommendations for the candidate.
- **Clean Flask REST API**: Beginner-friendly architecture adhering to clear separation of concerns (`database.py`, `validation.py`, `resume_service.py`, `nlp_engine.py`, `app.py`).
- **MySQL Database Persistence**: Stores analysis reports, matched/missing skills, and timestamps for tracking and historical reference.
- **Interactive React.js Interface**: Modern UI with real-time score indicators, skill badges, and a past reports history dashboard.
- **AWS Deployment Ready**: Designed for deployment on AWS (EC2 + RDS MySQL or Elastic Beanstalk).

---

## 📁 Project Architecture

```
ai-resume-analyzer/
│
├── backend/
│   ├── app.py               # Main Flask API routes (GET, POST, DELETE)
│   ├── database.py          # MySQL connection helper (get_db)
│   ├── validation.py        # Input data validation logic
│   ├── resume_service.py    # Service logic orchestrating analysis & DB saves
│   ├── nlp_engine.py        # NLP, TF-IDF vectorization & Cosine Similarity
│   ├── schema.sql           # MySQL database and table schema
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # Environment variables template
│
├── frontend/
│   ├── public/
│   │   └── index.html       # HTML entry point
│   ├── src/
│   │   ├── App.js           # Main React component (Form, Scorecard, History)
│   │   ├── App.css          # Clean, modern responsive CSS styles
│   │   └── index.js         # React root rendering
│   └── package.json         # React project dependencies & scripts
│
└── README.md                # Project documentation & run guide
```

---

## 🛠️ Prerequisites

Make sure you have installed:
1. **Python** (version 3.8+)
2. **Node.js** (version 16+) and **npm**
3. **MySQL Server** (local or remote via XAMPP, MySQL Workbench, or Docker)

---

## ⚙️ Step 1: Database Setup (MySQL)

1. Open your MySQL client (MySQL Command Line, Workbench, or phpMyAdmin).
2. Execute the queries inside [backend/schema.sql](file:///C:/Users/samee/.gemini/antigravity/scratch/ai-resume-analyzer/backend/schema.sql):

```sql
CREATE DATABASE IF NOT EXISTS resume_analyzer_db;
USE resume_analyzer_db;

CREATE TABLE IF NOT EXISTS resume_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_name VARCHAR(150) NOT NULL,
    job_title VARCHAR(150) NOT NULL,
    match_score DECIMAL(5,2) NOT NULL,
    matched_skills TEXT,
    missing_skills TEXT,
    suggestions TEXT,
    resume_text LONGTEXT,
    job_description LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🐍 Step 2: Backend Setup (Flask)

1. Open a terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. (Optional but recommended) Create and activate a virtual environment:
   ```bash
   # Windows
   python -m venv venv
   .\venv\Scripts\activate

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. Install required Python packages:
   ```bash
   pip install -r requirements.txt
   ```

4. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
   Update the MySQL credentials in `.env`:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=resume_analyzer_db
   DB_PORT=3306
   ```

5. Run the Flask application:
   ```bash
   python app.py
   ```
   The Flask server will start at `http://localhost:5000`.

---

## ⚛️ Step 3: Frontend Setup (React.js)

1. Open a new terminal and navigate to the frontend folder:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the React development server:
   ```bash
   npm start
   ```
   The application will open in your browser at `http://localhost:3000`.

---

## 🔌 API Endpoints Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | API status check |
| `POST` | `/analyze` | Analyzes resume vs JD, calculates ATS score, and saves to MySQL |
| `GET` | `/reports` | Retrieves all saved candidate analysis reports |
| `GET` | `/reports/<id>` | Retrieves a single report by ID |
| `GET` | `/reports/job/<title>` | Filters reports by job title |
| `DELETE` | `/reports/<id>` | Deletes an analysis report from MySQL |

### Sample POST `/analyze` Request Body:
```json
{
  "candidate_name": "Alex Mercer",
  "job_title": "Full Stack Python Developer",
  "resume_text": "Experienced Python engineer with Flask, React, and MySQL skills...",
  "job_description": "Seeking Python developer with Flask, React, AWS, Docker, and NLP expertise..."
}
```

---

## ☁️ AWS Deployment Guide

To deploy this project on AWS as highlighted in the resume bullet point:

1. **Database (AWS RDS)**:
   - Create a free-tier MySQL instance on Amazon RDS.
   - Run `schema.sql` on the RDS endpoint and set the RDS endpoint in your backend `.env`.

2. **Backend (AWS EC2 / Elastic Beanstalk)**:
   - Launch an Ubuntu EC2 instance.
   - Install Python, clone the repository, install `requirements.txt`.
   - Use `gunicorn` with `systemd` or `nginx` reverse proxy to serve the Flask API.

3. **Frontend (AWS S3 + CloudFront / EC2)**:
   - Run `npm run build` in the `frontend` folder.
   - Upload the `build` directory to an Amazon S3 bucket configured for static website hosting, fronted by Amazon CloudFront for HTTPS.
