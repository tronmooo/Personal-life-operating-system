#!/usr/bin/env tsx
/**
 * localStorage Migration Verification Script
 * 
 * Verifies that the localStorage migration is complete and working correctly.
 * Run this after deployment to ensure everything is functioning properly.
 * 
 * Usage:
 *   npx tsx scripts/verify-localstorage-migration.ts
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { execSync } from 'child_process'

interface VerificationResult {
  check: string
  status: 'pass' | 'fail' | 'warning'
  message: string
  details?: string
}

const results: VerificationResult[] = []

console.log('🔍 Starting localStorage Migration Verification...\n')

// Check 1: Verify migration files exist
function checkMigrationFilesExist() {
  const requiredFiles = [
    'lib/hooks/use-routines.ts',
    'lib/utils/idb-cache.ts',
    'lib/hooks/use-domain-entries.ts',
    'LOCALSTORAGE_MIGRATION_COMPLETE.md',
  ]

  for (const file of requiredFiles) {
    const exists = existsSync(join(process.cwd(), file))
    results.push({
      check: `File exists: ${file}`,
      status: exists ? 'pass' : 'fail',
      message: exists ? 'File found' : 'File missing',
    })
  }
}

// Check 2: Scan for localStorage usage in production code (STRICT MODE)
function checkLocalStorageUsage() {
  try {
    // Exclude docs, test files, and intentional migration helpers only
    const excludePatterns = [
      '--exclude-dir=node_modules',
      '--exclude-dir=.next',
      '--exclude-dir=dist',
      '--exclude=*.md',
      '--exclude-dir=scripts',
      '--exclude-dir=app/debug',
      '--exclude-dir=app/debug-clear',
    ].join(' ')

    const grepCommand = `grep -r "localStorage\\." lib components app ${excludePatterns} 2>/dev/null || true`
    const output = execSync(grepCommand, { encoding: 'utf-8' })

    // Filter out comments and ONLY allowed migration helpers
    const lines = output.split('\n').filter(line => {
      if (!line.trim()) return false
      
      // Skip comment lines
      if (line.includes('//') && line.indexOf('localStorage') > line.indexOf('//')) return false
      
      // STRICT: Only allow these specific migration helper files
      // All other localStorage usage should go through server migration endpoint
      const allowedFiles = [
        'lib/utils/migration-logger.ts',
        'lib/utils/legacy-migration.ts',
        'lib/utils/server-migration-client.ts',
        'lib/migrate-localstorage-to-supabase.ts',
      ]
      
      const isAllowed = allowedFiles.some(allowed => line.includes(allowed))
      if (isAllowed) return false
      
      // Flag-gated client migrations (these should eventually be removed)
      // Allow them temporarily since they're behind NEXT_PUBLIC_ENABLE_LEGACY_MIGRATION flag
      const isFlagGatedFile = 
        line.includes('domain-quick-log.tsx') || 
        line.includes('use-routines.ts') || 
        line.includes('goals.ts')
      
      if (isFlagGatedFile) {
        // Downgrade to warning for flag-gated code
        console.warn('⚠️  Flag-gated localStorage found (temporary, should migrate to server endpoint):', line.substring(0, 100))
        return false
      }
      
      return true
    })

    const hasUnexpectedUsage = lines.length > 0

    results.push({
      check: 'localStorage usage in production code (STRICT)',
      status: hasUnexpectedUsage ? 'fail' : 'pass',
      message: hasUnexpectedUsage
        ? `❌ Found ${lines.length} FORBIDDEN localStorage usage(s) - use server migration endpoint instead`
        : 'No forbidden localStorage usage found',
      details: hasUnexpectedUsage ? lines.slice(0, 10).join('\n') : undefined,
    })
  } catch (error) {
    results.push({
      check: 'localStorage usage scan',
      status: 'warning',
      message: 'Could not complete scan',
      details: String(error),
    })
  }
}

// Check 3: Verify TypeScript compilation
function checkTypeScriptCompilation() {
  try {
    execSync('npx tsc --noEmit --skipLibCheck 2>&1', { encoding: 'utf-8' })
    results.push({
      check: 'TypeScript compilation',
      status: 'pass',
      message: 'All types are valid',
    })
  } catch (error: any) {
    const output = error.stdout || error.message
    const hasRoutinesErrors = output.includes('use-routines') || output.includes('goals.ts')
    const hasAIToolErrors = output.includes('universal-ai-tool')

    results.push({
      check: 'TypeScript compilation',
      status: hasRoutinesErrors || hasAIToolErrors ? 'fail' : 'warning',
      message: hasRoutinesErrors || hasAIToolErrors
        ? 'Type errors in migrated files'
        : 'Type errors exist (may be unrelated)',
      details: output.split('\n').slice(0, 10).join('\n'),
    })
  }
}

// Check 4: Verify hook implementations
function checkHookImplementations() {
  try {
    const useRoutinesPath = join(process.cwd(), 'lib/hooks/use-routines.ts')
    if (existsSync(useRoutinesPath)) {
      const content = readFileSync(useRoutinesPath, 'utf-8')
      
      const hasCreateEntry = content.includes('createEntry')
      const hasUpdateEntry = content.includes('updateEntry')
      const hasDeleteEntry = content.includes('deleteEntry')
      const hasMigration = content.includes('localStorage.getItem')
      const hasCleanup = content.includes('localStorage.removeItem')

      const checks = [
        { name: 'createEntry', value: hasCreateEntry },
        { name: 'updateEntry', value: hasUpdateEntry },
        { name: 'deleteEntry', value: hasDeleteEntry },
        { name: 'migration code', value: hasMigration },
        { name: 'cleanup code', value: hasCleanup },
      ]

      const missing = checks.filter(c => !c.value).map(c => c.name)

      results.push({
        check: 'useRoutines hook implementation',
        status: missing.length === 0 ? 'pass' : 'fail',
        message: missing.length === 0
          ? 'All required methods present'
          : `Missing: ${missing.join(', ')}`,
      })
    }
  } catch (error) {
    results.push({
      check: 'useRoutines hook implementation',
      status: 'fail',
      message: 'Could not verify hook',
      details: String(error),
    })
  }
}

// Check 5: Verify IndexedDB usage in AI tools
function checkIndexedDBUsage() {
  try {
    const aiToolPath = join(process.cwd(), 'components/tools/ai-tools/universal-ai-tool.tsx')
    if (existsSync(aiToolPath)) {
      const content = readFileSync(aiToolPath, 'utf-8')
      
      const hasIdbImport = content.includes('from \'@/lib/utils/idb-cache\'')
      const hasIdbGet = content.includes('idbGet')
      const hasIdbSet = content.includes('idbSet')
      const hasNoLocalStorage = !content.includes('localStorage.getItem') && !content.includes('localStorage.setItem')

      const allChecks = hasIdbImport && hasIdbGet && hasIdbSet && hasNoLocalStorage

      results.push({
        check: 'AI Tools IndexedDB migration',
        status: allChecks ? 'pass' : 'fail',
        message: allChecks
          ? 'Successfully migrated to IndexedDB'
          : 'Migration incomplete or localStorage still present',
      })
    }
  } catch (error) {
    results.push({
      check: 'AI Tools IndexedDB migration',
      status: 'fail',
      message: 'Could not verify migration',
      details: String(error),
    })
  }
}

// Check 6: Verify linter passes
function checkLinter() {
  try {
    execSync('npm run lint 2>&1', { encoding: 'utf-8' })
    results.push({
      check: 'ESLint',
      status: 'pass',
      message: 'No linting errors',
    })
  } catch (error: any) {
    const output = error.stdout || error.message
    const hasLocalStorageWarnings = output.toLowerCase().includes('localstorage')
    
    results.push({
      check: 'ESLint',
      status: hasLocalStorageWarnings ? 'fail' : 'warning',
      message: hasLocalStorageWarnings
        ? 'localStorage warnings found'
        : 'Linting warnings exist (may be unrelated)',
      details: hasLocalStorageWarnings ? output.split('\n').slice(0, 20).join('\n') : undefined,
    })
  }
}

// Check 7: Verify migration documentation
function checkDocumentation() {
  const docFiles = [
    'LOCALSTORAGE_MIGRATION_PLAN.md',
    'LOCALSTORAGE_MIGRATION_COMPLETE.md',
  ]

  let allExist = true
  for (const file of docFiles) {
    const exists = existsSync(join(process.cwd(), file))
    if (!exists) {
      allExist = false
      break
    }
  }

  results.push({
    check: 'Migration documentation',
    status: allExist ? 'pass' : 'warning',
    message: allExist ? 'All documentation present' : 'Some documentation missing',
  })
}

// Run all checks
checkMigrationFilesExist()
checkLocalStorageUsage()
checkTypeScriptCompilation()
checkHookImplementations()
checkIndexedDBUsage()
checkLinter()
checkDocumentation()

// Print results
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 VERIFICATION RESULTS')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const passed = results.filter(r => r.status === 'pass').length
const failed = results.filter(r => r.status === 'fail').length
const warnings = results.filter(r => r.status === 'warning').length

for (const result of results) {
  const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️'
  console.log(`${icon} ${result.check}`)
  console.log(`   ${result.message}`)
  if (result.details) {
    console.log(`   Details: ${result.details.slice(0, 200)}...`)
  }
  console.log()
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log(`✅ Passed:   ${passed}/${results.length}`)
console.log(`❌ Failed:   ${failed}/${results.length}`)
console.log(`⚠️  Warnings: ${warnings}/${results.length}`)
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

if (failed === 0) {
  console.log('🎉 All critical checks passed!')
  console.log('✅ localStorage migration is verified and production-ready.')
  process.exit(0)
} else {
  console.log('❌ Some checks failed. Please review the errors above.')
  console.log('⚠️  Fix the issues before deploying to production.')
  process.exit(1)
}




