/**
 * Robust JSON parser for OpenAI responses
 * Handles markdown code blocks and other formatting
 */

export function parseAIResponse(text: string): any {
  // Remove markdown code blocks
  let cleaned = text.trim()
  
  // Remove ```json at start and ``` at end
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.substring(7)
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.substring(3)
  }
  
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.substring(0, cleaned.length - 3)
  }
  
  cleaned = cleaned.trim()
  
  try {
    return JSON.parse(cleaned)
  } catch (error) {
    // Try to find JSON object in the text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }
    throw error
  }
}






























