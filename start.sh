#!/bin/bash

# AZY Mental Chatbot Startup Script

echo "🚀 Starting AZY Mental Chatbot..."

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Please copy env.example to .env and configure your settings."
    echo "   cp env.example .env"
    exit 1
fi

# Check if OpenAI API key is set
if ! grep -q "OPENAI_API_KEY=your_openai_api_key_here" .env; then
    echo "✅ Environment file configured"
else
    echo "⚠️  Please set your OpenAI API key in .env file"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start backend in background
echo "🐍 Starting FastAPI backend..."
cd backend
python main.py &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "⚛️  Starting Next.js frontend..."
npm run dev

# Cleanup function
cleanup() {
    echo "🛑 Shutting down services..."
    kill $BACKEND_PID 2>/dev/null
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Wait for background processes
wait
