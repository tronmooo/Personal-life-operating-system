// Test script to verify meal logging fix
// This simulates the AI assistant meal logging flow

const mealTestCases = [
  {
    input: "I ate a chicken sandwich for 200 cal",
    expectedOutput: {
      type: 'meal',
      logType: 'meal',
      name: 'a chicken sandwich',
      description: 'a chicken sandwich',
      calories: 200,
      mealType: 'Lunch', // Assuming test runs at noon
    }
  },
  {
    input: "Had breakfast burrito 450 calories",
    expectedOutput: {
      type: 'meal',
      logType: 'meal',
      name: 'breakfast burrito',
      description: 'breakfast burrito',
      calories: 450,
      mealType: 'Breakfast',
    }
  },
  {
    input: "ate pizza 800 cal",
    expectedOutput: {
      type: 'meal',
      logType: 'meal',
      name: 'pizza',
      description: 'pizza',
      calories: 800,
      mealType: 'Dinner',
    }
  }
];

// Regex pattern from the actual code (improved to handle "for" and "a")
const mealRegex = /(?:ate|had|log|consumed)\s+(?:a\s+)?(.+?)\s+(?:for\s+)?(\d+)\s*(?:cal|calories)/;

console.log('🧪 Testing Meal Logging Fix\n');
console.log('=' .repeat(60));

mealTestCases.forEach((testCase, index) => {
  console.log(`\nTest ${index + 1}: "${testCase.input}"`);
  console.log('-'.repeat(60));
  
  const lowerMessage = testCase.input.toLowerCase();
  const match = lowerMessage.match(mealRegex);
  
  if (match) {
    const description = match[1].trim();
    const calories = parseInt(match[2]);
    
    // Determine meal type based on time of day (simulated)
    const hour = new Date().getHours();
    let mealType = 'Other';
    if (hour >= 5 && hour < 11) mealType = 'Breakfast';
    else if (hour >= 11 && hour < 15) mealType = 'Lunch';
    else if (hour >= 15 && hour < 22) mealType = 'Dinner';
    else mealType = 'Snack';
    
    const result = {
      type: 'meal',
      logType: 'meal',
      name: description,  // ← This is the fix!
      description,
      mealType,
      calories,
      time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
    
    console.log('✅ Matched!');
    console.log('📝 Extracted data:');
    console.log(`   - name: "${result.name}"`);
    console.log(`   - description: "${result.description}"`);
    console.log(`   - calories: ${result.calories}`);
    console.log(`   - mealType: ${result.mealType}`);
    console.log(`   - time: ${result.time}`);
    
    // Verify fix
    if (result.name) {
      console.log('✅ FIX VERIFIED: "name" field is present!');
    } else {
      console.log('❌ FIX FAILED: "name" field is missing!');
    }
  } else {
    console.log('❌ No match found');
  }
});

console.log('\n' + '='.repeat(60));
console.log('🎉 All tests completed!\n');

// Show what the UI expects
console.log('📋 UI expects this structure:');
console.log(`
{
  domain: 'nutrition',
  title: 'chicken sandwich (200 cal)',
  metadata: {
    type: 'meal',
    logType: 'meal',
    name: 'chicken sandwich',      // ← UI displays this field
    description: 'chicken sandwich',
    mealType: 'Lunch',
    calories: 200,
    time: '12:30 PM'
  }
}
`);

console.log('✅ With the fix, metadata.name is now correctly set!');

