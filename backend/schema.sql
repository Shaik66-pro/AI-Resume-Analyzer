-- ========================================================
-- AI Resume Analyzer - Database Schema
-- Run this in MySQL Workbench, phpMyAdmin, or MySQL CLI
-- ========================================================

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
