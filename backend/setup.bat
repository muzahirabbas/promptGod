@echo off
echo --- 1. Creating Virtual Environment (venv) ---
python -m venv venv

echo --- 2. Activating Environment ---
call venv\Scripts\activate

echo --- 3. Installing Dependencies from requirements.txt ---
pip install -r requirements.txt

echo --- 4. Declaring the Flask Application (main.py) ---
set FLASK_APP=main.py

echo.
echo Setup Complete!
echo You can now run the application using 'run_dev.bat' or 'run_prod.bat'.
echo Remember to place your 'key.json' file in this directory.
pause