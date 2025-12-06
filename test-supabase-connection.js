// Test script to verify Supabase connection
// Run with: node test-supabase-connection.js

const fs = require('fs');
const path = require('path');

// Read .env.local file
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse environment variables
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('\n🔍 Supabase Configuration Test\n');
console.log('=' .repeat(50));

const url = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const key = envVars['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

console.log('\n1. Environment Variables:');
console.log('   NEXT_PUBLIC_SUPABASE_URL:', url ? '✓ Found' : '✗ Missing');
console.log('   Value:', url || 'N/A');
console.log('\n   NEXT_PUBLIC_SUPABASE_ANON_KEY:', key ? '✓ Found' : '✗ Missing');
console.log('   Value:', key ? `${key.substring(0, 30)}...` : 'N/A');

// Check for placeholder values
const looksPlaceholder = (value) => {
  if (!value) return true;
  const lower = value.toLowerCase();
  return (
    lower.includes('your-project-id') ||
    lower.includes('your-anon-key') ||
    lower.includes('placeholder') ||
    lower.includes('dummy')
  );
};

console.log('\n2. Placeholder Check:');
console.log('   URL is placeholder:', looksPlaceholder(url) ? '✗ YES (will fail)' : '✓ NO (good)');
console.log('   Key is placeholder:', looksPlaceholder(key) ? '✗ YES (will fail)' : '✓ NO (good)');

console.log('\n3. Supabase Client Status:');
const isConfigured = !!(url && key && !looksPlaceholder(url) && !looksPlaceholder(key));
console.log('   Is Configured:', isConfigured ? '✓ YES' : '✗ NO');

if (isConfigured) {
  console.log('\n✅ Supabase is properly configured!');
  console.log('\nIf you still see warnings in the browser:');
  console.log('   1. Make sure the dev server is restarted: npm run dev');
  console.log('   2. Clear browser cache (Ctrl/Cmd + Shift + R)');
  console.log('   3. Check browser console for any errors');
} else {
  console.log('\n❌ Supabase configuration has issues!');
  console.log('\nPossible fixes:');
  console.log('   1. Check .env.local file exists in project root');
  console.log('   2. Verify NEXT_PUBLIC_SUPABASE_URL is not a placeholder');
  console.log('   3. Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is not a placeholder');
  console.log('   4. Restart dev server after making changes');
}

console.log('\n' + '='.repeat(50) + '\n');

// Test connection to Supabase
if (isConfigured) {
  console.log('4. Testing Connection to Supabase...\n');
  
  fetch(`${url}/rest/v1/`, {
    method: 'HEAD',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`
    }
  })
    .then(response => {
      if (response.ok || response.status === 401) {
        console.log('   ✓ Successfully connected to Supabase!');
        console.log('   Status:', response.status);
        console.log('   (401 is normal for unauthenticated requests)');
      } else {
        console.log('   ✗ Connection issue');
        console.log('   Status:', response.status);
      }
    })
    .catch(error => {
      console.log('   ✗ Connection failed:', error.message);
    });
}












