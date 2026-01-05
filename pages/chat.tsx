import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'
import Head from 'next/head'
import axios from 'axios'
import { track } from '@vercel/analytics'

interface Message {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  isCrisis?: boolean
}

interface ChatResponse {
  response: string
  session_id: string
  is_crisis: boolean
  resources?: Array<{
    name: string
    number?: string
    description?: string
    location?: string
    phone?: string
    services?: string
  }>
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>('')
  const [isClient, setIsClient] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Fix hydration issues
  useEffect(() => {
    setIsClient(true)

    // Track page view
    track('page_view', {
      page: 'chatbot_home',
      timestamp: new Date().toISOString()
    })

    // Add initial message only on client side
    setMessages([
      {
        id: '1',
        text: "Hello! I'm AZY Mental, your Arizona-focused mental health support assistant. I'm here to help you find local resources and provide support. How can I help you today?",
        isUser: false,
        timestamp: new Date(),
      }
    ])

    // Warm up the backend service on page load to prevent first query errors
    const warmUpBackend = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://azy-mental-health-chatbot.onrender.com'
        await axios.get(`${backendUrl}/health`, { timeout: 10000 })
        console.log('Backend service warmed up successfully')
      } catch (error) {
        console.log('Backend warm-up failed (this is normal for cold starts):', error)
      }
    }

