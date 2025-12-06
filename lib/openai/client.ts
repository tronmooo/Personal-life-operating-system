import OpenAI from 'openai'

// Lazy-initialized OpenAI client to prevent build-time errors when env vars not set
let _openai: OpenAI | null = null

export function getOpenAI(): OpenAI {
  if (!_openai) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY is not set. Please configure your environment variables.')
    }
    _openai = new OpenAI({ apiKey })
  }
  return _openai
}

// Default export for convenience
export default getOpenAI

