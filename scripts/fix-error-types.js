#!/usr/bin/env node
/**
 * Automated Error Type Fixer
 * 
 * Replaces `catch (err: any)` with proper error handling patterns.
 * 
 * Usage:
 *   node scripts/fix-error-types.js <file-or-directory>
 *   node scripts/fix-error-types.js lib/hooks/
 *   node scripts/fix-error-types.js lib/hooks/use-health-metrics.ts
 * 
 * Options:
 *   --dry-run    Show what would be changed without modifying files
 *   --verbose    Show detailed output
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  targetPath: process.argv[2] || 'lib/',
};

// Statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  patternsFixed: 0,
  errors: [],
};

/**
 * Main error type patterns to fix
 */
const errorPatterns = [
  {
    name: 'catch-any',
    // Match: catch (err: any) or catch (error: any) or catch (e: any)
    pattern: /catch\s*\(\s*(\w+)\s*:\s*any\s*\)/g,
    replacement: (match, varName) => `catch (${varName})`,
    addImport: false,
  },
  {
    name: 'error-message-access',
    // Match: err.message ?? String(err) or error.message ?? String(error)
    pattern: /(\w+)\.message\s*\?\?\s*String\(\1\)/g,
    replacement: (match, varName) => {
      return `(${varName} instanceof Error ? ${varName}.message : String(${varName}))`;
    },
    addImport: false,
  },
  {
    name: 'console-error-any',
    // Match: console.error with just error variable (enhance it)
    pattern: /console\.error\(\s*['"]([^'"]+)['"]\s*,\s*(\w+)\s*\)/g,
    replacement: (match, message, varName) => {
      return `console.error('${message}', {
    error: ${varName} instanceof Error ? ${varName}.message : String(${varName}),
    stack: ${varName} instanceof Error ? ${varName}.stack : undefined
  })`;
    },
    addImport: false,
  },
];

/**
 * Get all TypeScript/TSX files in a directory
 */
function getFiles(dirPath, fileList = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      // Skip node_modules, .next, etc.
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        getFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

/**
 * Process a single file
 */
function processFile(filePath) {
  stats.filesProcessed++;

  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    let modified = false;
    let fileStats = {
      patterns: {},
    };

    // Apply each pattern
    errorPatterns.forEach((pattern) => {
      const matches = content.match(pattern.pattern);
      if (matches) {
        const count = matches.length;
        fileStats.patterns[pattern.name] = count;
        stats.patternsFixed += count;
        modified = true;

        content = content.replace(pattern.pattern, pattern.replacement);

        if (config.verbose) {
          console.log(`  ✓ Fixed ${count} × ${pattern.name}`);
        }
      }
    });

    // Check if we need to add toError import
    const needsToError = /toError\(/.test(content) && 
                         !/@\/lib\/utils\/error-types/.test(content);
    
    if (needsToError) {
      // Add import at the top (after other imports)
      const importStatement = "import { toError } from '@/lib/utils/error-types'\n";
      
      // Find the last import statement
      const importRegex = /^import\s+.+from\s+['"].+['"];?\s*$/gm;
      const imports = content.match(importRegex);
      
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertPosition = lastImportIndex + lastImport.length;
        
        content = content.slice(0, insertPosition) + '\n' + importStatement + content.slice(insertPosition);
        modified = true;
        
        if (config.verbose) {
          console.log(`  ✓ Added toError import`);
        }
      }
    }

    // Write file if modified
    if (modified) {
      stats.filesModified++;

      if (!config.dryRun) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${filePath}`);
      } else {
        console.log(`[DRY RUN] Would modify: ${filePath}`);
      }

      if (config.verbose) {
        Object.entries(fileStats.patterns).forEach(([name, count]) => {
          console.log(`    ${count} × ${name}`);
        });
      }
    }
  } catch (error) {
    stats.errors.push({ file: filePath, error: error.message });
    console.error(`❌ Error processing ${filePath}:`, error.message);
  }
}

/**
 * Main execution
 */
function main() {
  console.log('🔧 Error Type Fixer\n');
  
  if (config.dryRun) {
    console.log('⚠️  DRY RUN MODE - No files will be modified\n');
  }

  const targetPath = path.resolve(config.targetPath);
  
  // Check if target exists
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ Path not found: ${targetPath}`);
    process.exit(1);
  }

  // Get list of files to process
  let files = [];
  const stat = fs.statSync(targetPath);
  
  if (stat.isDirectory()) {
    files = getFiles(targetPath);
    console.log(`📁 Processing directory: ${targetPath}`);
    console.log(`📄 Found ${files.length} TypeScript files\n`);
  } else if (stat.isFile() && (targetPath.endsWith('.ts') || targetPath.endsWith('.tsx'))) {
    files = [targetPath];
    console.log(`📄 Processing file: ${targetPath}\n`);
  } else {
    console.error('❌ Target must be a TypeScript file or directory');
    process.exit(1);
  }

  // Process each file
  console.log('🔄 Processing files...\n');
  files.forEach(processFile);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files processed:  ${stats.filesProcessed}`);
  console.log(`Files modified:   ${stats.filesModified}`);
  console.log(`Patterns fixed:   ${stats.patternsFixed}`);
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors encountered: ${stats.errors.length}`);
    stats.errors.forEach(({ file, error }) => {
      console.log(`  ❌ ${file}: ${error}`);
    });
  }

  if (!config.dryRun && stats.filesModified > 0) {
    console.log('\n✅ Changes applied successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Review the changes: git diff');
    console.log('  2. Run type check: npm run type-check');
    console.log('  3. Run tests: npm test');
    console.log('  4. Commit changes: git add . && git commit -m "fix: improve error type safety"');
  } else if (config.dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  } else {
    console.log('\n✨ No changes needed - all files already use proper error types!');
  }
}

// Run
main();



