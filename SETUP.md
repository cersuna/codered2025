# WSB Sentiment Analysis API Setup

This guide will help you set up the WSB Sentiment Analysis API with a frontend dashboard.

## Prerequisites

- Python 3.8+ 
- Node.js 18+ (for the frontend)
- Reddit API credentials (for scraping WSB posts)

## Backend Setup (Python API)

### 1. Install Python Dependencies

```bash
cd codered
pip install -r requirements.txt
```

### 2. Set up Reddit API Credentials

Create a `.env` file in the `codered` directory:

```bash
# .env
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=your_app_name/1.0
```

To get Reddit API credentials:
1. Go to https://www.reddit.com/prefs/apps
2. Click "Create App" or "Create Another App"
3. Choose "script" as the app type
4. Copy the client ID and secret

### 3. Download spaCy Model

```bash
python -m spacy download en_core_web_sm
```

### 4. Start the API Server

```bash
python start_api.py
```

The API will be available at:
- **API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/api/health

## Frontend Setup (Next.js Dashboard)

### 1. Install Node Dependencies

```bash
cd codered/frontend
npm install
```

### 2. Start the Frontend Development Server

```bash
npm run dev
```

The frontend will be available at: http://localhost:3000

## Usage

1. **Start the Backend**: Run `python start_api.py` in the `codered` directory
2. **Start the Frontend**: Run `npm run dev` in the `codered/frontend` directory
3. **Open the Dashboard**: Navigate to http://localhost:3000
4. **Click "Search New WSB Posts"**: This will trigger the analysis of fresh WSB posts

## API Endpoints

- `GET /api/status` - Get analysis status
- `POST /api/analyze` - Start new WSB analysis
- `GET /api/posts` - Get scraped posts
- `GET /api/sentiment` - Get sentiment analysis results
- `GET /api/health` - Health check

## How It Works

1. **Scraping**: The API uses PRAW to fetch posts from r/wallstreetbets
2. **Analysis**: Posts are analyzed using VADER sentiment analysis and spaCy NLP
3. **Ticker Extraction**: Stock tickers are extracted from post content
4. **Results**: Sentiment scores and ticker mentions are displayed in the dashboard

## Troubleshooting

### Common Issues

1. **Reddit API Rate Limits**: The scraper includes delays to respect rate limits
2. **Missing Dependencies**: Make sure all Python packages are installed
3. **CORS Issues**: The API includes CORS middleware for frontend communication
4. **Analysis Timeout**: Analysis may take 2-5 minutes depending on post volume

### Logs

Check the console output for detailed logs about the analysis process.

## File Structure

```
codered/
├── api.py                 # FastAPI backend
├── analyze_wsb.py         # Main analysis script
├── scraper.py            # Reddit scraper
├── sentiment.py          # Sentiment analysis
├── requirements.txt      # Python dependencies
├── start_api.py         # API startup script
└── frontend/            # Next.js frontend
    ├── src/app/
    │   ├── page.tsx
    │   └── WSBSentimentDashboard.tsx
    └── package.json
```
