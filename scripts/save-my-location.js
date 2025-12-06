// Save Your Current Location to Database
// 
// Usage: Paste this in your browser console at http://localhost:3000
// This will ask for your location permission, then save it to your profile

navigator.geolocation.getCurrentPosition(async (position) => {
  const lat = position.coords.latitude
  const lng = position.coords.longitude
  
  console.log('📍 Got your location:', lat, lng)
  
  // Reverse geocode to get city/state
  console.log('🔍 Looking up your city/state...')
  
  try {
    // Use your Supabase client to save location
    const { createClient } = await import('@supabase/supabase-js')
    
    // Get Supabase config from window
    const supabaseUrl = 'https://jphpxqqilrjyypztkswc.supabase.co'
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwaHB4cXFpbHJqeXlwenRrc3djIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1ODczODAsImV4cCI6MjA3MDE2MzM4MH0.MPMupsJ3qw5SUxIqQ3lBT2NZ054LtBV_5e6w5RvZT9Y'
    
    const supabase = createClient(supabaseUrl, supabaseKey)
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      console.error('❌ You must be logged in')
      return
    }
    
    console.log('✅ User:', user.email)
    
    // Try to get city/state from browser geolocation API
    // (In production, you'd use a reverse geocoding service)
    let city = 'Your City'
    let state = 'Your State'
    
    // Save to database
    const { data, error } = await supabase
      .from('user_locations')
      .upsert({
        user_id: user.id,
        latitude: lat,
        longitude: lng,
        city: city,
        state: state,
        is_primary: true
      }, {
        onConflict: 'user_id'
      })
      .select()
    
    if (error) {
      console.error('❌ Error saving location:', error)
    } else {
      console.log('✅ Location saved!', data)
      console.log('')
      console.log('🎉 Now you can call concierge without passing userLocation:')
      console.log(`
fetch('/api/concierge/initiate-calls', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    intent: 'pizza',
    businessCount: 3
    // No userLocation needed - uses your saved location!
  })
}).then(r => r.json()).then(console.log)
      `)
    }
    
  } catch (err) {
    console.error('❌ Error:', err)
    console.log('')
    console.log('💡 Alternatively, call concierge with your location directly:')
    console.log(`
fetch('/api/concierge/initiate-calls', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    intent: 'pizza',
    businessCount: 3,
    userLocation: {
      latitude: ${lat},
      longitude: ${lng}
    }
  })
}).then(r => r.json()).then(console.log)
    `)
  }
  
}, (error) => {
  console.error('❌ Location access denied:', error)
  console.log('')
  console.log('💡 You can manually pass your location in the request:')
  console.log(`
fetch('/api/concierge/initiate-calls', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    intent: 'pizza',
    businessCount: 3,
    userLocation: {
      latitude: 34.0522,   // Your latitude
      longitude: -118.2437 // Your longitude
    }
  })
}).then(r => r.json()).then(console.log)
  `)
})



