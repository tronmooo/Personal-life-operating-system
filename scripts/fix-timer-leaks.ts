#!/usr/bin/env tsx
/**
 * Script to automatically fix timer memory leaks
 * 
 * This script scans components for setTimeout/setInterval calls without cleanup
 * and adds the useSafeTimers hook where needed.
 * 
 * Run with: npx tsx scripts/fix-timer-leaks.ts --dry-run
 */

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const DRY_RUN = process.argv.includes('--dry-run')

interface FixResult {
  file: string
  fixes: string[]
  success: boolean
}

const results: FixResult[] = []

function scanDirectory(dir: string): string[] {
  const files: string[] = []
  const entries = readdirSync(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stat = statSync(fullPath)

    if (stat.isDirectory()) {
      if (!entry.startsWith('.') && entry !== 'node_modules') {
        files.push(...scanDirectory(fullPath))
      }
    } else if (entry.endsWith('.tsx') || entry.endsWith('.ts')) {
      files.push(fullPath)
    }
  }

  return files
}

function hasTimerCalls(content: string): boolean {
  return /\b(setTimeout|setInterval)\(/.test(content)
}

function hasUseSafeTimersImport(content: string): boolean {
  return content.includes('useSafeTimers') || content.includes('use-safe-timers')
}

function isComponentFile(content: string): boolean {
  // Check if file contains React component
  return /export (default )?function|export (default )?(const|let) \w+ = /g.test(content) &&
         /import.*react/i.test(content)
}

function addSafeTimersImport(content: string): string {
  // Find the last import statement
  const importRegex = /^import .+$/gm
  const imports = content.match(importRegex)
  
  if (!imports || imports.length === 0) {
    // Add at top of file
    return `import { useSafeTimers } from '@/lib/hooks/use-safe-timers'\n\n${content}`
  }

  const lastImport = imports[imports.length - 1]
  const lastImportIndex = content.indexOf(lastImport) + lastImport.length

  return (
    content.slice(0, lastImportIndex) +
    `\nimport { useSafeTimers } from '@/lib/hooks/use-safe-timers'` +
    content.slice(lastImportIndex)
  )
}

function addUseSafeTimersHook(content: string): string {
  // Find the component function
  const componentMatch = content.match(/export (default )?function \w+\([^)]*\) \{/)
  
  if (!componentMatch) {
    // Try arrow function
    const arrowMatch = content.match(/export (default )?(const|let) \w+ = \([^)]*\) => \{/)
    if (!arrowMatch) return content
  }

  const match = componentMatch || content.match(/export (default )?(const|let) \w+ = \([^)]*\) => \{/)!
  const matchIndex = content.indexOf(match[0]) + match[0].length

  // Add hook call after opening brace
  const hookCall = `\n  const { setTimeout, setInterval, clearTimeout, clearInterval } = useSafeTimers()\n`
  
  return content.slice(0, matchIndex) + hookCall + content.slice(matchIndex)
}

function fixTimerCalls(content: string): string {
  // Replace global setTimeout/setInterval with safe versions
  // But be careful not to replace the hook calls themselves
  let fixed = content
  
  // Replace setTimeout( but not setTimeout:
  fixed = fixed.replace(/\bwindow\.setTimeout\(/g, 'setTimeout(')
  fixed = fixed.replace(/\bglobalThis\.setTimeout\(/g, 'setTimeout(')
  fixed = fixed.replace(/\bwindow\.setInterval\(/g, 'setInterval(')
  fixed = fixed.replace(/\bglobalThis\.setInterval\(/g, 'setInterval(')

  return fixed
}

function fixFile(filePath: string): FixResult {
  const result: FixResult = {
    file: filePath,
    fixes: [],
    success: false,
  }

  try {
    let content = readFileSync(filePath, 'utf-8')
    
    // Skip if already using safe timers
    if (hasUseSafeTimersImport(content)) {
      result.fixes.push('Already using useSafeTimers')
      result.success = true
      return result
    }

    // Skip if no timer calls
    if (!hasTimerCalls(content)) {
      return result
    }

    // Skip if not a component file
    if (!isComponentFile(content)) {
      return result
    }

    const originalContent = content

    // Add import
    content = addSafeTimersImport(content)
    result.fixes.push('Added useSafeTimers import')

    // Add hook call
    content = addUseSafeTimersHook(content)
    result.fixes.push('Added useSafeTimers hook call')

    // Fix timer calls
    content = fixTimerCalls(content)
    result.fixes.push('Fixed timer calls')

    // Write file if not dry run and content changed
    if (!DRY_RUN && content !== originalContent) {
      writeFileSync(filePath, content, 'utf-8')
      result.success = true
    } else if (content !== originalContent) {
      result.success = true
    }

    return result
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error)
    return result
  }
}

// Main execution
console.log('🔍 Scanning for timer memory leaks...\n')

const componentsDir = join(process.cwd(), 'components')
const appDir = join(process.cwd(), 'app')

const componentFiles = scanDirectory(componentsDir)
const appFiles = scanDirectory(appDir)
const allFiles = [...componentFiles, ...appFiles]

console.log(`Found ${allFiles.length} TypeScript files\n`)

let fixedCount = 0
let skippedCount = 0

for (const file of allFiles) {
  const result = fixFile(file)
  
  if (result.fixes.length > 0) {
    results.push(result)
    
    if (result.success) {
      fixedCount++
      console.log(`✅ ${file.replace(process.cwd(), '')}`)
      result.fixes.forEach(fix => console.log(`   - ${fix}`))
    } else {
      skippedCount++
      console.log(`⏭️  ${file.replace(process.cwd(), '')} (skipped)`)
    }
  }
}

console.log(`\n📊 Summary:`)
console.log(`   Fixed: ${fixedCount}`)
console.log(`   Skipped: ${skippedCount}`)
console.log(`   Total: ${allFiles.length}`)

if (DRY_RUN) {
  console.log(`\n⚠️  DRY RUN - No files were modified`)
  console.log(`   Run without --dry-run to apply fixes`)
}

console.log('\n✨ Timer leak fix complete!')




































