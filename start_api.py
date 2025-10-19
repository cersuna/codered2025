#!/usr/bin/env python3
"""
Startup script for the WSB Sentiment Analysis API
This script will start the FastAPI backend server
"""

import subprocess
import sys
import os
from pathlib import Path

def main():
    # Change to the script directory
    script_dir = Path(__file__).parent
    os.chdir(script_dir)
    
    print("🚀 Starting WSB Sentiment Analysis API...")
    print("📍 API will be available at: http://localhost:8000")
    print("📊 API docs will be available at: http://localhost:8000/docs")
    print("🛑 Press Ctrl+C to stop the server")
    print("-" * 50)
    
    try:
        # Start the FastAPI server
        subprocess.run([
            sys.executable, "-m", "uvicorn", 
            "api:app", 
            "--host", "0.0.0.0", 
            "--port", "8000", 
            "--reload"
        ])
    except KeyboardInterrupt:
        print("\n🛑 Server stopped by user")
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
