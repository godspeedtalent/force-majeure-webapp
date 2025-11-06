#!/usr/bin/env node

/**
 * Force Majeure Design System Audit Script
 * 
 * Scans the codebase to identify components that don't follow design system guidelines.
 * Reports issues such as:
 * - Rounded corners instead of sharp edges
 * - Hardcoded hex colors instead of design system constants
 * - Inline spacing values instead of SPACING constants
 * - Title case headers instead of sentence case
 * - Arbitrary Tailwind spacing (p-4, m-6) instead of defined values
 * 
 * Usage:
 *   npx tsx scripts/audit-design-system.ts
 *   npm run audit:design-system
 */

import fs from 'fs';
import path from 'path';
import { glob } from 'glob';

interface AuditIssue {
  type: 'error' | 'warning' | 'info';
  message: string;
  line?: number;
}

interface AuditResult {
  file: string;
  issues: AuditIssue[];
  score: number; // 0-100, how compliant the file is
}

const results: AuditResult[] = [];

// Severity weights for scoring
const WEIGHTS = {
  error: 10,
  warning: 5,
  info: 2,
};

// Files to exclude from audit
const EXCLUDED_PATTERNS = [
  '**/node_modules/**',
  '**/dist/**',
  '**/build/**',
  '**/.next/**',
  '**/designSystem.ts',
  '**/designSystem.tsx',
  '**/DESIGN_SYSTEM.md',
  '**/DESIGN_SYSTEM_EXAMPLES.tsx',
  '**/styleUtils.ts',
  '**/*.test.ts',
  '**/*.test.tsx',
  '**/*.spec.ts',
  '**/*.spec.tsx',
  '**/FmBigButton.tsx', // Exempt - intentionally uses rounded design
  '**/FmProfileAvatar.tsx', // Exempt - profile pictures are round
  '**/ProfileAvatar.tsx', // Exempt - profile pictures are round
];

/**
 * Check file content for design system violations
 */
