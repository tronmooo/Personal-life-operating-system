/**
 * Utility to reset dashboard view mode to standard if there are issues
 */

export function resetDashboardMode() {
  if (typeof window === 'undefined') return
  
  try {
    // Force reset by dispatching event; settings persistence handled elsewhere
    console.log('🔧 Resetting dashboard mode to standard...')
      
      // Dispatch event to update UI
      window.dispatchEvent(new CustomEvent('dashboard-view-mode-changed', { 
        detail: { mode: 'standard' } 
      }))
      
    return true
  } catch (error) {
    console.error('Error resetting dashboard mode:', error)
    return false
  }
}

/**
 * Check if user needs dashboard mode reset (for troubleshooting)
 */
export function checkDashboardMode() {
  if (typeof window === 'undefined') return 'unknown'
  
  try {
    // No direct storage; caller should read from user settings if needed
    return 'unknown'
  } catch (error) {
    return 'error'
  }
}

















