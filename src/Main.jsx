import { useState, useMemo, useRef } from 'react'

export default function Main() {
    const [genresInput, setGenresInput] = useState('')
    const [likedBooksInput, setLikedBooksInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')
    const [recommendations, setRecommendations] = useState([])
    const recommendationsRef = useRef(null)
  
    const preferredGenres = useMemo(() => genresInput.split(',').map((g) => g.trim()).filter(Boolean), [genresInput])
    const likedBooks = useMemo(() => likedBooksInput.split('\n').map((b) => b.trim()).filter(Boolean), [likedBooksInput])
  
    async function handleSubmit(event) {
      event.preventDefault()
      setErrorMessage('')
      setIsLoading(true)
      setRecommendations([])
      try {
        const response = await fetch('/api/recommend', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ genres: preferredGenres, likedBooks })
        })
        if (!response.ok) {
          const text = await response.text()
          throw new Error(text || 'Request failed')
        }
        const data = await response.json()
        const newRecommendations = Array.isArray(data.recommendations) ? data.recommendations : []
        setRecommendations(newRecommendations)
        
        // Auto-scroll to recommendations after a short delay
        if (newRecommendations.length > 0) {
          setTimeout(() => {
            recommendationsRef.current?.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'start' 
            })
          }, 100)
        }
      } catch (error) {
        setErrorMessage(error.message || 'Something went wrong')
      } finally {
        setIsLoading(false)
      }
    }
  
  return (
        <main className="app-main">
        <form onSubmit={handleSubmit} className="recommendation-form">
        <div className="form-group">
            <label>
            <span className="label-text">🎭 Preferred Genres</span>
            <input
                type="text"
                placeholder="e.g. Fantasy, Mystery, Sci-Fi, Romance"
                value={genresInput}
                onChange={(e) => setGenresInput(e.target.value)}
                className="form-input"
            />
            </label>
        </div>

        <div className="form-group">
            <label>
            <span className="label-text">❤️ Books You Loved</span>
            <textarea
                placeholder={"e.g.\nPride and Prejudice — Jane Austen\nThe Silent Patient — Alex Michaelides\nEndless Night — Agatha Christie"}
                rows={5}
                value={likedBooksInput}
                onChange={(e) => setLikedBooksInput(e.target.value)}
                className="form-textarea"
            />
            </label>
        </div>

        <button 
            type="submit" 
            disabled={isLoading || preferredGenres.length === 0}
            className="submit-button"
        >
            {isLoading ? (
            <span className="loading-spinner">⏳ Finding recommendations...</span>
            ) : (
            <span>🚀 Get Recommendations</span>
            )}
        </button>
        </form>

        {errorMessage && (
        <div className="error-message">
            <span className="error-icon">⚠️</span>
            {errorMessage}
        </div>
        )}

        {recommendations.length > 0 && (
        <div className="recommendations-section" ref={recommendationsRef}>
            <h2 className="recommendations-title">
            <span className="title-icon">✨</span>
            Your Personalized Recommendations
            </h2>
            <div className="recommendations-grid">
            {recommendations.map((rec, index) => (
                <div key={index} className="book-card">
                <div className="book-number">{index + 1}</div>
                <div className="book-info">
                    <h3 className="book-title">{rec}</h3>
                </div>
                </div>
            ))}
            </div>
        </div>
        )}
    </main>
  )
}