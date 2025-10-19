# Vercel Deployment Guide

## Prerequisites

1. **Reddit API Credentials**: You'll need to set up Reddit API credentials
2. **Vercel Account**: Sign up at https://vercel.com

## Environment Variables

Set these in your Vercel dashboard under Project Settings > Environment Variables:

```
REDDIT_CLIENT_ID=your_reddit_client_id
REDDIT_CLIENT_SECRET=your_reddit_client_secret
REDDIT_USER_AGENT=your_app_name/1.0
```

## Deployment Steps

1. **Push to GitHub**: Make sure your code is in a GitHub repository
2. **Connect to Vercel**: Import your GitHub repository in Vercel
3. **Set Environment Variables**: Add the Reddit API credentials in Vercel dashboard
4. **Deploy**: Vercel will automatically deploy using the `vercel.json` configuration

## File Structure

The deployment expects this structure:
```
codered/
├── app.py                 # FastAPI entrypoint (required by Vercel)
├── requirements.txt       # Python dependencies
├── vercel.json           # Vercel configuration
├── frontend/             # Next.js frontend
│   ├── package.json
│   └── src/app/
└── [other files...]
```

## API Endpoints

Once deployed, your API will be available at:
- `https://your-app.vercel.app/api/health`
- `https://your-app.vercel.app/api/sentiment`
- `https://your-app.vercel.app/api/analyze`
- `https://your-app.vercel.app/api/status`

## Troubleshooting

- **Build Errors**: Check that `app.py` exists and contains the FastAPI app
- **Environment Variables**: Ensure Reddit API credentials are set in Vercel dashboard
- **Dependencies**: Verify `requirements.txt` has all necessary packages
