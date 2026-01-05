#!/usr/bin/env python3
"""
Test script for AZY Mental Chatbot crisis detection functionality.
This script demonstrates how the trigger word detection works.
"""

import requests
import json
import time

# Configuration
BACKEND_URL = "http://localhost:8000"

def test_chat_endpoint(message, session_id=None):
    """Test the chat endpoint with a given message."""
    try:
        response = requests.post(
            f"{BACKEND_URL}/chat",
            json={
                "message": message,
                "session_id": session_id
            },
            headers={"Content-Type": "application/json"}
        )
        
        if response.status_code == 200:
            return response.json()
        else:
            print(f"Error: {response.status_code} - {response.text}")
            return None
            
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to backend. Make sure the FastAPI server is running.")
        return None
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return None

def test_crisis_detection():
    """Test various crisis scenarios."""
    print("🧪 Testing AZY Mental Chatbot Crisis Detection")
    print("=" * 50)
    
    # Test cases for crisis detection
    crisis_test_cases = [
        "I'm thinking about suicide",
        "I want to kill myself",
        "I'm planning to end my life",
        "I've been cutting myself",
        "I want to hurt myself",
        "I'm hearing voices",
        "I'm having hallucinations",
        "I'm in a depression crisis",
        "I can't take it anymore",
        "I'm planning to overdose"
    ]
    
    # Test cases for normal conversation
    normal_test_cases = [
        "I'm feeling a bit sad today",
        "I need help finding a therapist in Phoenix",
        "What mental health resources are available in Arizona?",
        "I'm feeling anxious about work",
        "Can you recommend support groups in Tucson?"
    ]
    
    print("\n🚨 TESTING CRISIS DETECTION:")
    print("-" * 30)
    
    for i, message in enumerate(crisis_test_cases, 1):
        print(f"\n{i}. Testing: '{message}'")
        result = test_chat_endpoint(message)
        
        if result:
            if result.get("is_crisis"):
                print("✅ CRISIS DETECTED - System correctly identified crisis")
                print(f"   Response: {result['response'][:100]}...")
            else:
                print("❌ CRISIS NOT DETECTED - This should have triggered crisis response")
        else:
            print("❌ Failed to get response")
        
        time.sleep(1)  # Small delay between requests
    
    print("\n💬 TESTING NORMAL CONVERSATION:")
    print("-" * 35)
    
    for i, message in enumerate(normal_test_cases, 1):
        print(f"\n{i}. Testing: '{message}'")
        result = test_chat_endpoint(message)
        
        if result:
            if not result.get("is_crisis"):
                print("✅ NORMAL RESPONSE - System correctly handled normal conversation")
                print(f"   Response: {result['response'][:100]}...")
            else:
                print("❌ FALSE POSITIVE - This should not have triggered crisis response")
        else:
            print("❌ Failed to get response")
        
        time.sleep(1)  # Small delay between requests

def test_resources_endpoint():
    """Test the resources endpoint."""
    print("\n📚 TESTING RESOURCES ENDPOINT:")
    print("-" * 30)
    
    try:
        response = requests.get(f"{BACKEND_URL}/resources")
        if response.status_code == 200:
            resources = response.json()
            print(f"✅ Successfully retrieved {len(resources.get('resources', []))} resources")
            
            # Show a few examples
            for i, resource in enumerate(resources.get('resources', [])[:3]):
                print(f"   {i+1}. {resource.get('name', 'Unknown')}")
        else:
            print(f"❌ Error: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def test_health_endpoint():
    """Test the health endpoint."""
    print("\n🏥 TESTING HEALTH ENDPOINT:")
    print("-" * 25)
    
    try:
        response = requests.get(f"{BACKEND_URL}/health")
        if response.status_code == 200:
            health = response.json()
            print(f"✅ Health check passed: {health}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Error: {str(e)}")

def main():
    """Main test function."""
    print("🚀 AZY Mental Chatbot - Crisis Detection Test Suite")
    print("=" * 55)
    
    # Test health endpoint first
    test_health_endpoint()
    
    # Test resources endpoint
    test_resources_endpoint()
    
    # Test crisis detection
    test_crisis_detection()
    
    print("\n" + "=" * 55)
    print("✅ Test suite completed!")
    print("\n💡 To run the full application:")
    print("   1. Start the backend: cd backend && python main.py")
    print("   2. Start the frontend: npm run dev")
    print("   3. Open http://localhost:3000 in your browser")

if __name__ == "__main__":
    main()
