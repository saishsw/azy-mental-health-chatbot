import Head from 'next/head'
import Link from 'next/link'
import { track } from '@vercel/analytics'
import { useEffect } from 'react'

export default function Portal() {

  useEffect(() => {
    track('page_view', {
      page: 'portal_home',
      timestamp: new Date().toISOString()
    })
  }, [])

  return (
    <>
      <Head>
        <title>AZY Mental - Portal</title>
        <meta name="description" content="Arizona-focused mental health support and research portal" />
      </Head>

      <div className="min-h-screen bg-beige-100 flex flex-col font-sans">
        <header className="bg-white shadow-sm border-b border-beige-300">
          <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-beige-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg font-serif">AZY</span>
              </div>
              <span className="text-xl font-bold text-beige-800 font-serif italic">AZY Mental Health</span>
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl mx-auto px-6 py-16 w-full">
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl font-serif font-bold text-beige-900 mb-6">
              How can we support you today?
            </h1>
            <p className="text-xl text-beige-700 max-w-2xl mx-auto">
              Access empathetic AI support or explore the latest peer-reviewed mental health research.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Chatbot Card */}
            <Link href="/chat"
              onClick={() => track('portal_select', { option: 'chat' })}
              className="group bg-white rounded-3xl p-8 border border-beige-200 shadow-sm hover:shadow-xl transition-all hover:border-beige-400 flex flex-col items-center text-center cursor-pointer transform hover:-translate-y-1">
              <div className="w-20 h-20 bg-beige-100 rounded-full flex items-center justify-center mb-6 group-hover:bg-beige-200 transition-colors">
                <span className="text-4xl">💬</span>
              </div>
              <h2 className="text-2xl font-bold font-serif text-beige-900 mb-3">AI Support Chat</h2>
              <p className="text-beige-600 leading-relaxed mb-6">
                Chat with our empathetic AI assistant specifically trained on Arizona mental health resources, clinics, and crisis protocols.
              </p>
              <span className="mt-auto px-6 py-2 bg-beige-600 text-white rounded-full text-sm font-medium group-hover:bg-beige-700 transition-colors">
                Start Chatting →
              </span>
            </Link>

            {/* Research Card */}
            <Link href="/research"
              onClick={() => track('portal_select', { option: 'research' })}
              className="group bg-white rounded-3xl p-8 border border-beige-200 shadow-sm hover:shadow-xl transition-all hover:border-beige-400 flex flex-col items-center text-center cursor-pointer transform hover:-translate-y-1">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:bg-blue-100 transition-colors">
                <span className="text-4xl">🔬</span>
              </div>
              <h2 className="text-2xl font-bold font-serif text-beige-900 mb-3">Research Hub</h2>
              <p className="text-beige-600 leading-relaxed mb-6">
                Search and analyze peer-reviewed mental health articles with AI-powered quality assessments and method analyis.
              </p>
              <span className="mt-auto px-6 py-2 bg-blue-600 text-white rounded-full text-sm font-medium group-hover:bg-blue-700 transition-colors">
                Find Research →
              </span>
            </Link>
          </div>
        </main>

        <footer className="bg-white border-t border-beige-200 py-8 text-center text-beige-500 text-sm">
          <p>Crisis? Call 988 or Text HOME to 741741</p>
        </footer>
      </div>
    </>
  )
}
