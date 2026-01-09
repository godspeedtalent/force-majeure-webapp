import * as React from 'react';
import { Calculator, Plus, Hash, DollarSign, Braces } from 'lucide-react';
import { Label } from '@/components/common/shadcn/label';
import { cn } from '@/shared';

// Token types for syntax highlighting
type TokenType = 'column' | 'variable' | 'function' | 'operator' | 'number' | 'text' | 'paren' | 'error';

interface Token {
  type: TokenType;
  value: string;
  start: number;
  end: number;
}

// Available variable definition
export interface FormulaVariable {
  name: string;
  description: string;
  prefix: '$';
}

// Available column definition
export interface FormulaColumn {
  name: string;
  description?: string;
}

// Available function definition
export interface FormulaFunction {
  name: string;
  description: string;
  example: string;
  params: string[];
}

// Built-in functions
const BUILT_IN_FUNCTIONS: FormulaFunction[] = [
  { name: 'MIN', description: 'Returns the smaller of two values', example: 'MIN(a, b)', params: ['a', 'b'] },
  { name: 'MAX', description: 'Returns the larger of two values', example: 'MAX(a, b)', params: ['a', 'b'] },
  { name: 'ROUND', description: 'Rounds to nearest integer', example: 'ROUND(x)', params: ['x'] },
  { name: 'ABS', description: 'Returns absolute value', example: 'ABS(x)', params: ['x'] },
  { name: 'FLOOR', description: 'Rounds down to integer', example: 'FLOOR(x)', params: ['x'] },
  { name: 'CEIL', description: 'Rounds up to integer', example: 'CEIL(x)', params: ['x'] },
  { name: 'IF', description: 'Conditional: IF(condition, then, else)', example: 'IF(a > b, a, b)', params: ['condition', 'then', 'else'] },
];

interface FmFormulaInputProps {
  value: string;
  onChange: (value: string) => void;
  columns?: FormulaColumn[];
  variables?: FormulaVariable[];
  functions?: FormulaFunction[];
  label?: string;
  description?: string;
  error?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  containerClassName?: string;
}

/**
 * Tokenize a formula string for syntax highlighting
 */
function tokenize(formula: string, columns: FormulaColumn[], variables: FormulaVariable[], functions: FormulaFunction[]): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  const columnNames = columns.map(c => c.name);
  const variableNames = variables.map(v => v.name);
  const functionNames = functions.map(f => f.name);

  while (i < formula.length) {
    // Skip whitespace
    if (/\s/.test(formula[i])) {
      i++;
      continue;
    }

    // Column reference [COLUMN_NAME]
    if (formula[i] === '[') {
      const start = i;
      let end = formula.indexOf(']', i + 1);
      if (end === -1) end = formula.length;
      const columnName = formula.slice(i + 1, end);
      const isValid = columnNames.includes(columnName);
      tokens.push({
        type: isValid ? 'column' : 'error',
        value: formula.slice(start, end + 1),
        start,
        end: end + 1,
      });
      i = end + 1;
      continue;
    }

    // Variable $NAME
    if (formula[i] === '$') {
      const start = i;
      let end = i + 1;
      while (end < formula.length && /[A-Z_]/.test(formula[end])) {
        end++;
      }
      const varName = formula.slice(i + 1, end);
      const isValid = variableNames.includes(varName);
      tokens.push({
        type: isValid ? 'variable' : 'error',
        value: formula.slice(start, end),
        start,
        end,
      });
      i = end;
      continue;
    }

    // Function NAME(
    if (/[A-Z]/.test(formula[i])) {
      const start = i;
      let end = i;
      while (end < formula.length && /[A-Z_]/.test(formula[end])) {
        end++;
      }
      const funcName = formula.slice(start, end);
      const isFunction = functionNames.includes(funcName);
      if (isFunction && formula[end] === '(') {
        tokens.push({
          type: 'function',
          value: funcName,
          start,
          end,
        });
      } else if (isFunction) {
        // Function name without parens - treat as error/incomplete
        tokens.push({
          type: 'error',
          value: funcName,
          start,
          end,
        });
      } else {
        tokens.push({
          type: 'text',
          value: formula.slice(start, end),
          start,
          end,
        });
      }
      i = end;
      continue;
    }

    // Numbers
    if (/\d/.test(formula[i]) || (formula[i] === '.' && /\d/.test(formula[i + 1] || ''))) {
      const start = i;
      let end = i;
      while (end < formula.length && /[\d.]/.test(formula[end])) {
        end++;
      }
      tokens.push({
        type: 'number',
        value: formula.slice(start, end),
        start,
        end,
      });
      i = end;
      continue;
    }

    // Operators
    if (/[+\-*/%<>=!&|]/.test(formula[i])) {
      tokens.push({
        type: 'operator',
        value: formula[i],
        start: i,
        end: i + 1,
      });
      i++;
      continue;
    }

    // Parentheses and commas
    if (/[(),]/.test(formula[i])) {
      tokens.push({
        type: 'paren',
        value: formula[i],
        start: i,
        end: i + 1,
      });
      i++;
      continue;
    }

    // Unknown character - treat as text
    tokens.push({
      type: 'text',
      value: formula[i],
      start: i,
      end: i + 1,
    });
    i++;
  }

  return tokens;
}

