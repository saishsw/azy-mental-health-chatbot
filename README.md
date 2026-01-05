# AZY Mental Chatbot

A specialized AI chatbot for AZY Mental, providing Arizona-focused mental health support with crisis intervention capabilities.

## 🚨 Crisis Support

**If you're in crisis, please call:**
- **988** - National Suicide Prevention Lifeline
- **Text HOME to 741741** - Crisis Text Line
- **1-800-631-1314** - Arizona Crisis Response Network

## Features

### 🛡️ Safety First
- **Trigger Word Detection**: Automatically detects crisis keywords and immediately provides emergency resources
- **Crisis Intervention**: Stops conversation and redirects to professional help when dangerous terms are detected
- **Professional Referral**: Never attempts to handle emergencies alone

### 🏜️ Arizona-Focused
- **Local Resources**: Comprehensive database of Arizona mental health clinics, therapists, and support groups
- **Regional Hotlines**: State-specific crisis and support phone numbers
- **Community Programs**: Information about local mental health initiatives

### 💬 Intelligent Support
- **Session Management**: Remembers conversation context within sessions
- **Empathetic Responses**: AI-powered responses focused on support and guidance
- **Resource Matching**: Connects users with appropriate local services

## Technology Stack

- **Frontend**: Next.js with TypeScript, Tailwind CSS
- **Backend**: FastAPI (Python)
- **AI**: OpenAI GPT-3.5-turbo
- **Deployment**: Vercel-ready configuration

## Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.8+
- OpenAI API key

### 1. Clone and Setup

```bash
git clone <repository-url>
cd AZY-Mental-Chatbot
```

### 2. Environment Configuration

Copy the example environment file:
```bash
cp env.example .env
```

Edit `.env` with your configuration:
```env
OPENAI_API_KEY=your_openai_api_key_here
BACKEND_URL=http://localhost:8000
FRONTEND_URL=http://localhost:3000
```

### 3. Install Dependencies

**Frontend (Node.js):**
```bash
npm install
```

**Backend (Python):**
```bash
pip install -r requirements.txt
```

### 4. Run the Application

**Start the FastAPI backend:**
```bash
cd backend
python main.py
```

**Start the Next.js frontend (in a new terminal):**
```bash
npm run dev
```

### 5. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Documentation: http://localhost:8000/docs

## Deployment

### Vercel Deployment

1. **Connect to Vercel:**
   ```bash
   npm i -g vercel
   vercel login
   ```

2. **Deploy:**
   ```bash
   vercel --prod
   ```

3. **Set Environment Variables in Vercel Dashboard:**
   - `OPENAI_API_KEY`
   - `BACKEND_URL` (your deployed backend URL)

### Backend Deployment

The FastAPI backend can be deployed to:
- Railway
- Heroku
- DigitalOcean App Platform
- AWS Lambda (with modifications)

## API Endpoints

### POST /chat
Main chat endpoint with crisis detection.

**Request:**
```json
{
  "message": "I'm feeling really down today",
  "session_id": "optional-session-id"
}
```

**Response:**
```json
{
  "response": "I'm sorry you're feeling down. There are many resources in Arizona that can help...",
  "session_id": "generated-session-id",
  "is_crisis": false
}
```

### GET /resources
Get Arizona mental health resources by category.

**Query Parameters:**
- `category`: "crisis", "clinics", "support", or "all"

### GET /health
Health check endpoint.

## Crisis Detection

The system automatically detects these trigger words:
- "suicide", "kill myself", "end my life"
- "self harm", "cut myself", "hurt myself"
- "psychosis", "hallucinations", "hearing voices"
- "depression crisis", "mental breakdown"
- "overdose", "poison", "gun", "weapon"

When detected, the system:
1. Immediately stops the conversation
2. Provides crisis hotline numbers
3. Lists local Arizona emergency resources
4. Encourages immediate professional help

## Arizona Resources Database

### Crisis Hotlines
- National Suicide Prevention Lifeline: 988
- Crisis Text Line: Text HOME to 741741
- Arizona Crisis Response Network: 1-800-631-1314

### Local Clinics
- Valleywise Health Behavioral Health (Phoenix)
- Terros Health (Multiple locations)
- Community Bridges (Mesa)

### Support Groups
- NAMI Arizona
- Depression and Bipolar Support Alliance - AZ

## Sample Conversations

### Normal Support Request
```
User: "I've been feeling anxious lately and need help finding a therapist in Phoenix"
Bot: "I understand anxiety can be really challenging. In Phoenix, I'd recommend checking out Valleywise Health Behavioral Health at (602) 344-1000 or Terros Health at (602) 685-6000. Both offer anxiety treatment and accept various insurance plans..."
```

### Crisis Detection
```
User: "I'm thinking about suicide and don't know what to do"
Bot: 🚨 **CRISIS DETECTED - IMMEDIATE ACTION REQUIRED**

I've detected that you may be in crisis. Please know that you're not alone and help is available right now.

**IMMEDIATE CRISIS RESOURCES:**
📞 **National Suicide Prevention Lifeline: 988**
📱 **Crisis Text Line: Text HOME to 741741**
📞 **Arizona Crisis Response Network: 1-800-631-1314**

**If you're in immediate danger, please call 911 or go to your nearest emergency room.**
```

## Security & Privacy

- **No Data Storage**: Conversations are not permanently stored
- **Session Management**: Temporary session data for context only
- **API Key Security**: Environment variable protection
- **CORS Configuration**: Proper cross-origin request handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For technical support or questions about the chatbot:
- Create an issue in the repository
- Contact the development team

**For mental health support:**
- Call 988 for crisis support
- Contact Arizona Crisis Response Network: 1-800-631-1314

---

**Important Disclaimer**: This chatbot is a support tool and should not replace professional mental health care. Always seek professional help for mental health concerns.
