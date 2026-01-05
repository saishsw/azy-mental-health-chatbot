from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from openai import OpenAI
from dotenv import load_dotenv
import re
import uuid
from datetime import datetime

# Load environment variables
load_dotenv()

app = FastAPI(title="AZY Mental Chatbot API", version="1.0.0")

# Configure CORS for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "https://azy-mental-health-chatbot.vercel.app",
        "https://azy-mental-health-chatbot-66kb712hh-saishsws-projects.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure OpenAI client for Llama4scout/CyVerse
api_key = os.getenv("OPENAI_API_KEY")
if api_key:
    client = OpenAI(
        api_key=api_key,
        base_url=os.getenv("OPENAI_BASE_URL")  # Set your CyVerse endpoint here
    )
else:
    client = None
    print("WARNING: OPENAI_API_KEY not found. Chat endpoints will not function.")

# In-memory session storage (in production, use Redis or database)
sessions: Dict[str, Dict[str, Any]] = {}

# Trigger words that require immediate crisis intervention
CRISIS_TRIGGER_WORDS = [
    "suicide", "kill myself", "end my life", "want to die", "better off dead",
    "self harm", "cut myself", "hurt myself", "self-injury",
    "psychosis", "hallucinations", "hearing voices", "seeing things",
    "depression crisis", "mental breakdown", "can't take it anymore",
    "overdose", "poison", "gun", "weapon", "plan to die"
]

# Arizona-specific mental health resources
ARIZONA_RESOURCES = {
    "crisis_hotlines": [
        {
            "name": "National Suicide Prevention Lifeline",
            "number": "988",
            "description": "24/7 crisis support"
        },
        {
            "name": "Crisis Text Line",
            "number": "Text HOME to 741741",
            "description": "24/7 crisis text support"
        },
        {
            "name": "Arizona Crisis Response Network",
            "number": "1-800-631-1314",
            "description": "Statewide crisis support"
        }
    ],
    "local_clinics": [
        {
            "name": "Valleywise Health Behavioral Health",
            "location": "Phoenix, AZ",
            "phone": "(602) 344-1000",
            "services": "Mental health treatment, crisis intervention"
        },
        {
            "name": "Terros Health",
            "location": "Multiple locations across AZ",
            "phone": "(602) 685-6000",
            "services": "Mental health, substance abuse, crisis services"
        },
        {
            "name": "Community Bridges",
            "location": "Mesa, AZ",
            "phone": "(480) 784-1500",
            "services": "Crisis stabilization, mental health treatment"
        }
    ],
    "support_groups": [
        {
            "name": "NAMI Arizona",
            "phone": "(602) 244-8166",
            "services": "Support groups for families and individuals"
        },
        {
            "name": "Depression and Bipolar Support Alliance - AZ",
            "phone": "(602) 254-3337",
            "services": "Peer support groups"
        }
    ]
}

class ChatMessage(BaseModel):
    message: str
    session_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    session_id: str
    is_crisis: bool
    resources: Optional[List[Dict[str, str]]] = None

def detect_crisis_triggers(message: str) -> bool:
    """
    Detect if the message contains crisis trigger words.
    Returns True if crisis keywords are detected.
    """
    message_lower = message.lower()
    for trigger in CRISIS_TRIGGER_WORDS:
        if trigger in message_lower:
            return True
    return False

def get_crisis_response() -> str:
    """
    Generate an immediate crisis response with emergency resources.
    """
    crisis_response = """
🚨 **CRISIS DETECTED - IMMEDIATE ACTION REQUIRED**

I've detected that you may be in crisis. Please know that you're not alone and help is available right now.

**IMMEDIATE CRISIS RESOURCES:**

📞 **National Suicide Prevention Lifeline: 988**
📱 **Crisis Text Line: Text HOME to 741741**
📞 **Arizona Crisis Response Network: 1-800-631-1314**

**If you're in immediate danger, please call 911 or go to your nearest emergency room.**

**Local Arizona Crisis Resources:**
• Valleywise Health Behavioral Health: (602) 344-1000
• Terros Health: (602) 685-6000
• Community Bridges: (480) 784-1500

Please reach out to one of these resources immediately. You deserve support and care.
"""
    return crisis_response

