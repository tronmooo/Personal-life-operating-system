#!/usr/bin/env node
/**
 * Automated Console.log Replacer
 * 
 * Replaces console.log/error/warn with proper logger calls.
 * 
 * Usage:
 *   node scripts/replace-console-logs.js <file-or-directory>
 *   node scripts/replace-console-logs.js lib/hooks/
 *   node scripts/replace-console-logs.js app/api/domain-entries/route.ts
 * 
 * Options:
 *   --dry-run    Show what would be changed without modifying files
 *   --verbose    Show detailed output
 *   --keep-critical  Keep console.error calls (only replace log/warn)
 */

const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  dryRun: process.argv.includes('--dry-run'),
  verbose: process.argv.includes('--verbose'),
  keepCritical: process.argv.includes('--keep-critical'),
  targetPath: process.argv[2] || 'lib/',
};

// Statistics
const stats = {
  filesProcessed: 0,
  filesModified: 0,
  consolesReplaced: 0,
  errors: [],
  byType: {
    log: 0,
    error: 0,
    warn: 0,
    info: 0,
    debug: 0,
  },
};

/**
 * Patterns to detect context for better logging
 */
const contextPatterns = {
  domain: /domain[:\s]*['"]([^'"]+)['"]/i,
  action: /action[:\s]*['"]([^'"]+)['"]/i,
  component: /(?:function|const)\s+(\w+Component|\w+Page)/,
  api: /route\.ts/,
};

/**
 * Get all TypeScript/TSX files
 */