    warmUpBackend()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    if (isClient) {
      scrollToBottom()

      // Track session start
      track('session_started', {
        session_id: sessionId || 'new_session',
        timestamp: new Date().toISOString()
      })
    }
  }, [messages, isClient, sessionId])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    // Track message sent
    track('chat_message_sent', {
      message_length: inputMessage.length,
      timestamp: new Date().toISOString()
    })

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputMessage,
      isUser: true,
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)

    try {
      // Using API route instead of direct backend connection
      const response = await axios.post<ChatResponse>(
        '/api/chat',
        {
          message: inputMessage,
          session_id: sessionId,
        }
      )

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response.data.response,
        isUser: false,
        timestamp: new Date(),
        isCrisis: response.data.is_crisis,
      }

      setMessages(prev => [...prev, botMessage])
      setSessionId(response.data.session_id)

      // Track bot response
      track('chat_bot_response', {
        response_length: response.data.response.length,
        is_crisis: response.data.is_crisis,
        session_id: response.data.session_id
      })

      // If it's a crisis response, show resources
      if (response.data.is_crisis && response.data.resources) {
        // Track crisis detection
        track('crisis_detected', {
          trigger_message: inputMessage,
          resources_provided: response.data.resources.length,
          session_id: response.data.session_id
        })

        const resourcesMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: formatResources(response.data.resources),
          isUser: false,
          timestamp: new Date(),
          isCrisis: true,
        }
        setMessages(prev => [...prev, resourcesMessage])
      }

    } catch (error) {
      console.error('Error sending message:', error)

      // Track error
      track('chat_error', {
        error_type: 'api_error',
        message: inputMessage,
        session_id: sessionId
      })

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please try again or contact Arizona Crisis Response Network at 1-800-631-1314 for immediate support.",
        isUser: false,
        timestamp: new Date(),
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const formatResources = (resources: any[]) => {
    return resources.map(resource => {
      let text = `**${resource.name}**`
      if (resource.number) text += `\n📞 ${resource.number}`
      if (resource.phone) text += `\n📞 ${resource.phone}`
      if (resource.description) text += `\n${resource.description}`
      if (resource.location) text += `\n📍 ${resource.location}`
      if (resource.services) text += `\n💼 ${resource.services}`
      return text
    }).join('\n\n')
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()

      // Track keyboard interaction
      track('keyboard_interaction', {
        key: 'Enter',
        action: 'send_message',
        timestamp: new Date().toISOString()
      })

      sendMessage()
    }
  }

  // Track message formatting performance
  const formatMessage = (text: string) => {
    const startTime = performance.now()

    // Convert markdown-style formatting to HTML
    const result = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />')

    const endTime = performance.now()

    // Track formatting performance
    track('message_formatting_performance', {
      text_length: text.length,
      processing_time: endTime - startTime,
      timestamp: new Date().toISOString()
    })

    return result
  }

  // Track when user focuses on input
  const handleInputFocus = () => {
    track('input_focused', {
      timestamp: new Date().toISOString(),
      session_id: sessionId
    })
  }

  // Don't render until client-side hydration is complete
  if (!isClient) {
    return (
      <div className="min-h-screen bg-beige-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-beige-600 mx-auto"></div>
          <p className="mt-4 text-beige-700 font-serif">Loading AZY Mental...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>AZY Mental - Arizona Mental Health Support</title>
        <meta name="description" content="Arizona-focused mental health support chatbot with crisis intervention" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link href="https://fonts.googleapis.com/css2?family=Georgia:ital,wght@0,400;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet" />
      </Head>

      <div className="min-h-screen bg-beige-100">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-beige-300">
          <div className="max-w-4xl mx-auto px-6 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/" className="w-12 h-12 bg-beige-600 rounded-full flex items-center justify-center hover:opacity-90 transition-opacity">
                  <span className="text-white font-bold text-lg font-serif">AZY</span>
                </Link>
                <div>
                  <h1 className="text-2xl font-bold text-beige-700 font-serif italic">AZY Mental Chat</h1>
                  <p className="text-sm text-beige-600 font-sans">Arizona Mental Health Support</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link href="/research" className="text-beige-600 hover:text-beige-800 font-medium font-sans px-3 py-2 rounded-lg hover:bg-beige-50 transition-colors">
                  Research Hub
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-600 rounded-full"></div>
                  <span className="text-sm text-beige-600 font-sans">Active</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Container */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-3xl shadow-lg overflow-hidden border border-beige-300">
            {/* Messages Area */}
            <div className="h-[500px] overflow-y-auto p-8 space-y-6">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-6 py-4 rounded-2xl ${message.isUser
                      ? 'bg-beige-600 text-white'
                      : message.isCrisis
                        ? 'bg-red-50 border-2 border-red-200 text-red-800'
                        : 'bg-beige-50 text-beige-700 border border-beige-200'
                      } ${message.isCrisis ? 'crisis-alert' : 'chat-message'}`}
                  >
                    <div
                      className="text-sm leading-relaxed font-sans"
                      dangerouslySetInnerHTML={{
                        __html: formatMessage(message.text)
                      }}
                    />
                    <div className={`text-xs mt-3 ${message.isUser ? 'text-beige-300' : 'text-beige-500'
                      } font-sans`}>
                      {message.timestamp.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-beige-50 text-beige-700 px-6 py-4 rounded-2xl border border-beige-200">
                    <div className="flex items-center space-x-3">
                      <div className="spinner w-5 h-5 border-2 border-beige-300 border-t-beige-600 rounded-full"></div>
                      <span className="text-sm font-sans">AZY is typing...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="border-t border-beige-300 p-6 bg-beige-50">
              <div className="flex space-x-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  onFocus={handleInputFocus}
                  placeholder="Type your message here..."
                  className="flex-1 px-6 py-4 border border-beige-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-beige-600 focus:border-transparent message-input bg-white text-beige-700 placeholder-beige-500 font-sans"
                  disabled={isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!inputMessage.trim() || isLoading}
                  className="px-8 py-4 bg-beige-600 text-white rounded-2xl hover:bg-beige-700 focus:outline-none focus:ring-2 focus:ring-beige-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-sans font-medium"
                >
                  Send
                </button>
              </div>

              {/* Safety Notice */}
              <div className="mt-4 text-xs text-beige-600 text-center font-sans">
                💙 This is a support tool, not a replacement for professional mental health care.
                If you're in crisis, please call 988 or text HOME to 741741.
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .spinner {
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .crisis-alert {
          animation: pulse 2s infinite;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.8; }
        }
        
        .chat-message {
          transition: all 0.3s ease;
        }
        
        .message-input::placeholder {
          color: #A0522D;
          opacity: 0.7;
        }
      `}</style>
    </>
  )
}
