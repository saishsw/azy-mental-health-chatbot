# AZY Mental Chatbot - Deployment Guide

This guide covers deploying the AZY Mental chatbot to various platforms, with a focus on Vercel for the frontend and options for the FastAPI backend.

## 🚀 Vercel Deployment (Frontend)

### Prerequisites
- Vercel account (free tier available)
- GitHub repository with your code
- OpenAI API key

### Step 1: Prepare Your Repository

1. **Ensure your repository is ready:**
   ```bash
   git add .
   git commit -m "Initial commit for Vercel deployment"
   git push origin main
   ```

2. **Verify your configuration files:**
   - `vercel.json` is present and configured
   - `package.json` has correct scripts
   - `next.config.js` is properly configured

### Step 2: Deploy to Vercel

#### Option A: Using Vercel CLI
```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

#### Option B: Using Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Configure project settings:
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 3: Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

```env
OPENAI_API_KEY=your_openai_api_key_here
BACKEND_URL=https://your-backend-url.com
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

### Step 4: Deploy Backend

You'll need to deploy your FastAPI backend separately. Here are the options:

## 🐍 Backend Deployment Options

### Option 1: Railway (Recommended)

Railway is excellent for Python applications and offers a generous free tier.

1. **Sign up at [railway.app](https://railway.app)**
2. **Connect your GitHub repository**
3. **Create a new service:**
   ```bash
   # Install Railway CLI
   npm i -g @railway/cli
   
   # Login
   railway login
   
   # Initialize project
   railway init
   ```

4. **Configure the service:**
   - Set the source directory to `backend/`
   - Add environment variables:
     ```env
     OPENAI_API_KEY=your_openai_api_key_here
     ```

5. **Deploy:**
   ```bash
   railway up
   ```

6. **Get your backend URL** and update your Vercel environment variables.

### Option 2: Heroku

1. **Install Heroku CLI:**
   ```bash
   # macOS
   brew install heroku/brew/heroku
   
   # Windows
   # Download from https://devcenter.heroku.com/articles/heroku-cli
   ```

2. **Create Heroku app:**
   ```bash
   heroku login
   heroku create azy-mental-backend
   ```

3. **Configure for Python:**
   ```bash
   # Add Python buildpack
   heroku buildpacks:set heroku/python
   
   # Set environment variables
   heroku config:set OPENAI_API_KEY=your_openai_api_key_here
   ```

4. **Deploy:**
   ```bash
   git push heroku main
   ```

### Option 3: DigitalOcean App Platform

1. **Create a new app in DigitalOcean**
2. **Connect your GitHub repository**
3. **Configure the app:**
   - Source: `backend/`
   - Environment: Python
   - Build Command: `pip install -r requirements.txt`
   - Run Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

4. **Add environment variables:**
   - `OPENAI_API_KEY`

### Option 4: AWS Lambda (Advanced)

For serverless deployment:

1. **Install AWS SAM CLI**
2. **Create `template.yaml`:**
   ```yaml
   AWSTemplateFormatVersion: '2010-09-09'
   Transform: AWS::Serverless-2016-10-31
   
   Resources:
     AZYMentalAPI:
       Type: AWS::Serverless::Function
       Properties:
         CodeUri: backend/
         Handler: main.handler
         Runtime: python3.9
         Environment:
           Variables:
             OPENAI_API_KEY: !Ref OpenAIAPIKey
         Events:
           Api:
             Type: Api
             Properties:
               Path: /{proxy+}
               Method: ANY
   
   Parameters:
     OpenAIAPIKey:
       Type: String
       NoEcho: true
   ```

3. **Deploy:**
   ```bash
   sam build
   sam deploy --guided
   ```

## 🔧 Environment Configuration

### Required Environment Variables

**Frontend (Vercel):**
```env
NEXT_PUBLIC_BACKEND_URL=https://your-backend-url.com
```

**Backend:**
```env
OPENAI_API_KEY=your_openai_api_key_here
CORS_ORIGINS=https://your-frontend-url.vercel.app
```

### Optional Environment Variables

```env
# For production logging
LOG_LEVEL=INFO

# For session management (if using Redis)
REDIS_URL=your_redis_url

# For monitoring
SENTRY_DSN=your_sentry_dsn
```

## 🌐 Domain Configuration

### Custom Domain Setup

1. **In Vercel Dashboard:**
   - Go to **Settings** → **Domains**
   - Add your custom domain
   - Configure DNS records as instructed

2. **Update CORS settings in backend:**
   ```python
   app.add_middleware(
       CORSMiddleware,
       allow_origins=[
           "https://your-domain.com",
           "https://www.your-domain.com"
       ],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

## 📊 Monitoring and Analytics

### Vercel Analytics
- Enable Vercel Analytics in your project dashboard
- Monitor performance and user behavior

### Backend Monitoring
- Add health check endpoint monitoring
- Set up uptime monitoring (UptimeRobot, Pingdom)
- Configure error tracking (Sentry)

## 🔒 Security Considerations

### API Key Security
- Never commit API keys to version control
- Use environment variables for all sensitive data
- Rotate API keys regularly

### CORS Configuration
- Only allow necessary origins
- Configure proper CORS headers
- Use HTTPS in production

### Rate Limiting
Consider adding rate limiting to your backend:
```python
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.post("/chat")
@limiter.limit("10/minute")
async def chat_endpoint(request: Request, chat_message: ChatMessage):
    # Your existing code
```

## 🚀 Production Checklist

Before going live:

- [ ] All environment variables configured
- [ ] CORS settings updated for production domains
- [ ] SSL certificates configured
- [ ] Health check endpoints working
- [ ] Error handling tested
- [ ] Crisis detection tested
- [ ] Performance monitoring set up
- [ ] Backup strategy in place
- [ ] Documentation updated
- [ ] Legal disclaimers added

## 🔄 Continuous Deployment

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Vercel

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

## 🆘 Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Check CORS configuration in backend
   - Verify frontend URL is in allowed origins

2. **API Key Issues:**
   - Verify environment variables are set
   - Check API key permissions and quota

3. **Build Failures:**
   - Check Node.js version compatibility
   - Verify all dependencies are installed

4. **Runtime Errors:**
   - Check backend logs
   - Verify database connections (if applicable)

### Getting Help

- Check Vercel deployment logs
- Review backend application logs
- Test endpoints individually
- Verify environment variable configuration

## 📈 Scaling Considerations

### Frontend (Vercel)
- Vercel automatically scales
- Consider using Edge Functions for global performance
- Implement caching strategies

### Backend
- Use connection pooling for database connections
- Implement caching (Redis)
- Consider microservices architecture for large scale
- Monitor resource usage and scale accordingly

---

**Note:** This deployment guide covers the most common scenarios. For specific requirements or custom configurations, refer to the official documentation of each platform.
