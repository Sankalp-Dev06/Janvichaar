#!/usr/bin/env python3
"""
JanVichar Setup Script
This script automates the setup process for the JanVichar project.
It creates a virtual environment, installs dependencies, and sets up a basic .env file.
"""

import os
import sys
import subprocess
import platform

def print_step(step, message):
    """Print a step in the setup process with formatting."""
    print(f"\n\033[1;36m[{step}] {message}\033[0m")

def run_command(command, shell=False):
    """Run a command and print its output."""
    try:
        if shell:
            process = subprocess.Popen(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        else:
            process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
        
        for line in process.stdout:
            print(line.strip())
        
        process.wait()
        return process.returncode == 0
    except Exception as e:
        print(f"Error running command: {e}")
        return False

def create_virtual_env():
    """Create a Python virtual environment."""
    print_step(1, "Creating Python virtual environment")
    if os.path.exists(".venv"):
        print("Virtual environment already exists. Skipping creation.")
        return True
    
    return run_command([sys.executable, "-m", "venv", ".venv"])

def activate_virtual_env():
    """Return the activation command for the virtual environment."""
    system = platform.system()
    if system == "Windows":
        return ".venv\\Scripts\\activate"
    else:  # macOS or Linux
        return "source .venv/bin/activate"

def install_dependencies():
    """Install project dependencies."""
    print_step(2, "Installing dependencies")
    
    activate_cmd = activate_virtual_env()
    
    system = platform.system()
    if system == "Windows":
        pip_cmd = f"{activate_cmd} && pip install -r requirements.txt"
    else:  # macOS or Linux
        pip_cmd = f"{activate_cmd} && pip install -r requirements.txt"
    
    return run_command(pip_cmd, shell=True)

def create_env_file():
    """Create a template .env file if it doesn't exist."""
    print_step(3, "Creating .env file template")
    
    if os.path.exists(".env"):
        print(".env file already exists. Skipping creation.")
        return True
    
    try:
        with open(".env", "w") as f:
            f.write("""# JanVichar Environment Variables
# Replace these placeholder values with your actual API keys

YOUTUBE_API_KEY=your_youtube_api_key_here
REDDIT_CLIENT_ID=your_reddit_client_id_here
REDDIT_CLIENT_SECRET=your_reddit_client_secret_here
REDDIT_USER_AGENT=your_reddit_user_agent_here
""")
        print("Created .env template file. Please edit it with your actual API keys.")
        return True
    except Exception as e:
        print(f"Error creating .env file: {e}")
        return False

def show_next_steps():
    """Show the next steps to take after setup."""
    activate_cmd = activate_virtual_env()
    
    print_step("Next Steps", "Follow these steps to run the application")
    print(f"""
1. Activate the virtual environment:
   {activate_cmd}

2. Update the .env file with your actual API keys

3. Start the backend server:
   cd backend
   uvicorn app:app --reload

4. Open the frontend in your browser:
   Open frontend/index.html in your web browser
   
5. Or start a simple HTTP server:
   cd frontend
   python -m http.server
   Then visit http://localhost:8000 in your browser
   
For a quick demo with mock data, run:
   python check.py
""")

def main():
    """Main setup function."""
    print("\033[1;32m===== JanVichar Setup Script =====\033[0m")
    print("This script will set up the environment for JanVichar.")
    
    if not create_virtual_env():
        print("\033[1;31mFailed to create virtual environment. Please check your Python installation.\033[0m")
        return
    
    if not install_dependencies():
        print("\033[1;31mFailed to install dependencies. Please try installing them manually.\033[0m")
    
    create_env_file()
    
    show_next_steps()
    
    print("\033[1;32m===== Setup Complete =====\033[0m")
    print("Thank you for installing JanVichar!")

if __name__ == "__main__":
    main() 