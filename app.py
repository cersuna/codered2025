from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import json
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime
import asyncio
from typing import Dict, Any, Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="WSB Sentiment Analysis API", version="1.0.0")

# Add CORS middleware to allow frontend to call the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for deployment
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state to track analysis status
analysis_status = {
    "is_running": False,
    "last_run": None,
    "error": None,
    "posts_count": 0,
    "sentiment_count": 0
}

def run_wsb_analysis():
    """Run the WSB analysis in the background"""
    try:
        logger.info("Starting WSB analysis...")
        analysis_status["is_running"] = True
        analysis_status["error"] = None
        
        # Change to the codered directory
        os.chdir(Path(__file__).parent)
        
        # Run the analyze_wsb.py script
        result = subprocess.run([
            sys.executable, "analyze_wsb.py"
        ], capture_output=True, text=True, timeout=300)  # 5 minute timeout
        
        if result.returncode != 0:
            raise Exception(f"Analysis failed: {result.stderr}")
        
        # Count the results
        posts_path = Path("posts.json")
        sentiment_path = Path("sentiment_results.json")
        
        if posts_path.exists():
            with open(posts_path, 'r', encoding='utf-8') as f:
                posts_data = json.load(f)
                analysis_status["posts_count"] = len(posts_data)
        
        if sentiment_path.exists():
            with open(sentiment_path, 'r', encoding='utf-8') as f:
                sentiment_data = json.load(f)
                analysis_status["sentiment_count"] = len(sentiment_data)
        
        analysis_status["last_run"] = datetime.now().isoformat()
        logger.info(f"WSB analysis completed successfully. Posts: {analysis_status['posts_count']}, Sentiment: {analysis_status['sentiment_count']}")
        
    except subprocess.TimeoutExpired:
        error_msg = "Analysis timed out after 5 minutes"
        logger.error(error_msg)
        analysis_status["error"] = error_msg
    except Exception as e:
        error_msg = f"Analysis failed: {str(e)}"
        logger.error(error_msg)
        analysis_status["error"] = error_msg
    finally:
        analysis_status["is_running"] = False

@app.get("/")
async def root():
    return {"message": "WSB Sentiment Analysis API", "status": "running"}

@app.get("/api/status")
async def get_status():
    """Get the current status of the analysis"""
    return analysis_status

@app.post("/api/analyze")
async def start_analysis(background_tasks: BackgroundTasks):
    """Start a new WSB analysis"""
    if analysis_status["is_running"]:
        raise HTTPException(status_code=409, detail="Analysis is already running")
    
    # Start the analysis in the background
    background_tasks.add_task(run_wsb_analysis)
    
    return {"message": "Analysis started", "status": "running"}

@app.get("/api/posts")
async def get_posts():
    """Get the latest posts data"""
    posts_path = Path("posts.json")
    if not posts_path.exists():
        raise HTTPException(status_code=404, detail="No posts data found")
    
    try:
        with open(posts_path, 'r', encoding='utf-8') as f:
            posts_data = json.load(f)
        return {"posts": posts_data, "count": len(posts_data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading posts: {str(e)}")

@app.get("/api/sentiment")
async def get_sentiment():
    """Get the latest sentiment analysis results"""
    sentiment_path = Path("sentiment_results.json")
    if not sentiment_path.exists():
        raise HTTPException(status_code=404, detail="No sentiment data found")
    
    try:
        with open(sentiment_path, 'r', encoding='utf-8') as f:
            sentiment_data = json.load(f)
        return {"sentiment": sentiment_data, "count": len(sentiment_data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading sentiment data: {str(e)}")

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Serve static files from the frontend build directory
frontend_build_path = Path("frontend/out")
if frontend_build_path.exists():
    app.mount("/", StaticFiles(directory=str(frontend_build_path), html=True), name="static")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