/**
 * Get CSS class for token type
 */
function getTokenClass(type: TokenType): string {
  switch (type) {
    case 'column':
      return 'text-blue-400 bg-blue-500/10';
    case 'variable':
      return 'text-green-400 bg-green-500/10';
    case 'function':
      return 'text-purple-400';
    case 'operator':
      return 'text-fm-gold';
    case 'number':
      return 'text-orange-400';
    case 'paren':
      return 'text-white/70';
    case 'error':
      return 'text-red-400 bg-red-500/20 underline decoration-wavy decoration-red-500';
    default:
      return 'text-white';
  }
}

/**
 * Formula input component with syntax highlighting and autocomplete helpers
 */
export const FmFormulaInput = React.forwardRef<HTMLInputElement, FmFormulaInputProps>(
  (
    {
      value,
      onChange,
      columns = [],
      variables = [],
      functions = BUILT_IN_FUNCTIONS,
      label,
      description,
      error,
      placeholder = 'Enter formula...',
      disabled = false,
      className,
      containerClassName,
    },
    ref
  ) => {
    const [isFocused, setIsFocused] = React.useState(false);
    const [showHelper, setShowHelper] = React.useState(false);
    const [helperTab, setHelperTab] = React.useState<'columns' | 'variables' | 'functions'>('columns');
    const inputRef = React.useRef<HTMLInputElement>(null);
    const inputId = label ? label.toLowerCase().replace(/\s+/g, '-') : `formula-${Math.random().toString(36).substr(2, 9)}`;

    // Merge refs
    React.useImperativeHandle(ref, () => inputRef.current!, []);

    // Tokenize for syntax highlighting
    const tokens = React.useMemo(
      () => tokenize(value, columns, variables, functions),
      [value, columns, variables, functions]
    );

    // Insert text at cursor position
    const insertAtCursor = (text: string) => {
      const input = inputRef.current;
      if (!input) return;

      const start = input.selectionStart || 0;
      const end = input.selectionEnd || 0;
      const newValue = value.slice(0, start) + text + value.slice(end);
      onChange(newValue);

      // Set cursor position after inserted text
      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(start + text.length, start + text.length);
      });
    };

    const insertColumn = (columnName: string) => {
      insertAtCursor(`[${columnName}]`);
    };

    const insertVariable = (varName: string) => {
      insertAtCursor(`$${varName}`);
    };

    const insertFunction = (funcName: string, params: string[]) => {
      insertAtCursor(`${funcName}(${params.map(() => '').join(', ')})`);
    };

    // Render syntax-highlighted preview
    const renderHighlightedPreview = () => {
      if (!value) return null;

      return (
        <div className='absolute inset-0 px-3 py-2 pointer-events-none font-mono text-sm whitespace-pre overflow-hidden'>
          {tokens.map((token, idx) => (
            <span key={idx} className={getTokenClass(token.type)}>
              {token.value}
            </span>
          ))}
        </div>
      );
    };

    return (
      <div className={cn('space-y-1', containerClassName)}>
        {/* Input with syntax highlighting overlay */}
        <div className='relative'>
          {/* Syntax highlighted preview (behind input) */}
          <div
            className={cn(
              'relative border transition-all duration-300 bg-black/40',
              isFocused && !disabled && 'shadow-[0_0_16px_rgba(207,173,118,0.3)] border-fm-gold',
              !isFocused && 'border-white/20',
              error && 'border-red-500',
              disabled && 'opacity-50'
            )}
          >
            {renderHighlightedPreview()}
            <input
              ref={inputRef}
              id={inputId}
              type='text'
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => {
                setIsFocused(false);
                // Delay hiding helper to allow clicks
                setTimeout(() => setShowHelper(false), 200);
              }}
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                'w-full px-3 py-2 bg-transparent text-transparent caret-fm-gold font-mono text-sm',
                'focus:outline-none',
                className
              )}
            />
          </div>

          {/* Calculator icon and helper toggle */}
          <button
            type='button'
            onClick={() => setShowHelper(!showHelper)}
            className={cn(
              'absolute right-2 top-1/2 -translate-y-1/2 p-1 transition-colors',
              showHelper ? 'text-fm-gold' : 'text-muted-foreground hover:text-fm-gold'
            )}
            title='Show formula helper'
          >
            <Calculator className='h-4 w-4' />
          </button>
        </div>

        {/* Label and description */}
        {(label || description) && (
          <div>
            {label && (
              <Label
                htmlFor={inputId}
                className={cn(
                  'text-xs uppercase tracking-wider transition-colors duration-200',
                  isFocused ? 'text-fm-gold' : 'text-muted-foreground'
                )}
              >
                {label}
              </Label>
            )}
            {description && (
              <p className='text-xs text-muted-foreground/70 mt-0.5'>{description}</p>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <p className='text-xs text-red-500 animate-in fade-in slide-in-from-top-1 duration-300'>
            {error}
          </p>
        )}

        {/* Formula helper panel */}
        {showHelper && (
          <div className='border border-white/10 bg-black/80 backdrop-blur-sm rounded-sm animate-in fade-in slide-in-from-top-2 duration-200'>
            {/* Tabs */}
            <div className='flex border-b border-white/10'>
              <button
                type='button'
                onClick={() => setHelperTab('columns')}
                className={cn(
                  'flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors',
                  helperTab === 'columns'
                    ? 'bg-blue-500/20 text-blue-400 border-b-2 border-blue-400'
                    : 'text-muted-foreground hover:text-white'
                )}
              >
                <Braces className='h-3 w-3' />
                Columns ({columns.length})
              </button>
              <button
                type='button'
                onClick={() => setHelperTab('variables')}
                className={cn(
                  'flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors',
                  helperTab === 'variables'
                    ? 'bg-green-500/20 text-green-400 border-b-2 border-green-400'
                    : 'text-muted-foreground hover:text-white'
                )}
              >
                <DollarSign className='h-3 w-3' />
                Variables ({variables.length})
              </button>
              <button
                type='button'
                onClick={() => setHelperTab('functions')}
                className={cn(
                  'flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors',
                  helperTab === 'functions'
                    ? 'bg-purple-500/20 text-purple-400 border-b-2 border-purple-400'
                    : 'text-muted-foreground hover:text-white'
                )}
              >
                <Hash className='h-3 w-3' />
                Functions ({functions.length})
              </button>
            </div>

            {/* Content */}
            <div className='max-h-48 overflow-y-auto p-2'>
              {helperTab === 'columns' && (
                <div className='space-y-1'>
                  {columns.length === 0 ? (
                    <p className='text-xs text-muted-foreground text-center py-4'>No columns available</p>
                  ) : (
                    columns.map((col) => (
                      <button
                        key={col.name}
                        type='button'
                        onClick={() => insertColumn(col.name)}
                        className='w-full text-left px-2 py-1.5 text-sm hover:bg-blue-500/10 transition-colors flex items-center justify-between group'
                      >
                        <span className='font-mono text-blue-400'>[{col.name}]</span>
                        {col.description && (
                          <span className='text-xs text-muted-foreground truncate ml-2 max-w-[200px]'>
                            {col.description}
                          </span>
                        )}
                        <Plus className='h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2' />
                      </button>
                    ))
                  )}
                </div>
              )}

              {helperTab === 'variables' && (
                <div className='space-y-1'>
                  {variables.length === 0 ? (
                    <p className='text-xs text-muted-foreground text-center py-4'>No variables available</p>
                  ) : (
                    variables.map((variable) => (
                      <button
                        key={variable.name}
                        type='button'
                        onClick={() => insertVariable(variable.name)}
                        className='w-full text-left px-2 py-1.5 text-sm hover:bg-green-500/10 transition-colors flex items-center justify-between group'
                      >
                        <span className='font-mono text-green-400'>${variable.name}</span>
                        <span className='text-xs text-muted-foreground truncate ml-2 max-w-[200px]'>
                          {variable.description}
                        </span>
                        <Plus className='h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-2' />
                      </button>
                    ))
                  )}
                </div>
              )}

              {helperTab === 'functions' && (
                <div className='space-y-1'>
                  {functions.map((func) => (
                    <button
                      key={func.name}
                      type='button'
                      onClick={() => insertFunction(func.name, func.params)}
                      className='w-full text-left px-2 py-1.5 text-sm hover:bg-purple-500/10 transition-colors group'
                    >
                      <div className='flex items-center justify-between'>
                        <span className='font-mono text-purple-400'>{func.example}</span>
                        <Plus className='h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity' />
                      </div>
                      <p className='text-xs text-muted-foreground mt-0.5'>{func.description}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Quick reference */}
            <div className='border-t border-white/10 px-3 py-2 bg-black/40'>
              <p className='text-xs text-muted-foreground'>
                <span className='text-blue-400'>[Column]</span> for CSV values,{' '}
                <span className='text-green-400'>$VAR</span> for context values,{' '}
                <span className='text-fm-gold'>+ - * /</span> for math
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }
);

FmFormulaInput.displayName = 'FmFormulaInput';

// Export types for consumers
export type { Token, TokenType };
export { BUILT_IN_FUNCTIONS };
