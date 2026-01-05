#!/bin/bash

# colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Setting up AZY Mental Health Chatbot for Local Testing...${NC}"

# 1. Configure Frontend to talk to Local Backend
echo -e "\n${YELLOW}1. Configuring Frontend (.env.local)...${NC}"
echo "NEXT_PUBLIC_BACKEND_URL=http://localhost:8000" > .env.local
echo "BACKEND_URL=http://localhost:8000" >> .env.local
echo -e "${GREEN}✅ Pointed Frontend to http://localhost:8000${NC}"

# 2. Check Backend Environment Headers
echo -e "\n${YELLOW}2. Checking Backend Configuration (.env)...${NC}"
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file missing!${NC}"
    echo "Creating .env template..."
    echo "OPENAI_API_KEY=replace_with_your_openai_key" > .env
    echo "OPENAI_BASE_URL=https://api.openai.com/v1" >> .env
    
    echo -e "\n${RED}⚠️  ACTION REQUIRED:${NC}"
    echo "I have created a '.env' file for you."
    echo "Please open it and paste your OPENAI_API_KEY before running this script again."
    exit 1
else
    # Check if key is generic placeholder
    if grep -q "replace_with_your" .env; then
        echo -e "${RED}⚠️  Please update the OPENAI_API_KEY in .env!${NC}"
        exit 1
    fi
     echo -e "${GREEN}✅ Backend .env found${NC}"
fi

# 3. Start Servers
echo -e "\n${YELLOW}3. Starting Servers...${NC}"
echo "------------------------------------------------"
echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "Backend:  ${GREEN}http://localhost:8000/docs${NC}"
echo "------------------------------------------------"

# Function to kill processes on exit
cleanup() {
    echo -e "\n${YELLOW}Shutting down servers...${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit
}

trap cleanup SIGINT EXIT

# Start Backend
echo "Starting Backend (Uvicorn)..."
(cd backend && python3 -m uvicorn main:app --reload --port 8000) &
BACKEND_PID=$!

# Wait for backend to be ready (naive check)
sleep 2

# Start Frontend
echo "Starting Frontend (Next.js)..."
npm run dev &
FRONTEND_PID=$!

# Wait forever
wait
