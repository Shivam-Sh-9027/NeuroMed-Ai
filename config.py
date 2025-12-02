# config.py — All configuration in one place

import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

class Config:
    SECRET_KEY = "SUPER_SECRET_KEY"  # Change in production
    SQLALCHEMY_DATABASE_URI = "mysql+pymysql://ShivDB:Shiv%40m1234@localhost/neuromed_ai"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    ALLOWED_EXTENSIONS = {"png", "jpg", "jpeg", "pdf"}
