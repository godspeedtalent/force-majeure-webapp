# Force Majeure - Lovable AI Context

> **📖 Master Reference**: See `/docs/AI_INSTRUCTIONS.md` for shared TypeScript standards.
> This file contains Lovable-specific implementation patterns and build resolution strategies.

## Lovable-Specific Patterns

### Build Error Resolution Strategy

Lovable follows a systematic approach to resolving TypeScript build errors:

1. **Never Skip Errors**
   - Fix ALL TypeScript errors before completing tasks
   - No `@ts-ignore` or `@ts-expect-error` shortcuts
   - Address root causes, not symptoms

2. **Import Verification**
   - Always check for missing imports (logger, toast, etc.)
   - Verify import paths are correct
   - Ensure imports match export patterns

3. **Type Alignment**
   - Verify types match database schema
   - Check that accessed properties exist in type definitions
   - Update interfaces when schema changes

4. **Incremental Fixing**
   - Fix errors file-by-file, feature-by-feature
   - Group related errors together
   - Test each batch of fixes

5. **Parallel Operations**
   - Make multiple file changes simultaneously when possible
   - Batch related fixes for efficiency
   - Minimize sequential operations

### Refactoring Approach

#### Before Making Changes

1. **Read context files first**
   - Check if files are already in `<useful-context>`
   - Don't read files that are already provided
   - Only read what you need

2. **Assess architecture**
   - Consider if refactoring is needed
   - Identify duplicate code patterns
   - Look for opportunities to consolidate

3. **Plan minimal changes**
   - Make the smallest change that works
   - Don't add unnecessary features
   - Keep it simple

#### During Changes

1. **Use appropriate tools**
   - `lov-line-replace` for targeted edits (preferred)
   - `lov-write` only for new files or complete rewrites
   - Parallel tool calls for efficiency

2. **Maintain functionality**
   - Only change what the user asked for
   - Don't alter business logic unless requested
   - Preserve existing behavior

3. **Follow design system**
   - Use semantic tokens from `index.css`
   - Reference `tailwind.config.ts` for colors
   - Use HSL format for all colors

#### After Changes

1. **Verify completeness**
   - Check that all requested changes are made
   - Ensure no new build errors introduced
   - Test critical paths if possible

2. **Keep responses concise**
   - One-sentence summaries when possible
   - Focus on what was done
   - Avoid lengthy explanations

### TypeScript Error Patterns

#### Pattern 1: Missing Properties on Types

**Error**: `Property 'title' does not exist on type 'Event'`

**Diagnosis**: Code accesses property not defined in interface

**Resolution**:
```typescript
// Add missing property to type definition
export interface Event {
  // existing fields...
  title?: string;  // Add the missing property
}
```

#### Pattern 2: Missing Logger Import

**Error**: `Cannot find name 'logger'`

**Resolution**:
```typescript
// Add at top of file
import { logger } from '@/shared/services/logger';
```

#### Pattern 3: Wrong Logger Context Type

**Error**: `Argument of type 'unknown' is not assignable to parameter of type 'LogContext | undefined'`

**Resolution**:
```typescript
// ❌ Wrong
logger.error('Error', error);

// ✅ Correct
logger.error('Error message', {
  error: error instanceof Error ? error.message : String(error),
  source: 'functionName'
});
```

#### Pattern 4: Null vs Undefined Mismatch

**Error**: `Type 'string | null' is not assignable to type 'string | undefined'`

**Resolution**:
```typescript
// Convert at the boundary
const value = dbValue ?? undefined;  // null → undefined
const dbValue = value || null;        // undefined → null
```

#### Pattern 5: Unused Variables

**Error**: `'variable' is declared but its value is never read`

**Resolution**:
```typescript
// Option 1: Remove if truly unused
// const unused = value;

// Option 2: Prefix with underscore if needed for signature
const _unused = value;

// Option 3: For function parameters
function handler(_event: Event, data: Data) {
  // Only using data
}
```

#### Pattern 6: Type Predicate Mismatch

**Error**: `A type predicate's type must be assignable to its parameter's type`

**Resolution**:
```typescript
// ❌ Wrong - optional parameter vs union return
function isValid(value?: string): value is string

// ✅ Correct - explicit union parameter
function isValid(value: string | undefined): value is string
```

### Debugging Workflow

When users report build errors:

1. **Read the error list**
   - Identify error patterns
   - Group related errors
   - Prioritize by impact

2. **Read affected files**
   - Check if already in context
   - Read multiple files in parallel
   - Focus on error locations

3. **Apply fixes**
   - Fix all related errors together
   - Use parallel tool calls
   - Verify fix completeness

4. **Test and verify**
   - Check that errors are resolved
   - Ensure no new errors introduced
   - Confirm functionality preserved

### Communication Style

Lovable uses concise, efficient communication:

**Good Response**:
> "Fixed 8 TypeScript errors: added missing logger imports, updated Event interface with title/date/time properties, and converted null/undefined types at boundaries."

**Avoid**:
> "I'll start by analyzing the errors. First, I notice that there are several files with missing imports. Let me explain what each import does... [lengthy explanation]"

### Best Practices

1. **Efficiency First**
   - Batch operations when possible
   - Use parallel tool calls
   - Minimize back-and-forth

2. **Completeness**
   - Fix all errors, not just some
   - Address root causes
   - Update documentation when needed

3. **Simplicity**
   - Minimal necessary changes
   - Follow existing patterns
   - Don't over-engineer

4. **Consistency**
   - Follow project conventions
   - Use established patterns
   - Maintain code style

## Integration with Claude

When working on code initially created by Claude:

1. **Respect existing patterns**
   - Don't rewrite working code
   - Fix type errors, not style
   - Maintain architectural decisions

2. **Type strictness differences**
   - Lovable enforces stricter types
   - Add missing types/imports
   - Convert loose patterns to strict

3. **Incremental improvement**
   - Fix immediate issues
   - Don't refactor unnecessarily
   - Document changes clearly

## Update Protocol

When updating this file:

1. **Sync with master reference**
   - Check `/docs/AI_INSTRUCTIONS.md` for shared standards
   - Ensure consistency
   - Reference shared patterns

2. **Document Lovable specifics**
   - Only include Lovable-unique patterns
   - Reference master doc for shared content
   - Keep examples concrete

3. **Update CLAUDE.md if needed**
   - Add cross-references
   - Maintain consistency
   - Note pattern differences

---

**Last Updated**: 2025-01-20
**For**: Lovable AI Assistant
