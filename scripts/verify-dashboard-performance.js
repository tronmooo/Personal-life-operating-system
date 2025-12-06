#!/usr/bin/env node
/**
 * Dashboard Performance Verification Script
 * 
 * This script helps verify that the dashboard is performing within acceptable limits.
 * Run this in your browser console while on the dashboard page.
 * 
 * Usage:
 * 1. Open your app in Chrome/Firefox
 * 2. Navigate to the dashboard
 * 3. Open DevTools (F12)
 * 4. Go to Console tab
 * 5. Paste and run this script
 */

console.log('🔍 Starting Dashboard Performance Verification...\n');

// Performance verification
async function verifyDashboardPerformance() {
  const results = {
    queries: [],
    timing: {},
    passed: [],
    failed: [],
    warnings: []
  };

  console.log('📊 Step 1: Checking Network Requests...\n');
  
  // Instructions for manual verification
  console.log('%c=== MANUAL VERIFICATION STEPS ===', 'color: blue; font-size: 14px; font-weight: bold');
  console.log('');
  console.log('1️⃣  Go to the Network tab in DevTools');
  console.log('2️⃣  Filter by "Fetch/XHR"');
  console.log('3️⃣  Clear the network log (🚫 icon)');
  console.log('4️⃣  Refresh the page (Cmd+R or Ctrl+R)');
  console.log('5️⃣  Wait for the dashboard to fully load');
  console.log('');
  console.log('%c=== WHAT TO CHECK ===', 'color: orange; font-size: 14px; font-weight: bold');
  console.log('');
  console.log('✅ EXPECTED QUERIES (should see ~6 total):');
  console.log('   1. domain_entries_view (fetches ALL domains in ONE query)');
  console.log('   2. appliances (optional - if you have appliances)');
  console.log('   3. appliance_costs (optional - if you have appliances)');
  console.log('   4. appliance_warranties (optional - if you have appliances)');
  console.log('   5. vehicles (optional - if vehicles table exists)');
  console.log('   6. documents (expiring documents)');
  console.log('');
  console.log('%c❌ RED FLAGS (should NOT see):', 'color: red; font-size: 14px; font-weight: bold');
  console.log('   ❌ Multiple queries to domain_entries (should be only ONE)');
  console.log('   ❌ Separate queries for each domain (health, financial, vehicles, etc.)');
  console.log('   ❌ Queries repeating on every state change');
  console.log('   ❌ Total load time > 1 second');
  console.log('');

  // Check if Performance API is available
  if (window.performance && window.performance.getEntriesByType) {
    console.log('%c📈 Step 2: Performance Metrics', 'color: green; font-size: 14px; font-weight: bold');
    console.log('');

    // Get navigation timing
    const navTiming = performance.getEntriesByType('navigation')[0];
    if (navTiming) {
      const loadTime = navTiming.loadEventEnd - navTiming.fetchStart;
      const domContentLoaded = navTiming.domContentLoadedEventEnd - navTiming.fetchStart;
      const responseTime = navTiming.responseEnd - navTiming.requestStart;

      results.timing = {
        totalLoad: Math.round(loadTime),
        domContentLoaded: Math.round(domContentLoaded),
        responseTime: Math.round(responseTime)
      };

      console.log(`⏱️  Total Page Load Time: ${results.timing.totalLoad}ms`);
      console.log(`⚡ DOM Content Loaded: ${results.timing.domContentLoaded}ms`);
      console.log(`📡 Server Response Time: ${results.timing.responseTime}ms`);
      console.log('');

      // Evaluate timings
      if (results.timing.totalLoad < 800) {
        results.passed.push(`✅ Total load time (${results.timing.totalLoad}ms < 800ms target)`);
      } else if (results.timing.totalLoad < 1500) {
        results.warnings.push(`⚠️  Load time is acceptable but could be faster (${results.timing.totalLoad}ms)`);
      } else {
        results.failed.push(`❌ Load time too slow (${results.timing.totalLoad}ms > 800ms target)`);
      }
    }

    // Check resource timing for API calls
    const resources = performance.getEntriesByType('resource');
    const apiCalls = resources.filter(r => 
      r.name.includes('supabase') || 
      r.name.includes('domain_entries') ||
      r.name.includes('/api/')
    );

    if (apiCalls.length > 0) {
      console.log('%c🌐 API Calls Detected:', 'color: blue; font-size: 14px; font-weight: bold');
      apiCalls.forEach(call => {
        const duration = Math.round(call.duration);
        const url = call.name.split('?')[0].substring(call.name.lastIndexOf('/') + 1);
        console.log(`   📍 ${url}: ${duration}ms`);
        
        if (duration > 500) {
          results.warnings.push(`⚠️  Slow API call: ${url} (${duration}ms)`);
        }
      });
      console.log('');
    }
  }

  // Check for memory leaks (timers)
  console.log('%c🧠 Step 3: Memory Leak Check', 'color: purple; font-size: 14px; font-weight: bold');
  console.log('');
  console.log('To check for memory leaks:');
  console.log('1. Open the Performance tab');
  console.log('2. Click "Record" (●)');
  console.log('3. Navigate to dashboard');
  console.log('4. Wait 10 seconds');
  console.log('5. Navigate away');
  console.log('6. Navigate back to dashboard');
  console.log('7. Repeat steps 5-6 five times');
  console.log('8. Stop recording');
  console.log('9. Check the Memory graph - should return to baseline');
  console.log('');

  // Summary
  console.log('%c' + '='.repeat(60), 'color: gray');
  console.log('%c📋 VERIFICATION SUMMARY', 'color: blue; font-size: 16px; font-weight: bold');
  console.log('%c' + '='.repeat(60), 'color: gray');
  console.log('');

  if (results.passed.length > 0) {
    console.log('%c✅ PASSED:', 'color: green; font-weight: bold');
    results.passed.forEach(item => console.log(`   ${item}`));
    console.log('');
  }

  if (results.warnings.length > 0) {
    console.log('%c⚠️  WARNINGS:', 'color: orange; font-weight: bold');
    results.warnings.forEach(item => console.log(`   ${item}`));
    console.log('');
  }

  if (results.failed.length > 0) {
    console.log('%c❌ FAILED:', 'color: red; font-weight: bold');
    results.failed.forEach(item => console.log(`   ${item}`));
    console.log('');
  }

  // Expected results
  console.log('%c🎯 EXPECTED RESULTS:', 'color: blue; font-weight: bold');
  console.log('   ✅ Total queries: ~6 (not 21+)');
  console.log('   ✅ domain_entries_view: appears ONCE (fetches all domains)');
  console.log('   ✅ Total load time: < 800ms');
  console.log('   ✅ No duplicate queries');
  console.log('   ✅ Memory returns to baseline after navigation');
  console.log('');

  console.log('%c📝 NEXT STEPS:', 'color: green; font-weight: bold');
  console.log('   1. Review the Network tab (as described above)');
  console.log('   2. Count the actual queries');
  console.log('   3. Check load times');
  console.log('   4. If results match expectations → Dashboard is optimized! ✅');
  console.log('   5. If not → Share the Network screenshot for analysis');
  console.log('');

  return results;
}

// Run the verification
verifyDashboardPerformance();

console.log('%c🎉 Verification script complete!', 'color: green; font-size: 14px; font-weight: bold');
console.log('Check the steps above and verify in the Network tab.');