def get_arizona_resources(category: str = "all") -> List[Dict[str, str]]:
    """
    Get Arizona-specific mental health resources by category.
    """
    if category == "crisis":
        return ARIZONA_RESOURCES["crisis_hotlines"]
    elif category == "clinics":
        return ARIZONA_RESOURCES["local_clinics"]
    elif category == "support":
        return ARIZONA_RESOURCES["support_groups"]
    else:
        return (
            ARIZONA_RESOURCES["crisis_hotlines"] +
            ARIZONA_RESOURCES["local_clinics"] +
            ARIZONA_RESOURCES["support_groups"]
        )

def generate_chatbot_response(message: str, session_id: str) -> str:
    """
    Generate a response using OpenAI API with Arizona-specific context.
    """
    try:
        # Create conversation context
        session = sessions.get(session_id, {"messages": []})
        conversation_history = session.get("messages", [])
        
        # Build system prompt with Arizona focus
        system_prompt = """You are AZY Mental, a compassionate AI assistant focused on providing mental health support and resources specifically for Arizona residents. 

IMPORTANT GUIDELINES:
1. Always prioritize user safety - if you detect crisis indicators, immediately refer to crisis resources
2. Focus ONLY on Arizona-specific mental health resources, clinics, and support groups
3. Be empathetic, supportive, and non-judgmental
4. Do NOT provide medical advice or diagnosis
5. Always encourage professional help when appropriate
6. Keep responses concise but helpful

ARIZONA RESOURCES TO REFERENCE:
- Crisis: National Suicide Prevention Lifeline (988), Crisis Text Line (741741), Arizona Crisis Response Network (1-800-631-1314)
- Local clinics: Valleywise Health, Terros Health, Community Bridges
- Support groups: NAMI Arizona, Depression and Bipolar Support Alliance - AZ

Remember: You are here to support and guide users to appropriate Arizona resources, not to replace professional mental health care."""

        # Prepare messages for OpenAI
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add conversation history (last 10 messages to stay within limits)
        for msg in conversation_history[-10:]:
            messages.append(msg)
        
        # Add current user message
        messages.append({"role": "user", "content": message})
        
        # Call OpenAI API
        try:
            response = client.chat.completions.create(
                model="js2/llama-4-scout",
                messages=messages,
                max_tokens=300,
                temperature=0.7
            )
            
            assistant_response = response.choices[0].message.content
            
        except Exception as openai_error:
            print(f"OpenAI API Error: {openai_error}")
            return f"I'm having trouble processing your request right now. Please try again or contact Arizona Crisis Response Network at 1-800-631-1314 for immediate support."
        
        # Update session
        conversation_history.extend([
            {"role": "user", "content": message},
            {"role": "assistant", "content": assistant_response}
        ])
        
        # Keep only last 20 messages to manage memory
        sessions[session_id] = {
            "messages": conversation_history[-20:],
            "last_updated": datetime.now().isoformat()
        }
        
        return assistant_response
        
    except Exception as e:
        print(f"General Error in generate_chatbot_response: {e}")
        return f"I'm having trouble processing your request right now. Please try again or contact Arizona Crisis Response Network at 1-800-631-1314 for immediate support."

@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(chat_message: ChatMessage):
    """
    Main chat endpoint that handles user messages with crisis detection.
    """
    try:
        # Generate or retrieve session ID
        session_id = chat_message.session_id or str(uuid.uuid4())
        
        # Check for crisis triggers first
        if detect_crisis_triggers(chat_message.message):
            return ChatResponse(
                response=get_crisis_response(),
                session_id=session_id,
                is_crisis=True,
                resources=get_arizona_resources("crisis")
            )
        
        # Generate normal response
        response = generate_chatbot_response(chat_message.message, session_id)
        
        return ChatResponse(
            response=response,
            session_id=session_id,
            is_crisis=False
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing chat: {str(e)}")

@app.get("/resources")
async def get_resources(category: str = "all"):
    """
    Get Arizona-specific mental health resources.
    """
    return {"resources": get_arizona_resources(category)}

@app.get("/health")
async def health_check():
    """
    Health check endpoint for deployment monitoring.
    """
    return {"status": "healthy", "service": "AZY Mental Chatbot API"}

from research import search_articles

@app.get("/research")
async def research_endpoint(query: str):
    """
    Search for scholarly articles on mental health topics.
    """
    if not query:
        raise HTTPException(status_code=400, detail="Query parameter is required")
        
    articles = await search_articles(query)
    return {"articles": articles}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
