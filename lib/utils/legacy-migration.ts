/**
 * Feature flag helper for legacy localStorage migrations.
 *
 * We keep these migrations around temporarily for users who might still have
 * old browser data. They are disabled by default and can be re-enabled by
 * setting NEXT_PUBLIC_ENABLE_LEGACY_MIGRATION=true.
 */

let cached: boolean | null = null

export const isLegacyMigrationEnabled = (): boolean => {
  if (cached !== null) return cached

  const raw =
    typeof process !== 'undefined'
      ? process.env.NEXT_PUBLIC_ENABLE_LEGACY_MIGRATION
      : undefined

  // In the browser, process.env is replaced at build time. As a safeguard,
  // also check for a runtime override on window.
  const windowOverride =
    typeof window !== 'undefined' && (window as any).__ENABLE_LEGACY_MIGRATION__

  cached = raw === 'true' || windowOverride === true
  return cached
}

export const resetLegacyMigrationCache = () => {
  cached = null
}
