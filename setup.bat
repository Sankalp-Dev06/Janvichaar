@echo off
echo ===== JanVichar Setup =====
echo This script will set up the JanVichar environment on your Windows machine.
echo.

REM Check if Python is installed
python --version > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Python is not installed or not in PATH.
    echo Please install Python 3.8 or higher from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    pause
    exit /b 1
)

REM Run the setup script
echo Running setup script...
python setup.py

echo.
echo If you encounter any issues, please refer to the README.md file for manual setup instructions.
pause 