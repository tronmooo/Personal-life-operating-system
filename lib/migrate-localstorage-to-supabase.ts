/**
 * Deprecated localStorage migration utility.
 *
 * All domains are now backed by Supabase. This helper is kept for reference only
 * and should not be invoked in production builds.
 */

export async function migrateLocalStorageToSupabase() {
  console.warn(
    'migrateLocalStorageToSupabase is deprecated. All data is Supabase-backed. ' +
    'This helper no longer performs any migration.'
  )
  return []
}

/**
 * Inspect legacy localStorage keys (for debugging only).
 */
export function checkLocalStorageData() {
  console.warn(
    'checkLocalStorageData is deprecated. Supabase is the source of truth; ' +
    'legacy localStorage inspection is no longer necessary.'
  )
  return []
}

/**
 * Legacy console commands (kept for reference).
 */




