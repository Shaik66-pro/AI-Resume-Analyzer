import mysql.connector
import os
from dotenv import load_dotenv

# Load environment variables from .env file if available
load_dotenv()

DB_HOST = os.getenv("DB_HOST", "localhost")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "")
DB_NAME = os.getenv("DB_NAME", "resume_analyzer_db")
DB_PORT = int(os.getenv("DB_PORT", 3306))


def get_db():
    """
    Establishes and returns a connection to MySQL database.
    Remember to close conn and cursor in finally blocks.
    """
    return mysql.connector.connect(
        host=DB_HOST,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        port=DB_PORT
    )
