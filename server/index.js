import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import Anthropic from '@anthropic-ai/sdk'

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const port = Number(process.env.PORT || 8787)

const anthropicApiKey = process.env.ANTHROPIC_API_KEY || ''
const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null
const claudeModel = process.env.CLAUDE_MODEL || 'claude-3-5-haiku-20241022'

function buildPrompt(genres, likedBooks) {
  const genreList = genres && genres.length ? genres.join(', ') : 'N/A'
  const likedList = likedBooks && likedBooks.length ? likedBooks.map((b, i) => `${i + 1}. ${b}`).join('\n') : 'N/A'
  return [
    'You are a helpful literary recommendation assistant.',
    'Given the user\'s preferred genres and a list of books they liked, suggest 5-10 new book recommendations.',
    'Return ONLY a JSON array of strings where each string is a recommendation formatted as "Title — Author".',
    'Do not include any explanation or extra keys. Output must be valid JSON.',
    '',
    `Preferred genres: ${genreList}`,
    'Books the user liked:',
    likedList,
  ].join('\n')
}

app.post('/api/recommend', async (req, res) => {
  try {
    if (!anthropic) {
      return res.status(500).send('ANTHROPIC_API_KEY is not configured on the server')
    }

    const { genres = [], likedBooks = [] } = req.body || {}
    if (!Array.isArray(genres) || !Array.isArray(likedBooks)) {
      return res.status(400).send('Invalid payload. Expect { genres: string[], likedBooks: string[] }')
    }

    const prompt = buildPrompt(genres, likedBooks)

    const message = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: 1024,
      temperature: 0.7,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    })
    const content = message.content[0]?.text || '[]'
    console.log('Claude response:', content)

    let recommendations = []
    try {
      recommendations = JSON.parse(content)
    } catch {
      // Try to extract JSON array if wrapped in extra text
      const match = content.match(/\[[\s\S]*\]/)
      if (match) {
        try {
          recommendations = JSON.parse(match[0])
        } catch {
          recommendations = []
        }
      }
    }

    if (!Array.isArray(recommendations)) {
      recommendations = []
    }

    res.json({ recommendations })
  } catch (error) {
    console.error('Recommendation error:', error)
    res.status(500).send('Failed to generate recommendations')
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true })
})

app.listen(port, () => {
  console.log(`[server] listening on http://localhost:${port}`)
})