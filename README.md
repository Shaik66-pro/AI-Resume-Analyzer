# AI Resume Analyzer & ATS Recruitment Intelligence

An advanced, full-stack **AI Resume Analyzer & ATS Screener** built with **Python, Flask, React.js, MySQL, NLP, TF-IDF, and Cosine Similarity**. 

The system goes beyond basic keyword counts: it evaluates **career experience alignment (Fresher vs Experienced)**, calculates **realistic ATS match scores**, predicts **shortlisting probabilities**, detects **critical keyword gaps**, and generates **granular requirement breakdown tables with extracted verification proof**.

---

## 🌟 Key Features

1. **Experience Alignment & Gap Detection**:
   - Categorizes candidate level (Fresher / Entry-Level 0 yrs, Junior 1-2 yrs, Mid-Level, Senior 5+ yrs).
   - Extracts Job Description expectations (e.g. "Requires 5+ years experience").
   - Identifies candidate-role compatibility: automatically flags experience gaps (e.g., Fresher applying for Senior role) with contextual feedback.

2. **Multi-Dimensional ATS Match Score**:
   - Combines **TF-IDF Vectorization & Cosine Similarity** with domain skill overlap and experience compatibility penalties.
   - Outputs a 0–100% composite ATS match score.

3. **Shortlisting Probability Engine**:
   - Calculates candidate shortlisting probability percentage (e.g. 85%) and qualitative tier (**High**, **Moderate**, **Low**).

4. **Granular Requirement Breakdown**:
   - Matches individual JD requirements against candidate resume bullet points.
   - Flags status: `Met`, `Missing`, or `Exceeded` alongside exact extracted quotes from the resume.

5. **Keyword Matrix & Actionable Suggestions**:
   - Visual chips for Matched Skills vs Missing Skills.
   - Tailored recommendations to optimize the resume for ATS parsers.

6. **Relational MySQL Database Persistence**:
   - Stores candidate names, target roles, ATS scores, experience breakdown, skills, and timestamps.

7. **Premium SaaS UI**:
   - Glassmorphism dark theme, animated metric meters, instant test presets ("Fresher vs Senior Role", "Matched Role"), and MySQL screening history table.

---

## 📁 Architecture Overview

```
ai-resume-analyzer/
├── backend/
│   ├── app.py               # Flask REST endpoints (GET, POST, DELETE)
│   ├── database.py          # MySQL connection pooling (get_db)
│   ├── validation.py        # Input data validation logic
│   ├── resume_service.py    # Service orchestrating scoring & DB saves
│   ├── nlp_engine.py        # TF-IDF, Cosine Similarity, Experience Parser
│   ├── schema.sql           # MySQL database schema (resume_reports table)
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Backend container definition
├── frontend/
│   ├── public/
│   │   └── index.html       # HTML entry point
│   ├── src/
│   │   ├── App.js           # Premium React UI with Preset Demos & Metric Cards
│   │   ├── App.css          # Glassmorphism dark styling & responsive tables
│   │   └── index.js         # React root rendering
│   └── package.json         # React project dependencies
├── application.py           # AWS Elastic Beanstalk entry point
├── aws_setup.sh             # 1-click automated AWS EC2 deployment script
├── docker-compose.yml       # Multi-container orchestration (MySQL + Backend)
└── README.md
```

---

## 🚀 Quick Start (Local Setup)

### 1. Database Setup (MySQL)
Run the queries inside `backend/schema.sql` in MySQL Workbench or CLI:
```sql
CREATE DATABASE IF NOT EXISTS resume_analyzer_db;
USE resume_analyzer_db;
-- (executes table creation for resume_reports)
```

### 2. Backend Setup (Flask)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python app.py
```
*API runs at `http://localhost:5000`.*

### 3. Frontend Setup (React.js)
```bash
cd frontend
npm install
npm start
```
*Frontend runs at `http://localhost:3000`.*

---

## ☁️ AWS Deployment (Elastic Beanstalk / EC2)

1. **Automated EC2 Script**:
   ```bash
   git clone https://github.com/Shaik66-pro/AI-Resume-Analyzer.git
   cd AI-Resume-Analyzer && bash aws_setup.sh
   ```
2. **Elastic Beanstalk**:
   - Upload `ai-resume-analyzer-aws.zip` directly to your Elastic Beanstalk Python environment.
   - The environment automatically detects `application.py` and starts the service.
