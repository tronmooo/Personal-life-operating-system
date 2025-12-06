// Quick test of action generation logic

function generateActionSuggestions(journalText, insight) {
  const lower = journalText.toLowerCase()
  const insightLower = insight.toLowerCase()
  const actions = []
  
  console.log('🔍 Analyzing:', { journalText, insight })
  
  // Stress/Overwhelm
  if (lower.includes('stress') || lower.includes('overwhelm') || insightLower.includes('stress')) {
    console.log('✅ Detected: Stress')
    actions.push('🧘 Take 3 deep breaths - inhale for 4, hold for 4, exhale for 6')
    actions.push('📝 Write down just ONE task to tackle today')
    actions.push('🚶 Step away for a 5-minute walk outside')
  }
  
  // Anxiety/Worry
  if (lower.includes('anxious') || lower.includes('anxiety') || lower.includes('worry') || insightLower.includes('anxiety')) {
    console.log('✅ Detected: Anxiety')
    actions.push('🎯 Practice 5-4-3-2-1 grounding')
    actions.push('✍️ Challenge one anxious thought')
    actions.push('📱 Set a "worry time" for later')
  }
  
  // Sleep
  if (lower.includes('sleep') || lower.includes('tired') || lower.includes('exhausted') || insightLower.includes('sleep')) {
    console.log('✅ Detected: Sleep issues')
    actions.push('😴 Set a bedtime alarm')
    actions.push('📵 Put phone in another room')
    actions.push('🛁 Create a wind-down routine')
  }
  
  // Default
  if (actions.length === 0) {
    console.log('⚠️ No themes detected, using defaults')
    actions.push('🧘 Try a 5-minute guided meditation or breathing exercise')
    actions.push('📖 Continue journaling - write for 5 more minutes')
    actions.push('🌱 Name one thing you\'re grateful for today')
  }
  
  return actions.slice(0, 4)
}

// Test cases
console.log('\n=== TEST 1: Stress ===')
const test1 = generateActionSuggestions('I am so stressed about work', 'You seem stressed')
console.log('Actions:', test1)

console.log('\n=== TEST 2: Anxiety ===')
const test2 = generateActionSuggestions('I feel anxious and worried', 'Your anxiety is valid')
console.log('Actions:', test2)

console.log('\n=== TEST 3: Sleep ===')
const test3 = generateActionSuggestions('I am exhausted and cant sleep', 'Sleep is important')
console.log('Actions:', test3)

console.log('\n=== TEST 4: Generic ===')
const test4 = generateActionSuggestions('Just writing my thoughts', 'Thank you for sharing')
console.log('Actions:', test4)

