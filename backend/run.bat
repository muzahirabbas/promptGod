@echo off
echo --- Activating Virtual Environment ---
call venv\Scripts\activate

echo --- Declaring the Flask Application (main.py) ---
set FLASK_APP=main.py

echo --- Starting Gunicorn Production Server ---
flask run