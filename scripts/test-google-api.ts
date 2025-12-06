
import fs from 'fs';
import path from 'path';

// Manually load .env.local BEFORE importing anything else
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
      process.env[key] = value;
    }
  });
} else {
    console.error('❌ .env.local file not found!');
}

async function testBusinessSearch() {
  console.log('🧪 Testing Business Search...');
  
  // Dynamic import to ensure env is loaded first
  const { businessSearch } = await import('../lib/services/business-search');

  // Print masked key for verification
  const key = process.env.GOOGLE_PLACES_API_KEY;
  if (key) {
    console.log(`🔑 API Key loaded: ${key.substring(0, 5)}...${key.substring(key.length - 4)}`);
  } else {
    console.error('❌ No GOOGLE_PLACES_API_KEY found in .env.local');
  }

  try {
    // 1. Test Geocoding
    const address = '1600 Amphitheatre Parkway, Mountain View, CA';
    console.log(`\n📍 Geocoding address: ${address}`);
    const location = await businessSearch.geocode(address);
    
    if (!location) {
      console.error('❌ Geocoding failed - Check API Key and Billing');
    } else {
      console.log('✅ Geocoding successful:', location);
    }

    // 2. Test Search (use manual location if geocode failed)
    const testLocation = location || { latitude: 37.422, longitude: -122.084 };
    const query = 'Pizza';
    
    console.log(`\n🔍 Searching for "${query}" near ${testLocation.latitude}, ${testLocation.longitude}...`);
    const businesses = await businessSearch.searchBusinesses(query, testLocation, {
      maxResults: 3,
      radius: 5
    });

    if (businesses.length === 0) {
      console.log('⚠️ No businesses found. This might be valid, or API issue.');
    } else {
      console.log(`✅ Found ${businesses.length} businesses:`);
      businesses.forEach(b => {
        const dist = b.distance ? `${b.distance.toFixed(2)} miles` : 'Unknown distance';
        console.log(`   - ${b.name} (${dist})`);
      });
    }

  } catch (error: any) {
    console.error('\n❌ Test Failed:', error.message);
    console.error(error);
  }
}

testBusinessSearch();
