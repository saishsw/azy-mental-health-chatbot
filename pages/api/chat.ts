import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { message, session_id } = req.body

    if (!message) {
      return res.status(400).json({ message: 'Message is required' })
    }

    // Get backend URL from environment variables
    const backendUrl = process.env.BACKEND_URL || 'https://azy-mental-health-chatbot.onrender.com'

    console.log('Backend URL:', backendUrl)
    console.log('Attempting to connect to:', `${backendUrl}/chat`)

    // FIX: Handle cold start issue by making two requests and returning the second
    // The first request wakes up the service, the second request gets the actual response
    let response;
    let isFirstRequest = true;

    try {
      // First request - this may fail due to cold start but will wake up the service
      console.log('Making first request to wake up service...')
      await axios.post(`${backendUrl}/chat`, {
        message,
        session_id
      }, {
        timeout: 20000, // Increased to 20s
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('First request succeeded')
    } catch (firstError: any) {
      console.log('First request failed (expected for cold start):', firstError.message)
      // This is expected for cold starts, continue to second request
    }

    // Second request - this should work now that service is awake
    console.log('Making second request for actual response...')
    response = await axios.post(`${backendUrl}/chat`, {
      message,
      session_id
    }, {
      timeout: 60000, // Increased to 60s (Render free tier can take a while)
      headers: {
        'Content-Type': 'application/json'
      }
    })

    console.log('Second request succeeded')
    // Return the response from the second request
    res.status(200).json(response.data)

  } catch (error: any) {
    console.error('Error in chat API:', error)

    if (error.response) {
      // Backend error
      res.status(error.response.status).json(error.response.data)
    } else if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      // Connection error
      res.status(500).json({
        message: 'Unable to connect to backend service. Please try again later.',
        error: 'Connection failed'
      })
    } else {
      // Network or other error
      res.status(500).json({
        message: 'I\'m having trouble connecting right now. Please try again or contact Arizona Crisis Response Network at 1-800-631-1314 for immediate support.',
        error: error.message
      })
    }
  }
}
