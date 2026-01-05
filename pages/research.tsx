import { useState } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import axios from 'axios'
import { track } from '@vercel/analytics'

interface Article {
    title: string
    date: string
    authors: string
    link: string
    description: string
    quality_score?: number
    quality_reasoning?: string
}

export default function Research() {
    const [query, setQuery] = useState('')
    const [articles, setArticles] = useState<Article[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    const handleSearch = async () => {
        if (!query.trim()) return

        setIsLoading(true)
        setHasSearched(true)

        track('research_search', {
            query: query,
            timestamp: new Date().toISOString()
        })

        try {
            const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://azy-mental-health-chatbot.onrender.com'
            // Use the new /research endpoint
            // Note: In development you might need to point to localhost:8000 if not using the proxy
            // For this codebase, it seems direct axios calls are common, or via /api/ proxy. 
            // I'll try the direct backend URL pattern established in index.tsx's warmup, 
            // but if there's a proxy in next.config.js (I saw one earlier), I should use /api/.
            // index.tsx uses /api/chat which implies a local API route that calls the backend. 
            // However, to keep it simple and avoid creating another Next.js API route, I'll call the backend directly 
            // if I can, OR I'll assume I need to create an API route. 
            // Actually, looking at index.tsx, it posts to '/api/chat'. 
            // Let's see if I should just call the backend directly to save time. 

            // Let's assume direct call for now using the same pattern as the warm-up, 
            // but usually CORS handles it. 
            // The warmUpBackend used `backendUrl`. 

            // But wait, the main chat uses `/api/chat`. 
            // I will implement a direct call to the backend for now to minimize files created.
            // If CORS issues arise, the user can configure it. (index.tsx warmUpBackend calls /health directly)

            const response = await axios.get(`${backendUrl}/research`, {
                params: { query }
            })

            setArticles(response.data.articles)

            track('research_results', {
                count: response.data.articles.length,
                query: query
            })

        } catch (error) {
            console.error('Error searching articles:', error)
            setArticles([])
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <>
            <Head>
                <title>Scholarly Research - AZY Mental</title>
                <meta name="description" content="Access peer-reviewed mental health research" />
            </Head>

            <div className="min-h-screen bg-beige-100 font-sans text-beige-700">
                <header className="bg-white shadow-sm border-b border-beige-300">
                    <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between">
                        <Link href="/" className="flex items-center space-x-3 text-beige-700 hover:text-beige-900 transition-colors">
                            <span className="text-2xl">←</span>
                            <span className="font-serif font-bold text-lg">Back to Portal</span>
                        </Link>
                        <h1 className="text-2xl font-bold font-serif italic text-beige-800">Research Hub</h1>
                    </div>
                </header>

                <main className="max-w-4xl mx-auto px-6 py-10">
                    <div className="bg-white rounded-3xl shadow-lg p-8 border border-beige-300">
                        <div className="text-center mb-10">
                            <h2 className="text-3xl font-serif font-bold mb-4 text-beige-800">Find Scholarly Articles</h2>
                            <p className="text-beige-600">
                                Search specifically for peer-reviewed mental health research from trusted sources.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 mb-10">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                placeholder="e.g., Anxiety treatments, Depression in adolescents..."
                                className="flex-1 px-6 py-4 border border-beige-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-beige-600 text-lg"
                            />
                            <button
                                onClick={handleSearch}
                                disabled={isLoading || !query.trim()}
                                className="px-8 py-4 bg-beige-600 text-white rounded-2xl hover:bg-beige-700 font-medium text-lg transition-all disabled:opacity-50"
                            >
                                {isLoading ? 'Searching...' : 'Find Research'}
                            </button>
                        </div>

                        <div className="space-y-6">
                            {isLoading && (
                                <div className="text-center py-10">
                                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-beige-600 mx-auto"></div>
                                </div>
                            )}

                            {!isLoading && hasSearched && articles.length === 0 && (
                                <div className="text-center py-10 text-beige-500">
                                    No articles found. Try a different search term.
                                </div>
                            )}

                            {articles.map((article, index) => (
                                <div key={index} className="bg-beige-50 p-6 rounded-2xl border border-beige-200 hover:shadow-md transition-shadow">
                                    <h3 className="text-xl font-bold mb-2 text-beige-800 font-serif">
                                        <a href={article.link} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                            {article.title}
                                        </a>
                                    </h3>
                                    <div className="text-sm text-beige-500 mb-3 flex flex-wrap gap-4">
                                        <span>✍️ {article.authors}</span>
                                        <span>📅 {article.date}</span>
                                    </div>
                                    <p className="mb-4 leading-relaxed text-beige-700">
                                        {article.description}
                                    </p>

                                    {/* Quality Rating Badge */}
                                    {article.quality_score !== undefined && (
                                        <div className={`mb-4 p-3 rounded-lg border flex items-start space-x-3 ${article.quality_score >= 80 ? 'bg-green-50 border-green-200' : article.quality_score >= 50 ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'}`}>
                                            <div className={`text-xl font-bold ${article.quality_score >= 80 ? 'text-green-700' : article.quality_score >= 50 ? 'text-yellow-700' : 'text-red-700'}`}>
                                                {article.quality_score >= 0 ? article.quality_score : 'N/A'}
                                            </div>
                                            <div>
                                                <div className="font-bold text-xs uppercase tracking-wide text-gray-500 mb-1">
                                                    Research Quality Score
                                                </div>
                                                <div className="text-sm text-gray-700">
                                                    {article.quality_reasoning}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <a
                                        href={article.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center text-beige-600 hover:text-beige-800 font-medium"
                                    >
                                        Read Full Article <span className="ml-1">→</span>
                                    </a>
                                </div>
                            ))}
                        </div>

                        {!isLoading && hasSearched && articles.length > 0 && (
                            <div className="mt-8 text-center">
                                <a
                                    href={`https://scholar.google.com/scholar?q=${encodeURIComponent(query)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-beige-500 hover:text-beige-700 text-sm underline"
                                >
                                    Find more results on Google Scholar
                                </a>
                            </div>
                        )}
                    </div>
                </main>
            </div>
        </>
    )
}
