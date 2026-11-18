-- ========================================================
-- AI Resume Analyzer - Enhanced ATS Database Schema
-- Run this in MySQL Workbench, phpMyAdmin, or MySQL CLI
-- ========================================================

CREATE DATABASE IF NOT EXISTS resume_analyzer_db;
USE resume_analyzer_db;

CREATE TABLE IF NOT EXISTS resume_reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    candidate_name VARCHAR(150) NOT NULL,
    job_title VARCHAR(150) NOT NULL,
    ats_score DECIMAL(5,2) NOT NULL,
    cosine_similarity DECIMAL(5,4),
    shortlist_chance VARCHAR(50),
    shortlist_probability DECIMAL(5,2),
    career_level VARCHAR(100),
    jd_level VARCHAR(100),
    is_experience_match BOOLEAN DEFAULT TRUE,
    suitability_feedback TEXT,
    total_exp_required VARCHAR(100),
    total_exp_found VARCHAR(100),
    matched_skills TEXT,
    missing_skills TEXT,
    experience_breakdown LONGTEXT,
    recommendations TEXT,
    resume_text LONGTEXT,
    job_description LONGTEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