function auditFile(filePath: string, content: string): AuditResult {
  const issues: AuditIssue[] = [];
  const lines = content.split('\n');

  // 1. Check for rounded classes (except rounded-none)
  const roundedMatches = content.match(/rounded-(?!none|sm\b)[a-z]+/g);
  if (roundedMatches && roundedMatches.length > 0) {
    issues.push({
      type: 'error',
      message: `Uses ${roundedMatches.length} rounded corner class(es): ${roundedMatches.slice(0, 3).join(', ')}${roundedMatches.length > 3 ? '...' : ''}. Use sharp edges (rounded-none).`,
    });
  }

  // 2. Check for hardcoded hex colors
  const hexColorRegex = /#[0-9A-Fa-f]{6}/g;
  const hexMatches = content.match(hexColorRegex);
  if (hexMatches && hexMatches.length > 0) {
    // Exclude comments and imports
    const actualHexUsage = lines.filter(line => {
      return hexMatches.some(hex => line.includes(hex)) && 
             !line.trim().startsWith('//') && 
             !line.trim().startsWith('*') &&
             !line.includes('from ');
    });
    
    if (actualHexUsage.length > 0) {
      issues.push({
        type: 'error',
        message: `Uses ${actualHexUsage.length} hardcoded hex color(s). Import COLORS from designSystem.ts instead.`,
      });
    }
  }

  // 3. Check for inline style spacing
  const inlineSpacingRegex = /(?:padding|margin|gap):\s*['"`]\d+px['"`]/g;
  const inlineSpacingMatches = content.match(inlineSpacingRegex);
  if (inlineSpacingMatches && inlineSpacingMatches.length > 0) {
    issues.push({
      type: 'warning',
      message: `Uses ${inlineSpacingMatches.length} inline spacing value(s). Use SPACING constants instead.`,
    });
  }

  // 4. Check for arbitrary Tailwind spacing (p-1 through p-12, m-1 through m-12, etc.)
  const arbitraryTailwindSpacing = content.match(/(?:p|m|gap|space)-(?:1[0-2]|[2-9])\b/g);
  if (arbitraryTailwindSpacing && arbitraryTailwindSpacing.length > 0) {
    const uniqueClasses = [...new Set(arbitraryTailwindSpacing)];
    issues.push({
      type: 'warning',
      message: `Uses ${uniqueClasses.length} arbitrary Tailwind spacing class(es): ${uniqueClasses.slice(0, 3).join(', ')}. Use design system spacing: [5px], [10px], [20px], [40px], [60px].`,
    });
  }

  // 5. Check for Title Case in headers (basic heuristic)
  const titleCaseHeaderRegex = /<h[1-6][^>]*>([A-Z][a-z]+\s+){2,}/g;
  const titleCaseMatches = content.match(titleCaseHeaderRegex);
  if (titleCaseMatches && titleCaseMatches.length > 0) {
    issues.push({
      type: 'warning',
      message: `Found ${titleCaseMatches.length} potential Title Case header(s). Use sentence case.`,
    });
  }

  // 6. Check for missing UPPERCASE labels
  const labelRegex = /<[Ll]abel[^>]*>(?!.*uppercase)([^<]+)<\/[Ll]abel>/g;
  const labelMatches = content.match(labelRegex);
  if (labelMatches && labelMatches.length > 0) {
    // Filter out labels that are already uppercase or contain variables
    const nonUppercaseLabels = labelMatches.filter(match => {
      const text = match.match(/>([^<]+)</)?.[1] || '';
      return text.length > 0 && text !== text.toUpperCase() && !text.includes('{');
    });
    
    if (nonUppercaseLabels.length > 0) {
      issues.push({
        type: 'info',
        message: `Found ${nonUppercaseLabels.length} label(s) that may not be uppercase. Labels should be text-xs and uppercase.`,
      });
    }
  }

  // 7. Check if file imports from designSystem
  const importsDesignSystem = content.includes('from \'@/shared/constants/designSystem\'') ||
                               content.includes('from "@/shared/constants/designSystem"');
  
  if (!importsDesignSystem && issues.length > 0) {
    issues.push({
      type: 'info',
      message: 'Does not import from designSystem.ts. Consider using design system constants.',
    });
  }

  // 8. Check if file imports styleUtils
  const importsStyleUtils = content.includes('from \'@/shared/utils/styleUtils\'') ||
                             content.includes('from "@/shared/utils/styleUtils"');
  
  if (!importsStyleUtils && issues.filter(i => i.type === 'error' || i.type === 'warning').length > 2) {
    issues.push({
      type: 'info',
      message: 'Consider using styleUtils.ts helper functions for consistent styling.',
    });
  }

  // Calculate compliance score (0-100)
  const totalWeight = issues.reduce((sum, issue) => sum + WEIGHTS[issue.type], 0);
  const score = Math.max(0, 100 - totalWeight);

  return {
    file: filePath,
    issues,
    score,
  };
}

/**
 * Main audit function
 */
async function auditDesignSystem() {
  console.log('\n🎨 Force Majeure Design System Audit\n');
  console.log('Scanning codebase for design system compliance...\n');

  // Find all TypeScript/TSX files
  const files = await glob('src/**/*.{ts,tsx}', {
    ignore: EXCLUDED_PATTERNS,
    cwd: process.cwd(),
  });

  console.log(`Found ${files.length} files to audit\n`);

  // Audit each file
  for (const file of files) {
    const fullPath = path.join(process.cwd(), file);
    const content = fs.readFileSync(fullPath, 'utf-8');
    const result = auditFile(file, content);

    if (result.issues.length > 0) {
      results.push(result);
    }
  }

  // Sort by score (worst first)
  results.sort((a, b) => a.score - b.score);

  // Output results
  console.log('═══════════════════════════════════════════════════════════\n');

  if (results.length === 0) {
    console.log('✅ All files comply with design system guidelines!\n');
    console.log('═══════════════════════════════════════════════════════════\n');
    return;
  }

  console.log(`Found issues in ${results.length} file(s):\n`);

  // Show top 20 files with worst compliance
  const topResults = results.slice(0, 20);

  topResults.forEach((result, index) => {
    const errorCount = result.issues.filter(i => i.type === 'error').length;
    const warningCount = result.issues.filter(i => i.type === 'warning').length;
    const infoCount = result.issues.filter(i => i.type === 'info').length;

    console.log(`${index + 1}. 📄 ${result.file}`);
    console.log(`   Score: ${result.score}/100 | ❌ ${errorCount} | ⚠️  ${warningCount} | ℹ️  ${infoCount}`);
    
    result.issues.forEach(issue => {
      const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️ ' : 'ℹ️ ';
      console.log(`   ${icon} ${issue.message}`);
    });
    
    console.log('');
  });

  if (results.length > 20) {
    console.log(`... and ${results.length - 20} more file(s) with issues\n`);
  }

  console.log('═══════════════════════════════════════════════════════════\n');

  // Summary statistics
  const totalIssues = results.reduce((sum, r) => sum + r.issues.length, 0);
  const totalErrors = results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'error').length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'warning').length, 0);
  const totalInfo = results.reduce((sum, r) => sum + r.issues.filter(i => i.type === 'info').length, 0);
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  console.log('📊 Summary Statistics:\n');
  console.log(`   Total Issues: ${totalIssues}`);
  console.log(`   ❌ Errors: ${totalErrors}`);
  console.log(`   ⚠️  Warnings: ${totalWarnings}`);
  console.log(`   ℹ️  Info: ${totalInfo}`);
  console.log(`   Average Compliance Score: ${avgScore.toFixed(1)}/100\n`);

  console.log('═══════════════════════════════════════════════════════════\n');
  console.log('📖 Next Steps:\n');
  console.log('   1. Review files with lowest scores');
  console.log('   2. Import from @/shared/constants/designSystem');
  console.log('   3. Use helper functions from @/shared/utils/styleUtils');
  console.log('   4. See /docs/DESIGN_SYSTEM.md for complete guidelines\n');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Save detailed report to file
  const reportPath = path.join(process.cwd(), 'design-system-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`📋 Detailed report saved to: ${reportPath}\n`);
}

// Run audit
auditDesignSystem().catch(console.error);