function getFiles(dirPath, fileList = []) {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!file.startsWith('.') && file !== 'node_modules' && file !== '.next') {
        getFiles(filePath, fileList);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      // Skip test files (already have their own logging)
      if (!file.includes('.test.') && !file.includes('.spec.')) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Extract context from the surrounding code
 */
function extractContext(content, position) {
  // Get surrounding 500 characters
  const start = Math.max(0, position - 250);
  const end = Math.min(content.length, position + 250);
  const context = content.slice(start, end);

  const extracted = {};

  // Try to find domain
  const domainMatch = context.match(contextPatterns.domain);
  if (domainMatch) extracted.domain = domainMatch[1];

  // Try to find action
  const actionMatch = context.match(contextPatterns.action);
  if (actionMatch) extracted.action = actionMatch[1];

  return Object.keys(extracted).length > 0 ? extracted : null;
}

/**
 * Convert console call to logger call
 */
function convertToLogger(type, args, context) {
  // Parse arguments
  const argsList = args.split(',').map(a => a.trim());
  
  if (argsList.length === 0) return null;

  const firstArg = argsList[0];
  const restArgs = argsList.slice(1);

  // Determine logger method
  let loggerMethod = 'info';
  switch (type) {
    case 'error':
      loggerMethod = 'error';
      break;
    case 'warn':
      loggerMethod = 'warn';
      break;
    case 'debug':
      loggerMethod = 'debug';
      break;
    case 'log':
    case 'info':
      loggerMethod = 'info';
      break;
  }

  // Build logger call
  let loggerCall = `logger.${loggerMethod}(${firstArg}`;

  // Add error if this is an error log and there's a second argument
  if (loggerMethod === 'error' && restArgs.length > 0) {
    const potentialError = restArgs[0];
    // Check if it looks like an error variable
    if (/^(err|error|e|exception)$/i.test(potentialError)) {
      loggerCall += `, ${potentialError}`;
      restArgs.shift();
    }
  }

  // Add context if we have remaining args or extracted context
  if (restArgs.length > 0 || context) {
    const contextParts = [];
    
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        contextParts.push(`${key}: '${value}'`);
      });
    }
    
    if (restArgs.length > 0) {
      restArgs.forEach(arg => {
        // Try to parse as key-value
        if (arg.includes(':')) {
          contextParts.push(arg);
        } else {
          contextParts.push(`data: ${arg}`);
        }
      });
    }
    
    if (contextParts.length > 0) {
      loggerCall += `, { ${contextParts.join(', ')} }`;
    }
  }

  loggerCall += ')';
  return loggerCall;
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
    let replacements = 0;

    // Pattern to match console calls
    // Matches: console.log(...), console.error(...), etc.
    const consolePattern = /console\.(log|error|warn|info|debug)\(([^)]+(?:\([^)]*\))?[^)]*)\)/g;

    let match;
    const matches = [];
    
    // Collect all matches first (to avoid modifying while iterating)
    while ((match = consolePattern.exec(content)) !== null) {
      matches.push({
        full: match[0],
        type: match[1],
        args: match[2],
        index: match.index,
      });
    }

    // Skip console.error if keep-critical flag is set
    const filteredMatches = config.keepCritical 
      ? matches.filter(m => m.type !== 'error')
      : matches;

    if (filteredMatches.length === 0) {
      return; // No console calls to replace
    }

    // Process matches in reverse order (to preserve indices)
    filteredMatches.reverse().forEach(({ full, type, args, index }) => {
      const context = extractContext(content, index);
      const loggerCall = convertToLogger(type, args, context);

      if (loggerCall) {
        content = content.slice(0, index) + loggerCall + content.slice(index + full.length);
        replacements++;
        stats.byType[type]++;
        modified = true;
      }
    });

    stats.consolesReplaced += replacements;

    // Check if we need to add logger import
    const needsLogger = /logger\./.test(content) && 
                        !/@\/lib\/utils\/logger/.test(content) &&
                        !/import.*logger.*from/.test(content);
    
    if (needsLogger) {
      // Add import at the top
      const importStatement = "import { logger } from '@/lib/utils/logger'\n";
      
      // Find the last import statement
      const importRegex = /^import\s+.+from\s+['"].+['"];?\s*$/gm;
      const imports = content.match(importRegex);
      
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        const lastImportIndex = content.lastIndexOf(lastImport);
        const insertPosition = lastImportIndex + lastImport.length;
        
        content = content.slice(0, insertPosition) + '\n' + importStatement + content.slice(insertPosition);
        modified = true;
      } else {
        // No imports found, add at the very top
        content = importStatement + '\n' + content;
        modified = true;
      }
    }

    // Write file if modified
    if (modified) {
      stats.filesModified++;

      if (!config.dryRun) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✅ ${filePath} (${replacements} console calls replaced)`);
      } else {
        console.log(`[DRY RUN] Would modify: ${filePath} (${replacements} console calls)`);
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
  console.log('🔧 Console.log Replacer\n');
  
  if (config.dryRun) {
    console.log('⚠️  DRY RUN MODE - No files will be modified\n');
  }

  if (config.keepCritical) {
    console.log('⚠️  KEEP CRITICAL MODE - console.error calls will be preserved\n');
  }

  const targetPath = path.resolve(config.targetPath);
  
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ Path not found: ${targetPath}`);
    process.exit(1);
  }

  // Get list of files
  let files = [];
  const stat = fs.statSync(targetPath);
  
  if (stat.isDirectory()) {
    files = getFiles(targetPath);
    console.log(`📁 Processing directory: ${targetPath}`);
    console.log(`📄 Found ${files.length} TypeScript files\n`);
  } else if (stat.isFile()) {
    files = [targetPath];
    console.log(`📄 Processing file: ${targetPath}\n`);
  }

  // Process files
  console.log('🔄 Processing files...\n');
  files.forEach(processFile);

  // Print summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY');
  console.log('='.repeat(60));
  console.log(`Files processed:      ${stats.filesProcessed}`);
  console.log(`Files modified:       ${stats.filesModified}`);
  console.log(`Console calls replaced: ${stats.consolesReplaced}`);
  console.log('\nBy type:');
  Object.entries(stats.byType).forEach(([type, count]) => {
    if (count > 0) {
      console.log(`  console.${type}:  ${count}`);
    }
  });
  
  if (stats.errors.length > 0) {
    console.log(`\n⚠️  Errors: ${stats.errors.length}`);
    stats.errors.forEach(({ file, error }) => {
      console.log(`  ❌ ${file}: ${error}`);
    });
  }

  if (!config.dryRun && stats.filesModified > 0) {
    console.log('\n✅ Changes applied!');
    console.log('\n📝 Next steps:');
    console.log('  1. Review changes: git diff');
    console.log('  2. Test functionality');
    console.log('  3. Commit: git add . && git commit -m "refactor: replace console with logger"');
  } else if (config.dryRun) {
    console.log('\n💡 Run without --dry-run to apply changes');
  } else {
    console.log('\n✨ No console calls found!');
  }
}

// Run
main();



