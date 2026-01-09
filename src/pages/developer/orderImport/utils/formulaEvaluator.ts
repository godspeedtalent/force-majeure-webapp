/**
 * Formula Evaluator
 *
 * Evaluates mathematical formulas with support for:
 * - CSV column references: [COLUMN_NAME]
 * - Special variables: $TIER_PRICE
 * - Math operators: +, -, *, /
 * - Functions: MIN(a,b), MAX(a,b), ROUND(x), ABS(x)
 */

import { logger } from '@/shared/services/logger';
import type { FormulaContext } from '../types';

/**
 * Evaluates a formula expression
 */
export function evaluateFormula(expression: string, context: FormulaContext): number {
  try {
    let expr = expression;

    // Replace column references [COLUMN_NAME] with values
    expr = expr.replace(/\[([^\]]+)\]/g, (_match, columnName) => {
      const value = context.row[columnName];
      if (value === undefined || value === '') return '0';
      const num = parseFloat(value.replace(/[,$]/g, ''));
      return isNaN(num) ? '0' : num.toString();
    });

    // Replace special variables
    expr = expr.replace(/\$TIER_PRICE/gi, context.tierPrice.toString());

    // Handle functions: MIN, MAX, ROUND, ABS
    // Process functions from innermost to outermost
    let maxIterations = 20;
    while (maxIterations-- > 0) {
      const prevExpr = expr;

      // MIN(a, b)
      expr = expr.replace(/MIN\s*\(\s*([^,()]+)\s*,\s*([^,()]+)\s*\)/gi, (_match, a, b) => {
        const numA = evaluateSimpleExpression(a);
        const numB = evaluateSimpleExpression(b);
        return Math.min(numA, numB).toString();
      });

      // MAX(a, b)
      expr = expr.replace(/MAX\s*\(\s*([^,()]+)\s*,\s*([^,()]+)\s*\)/gi, (_match, a, b) => {
        const numA = evaluateSimpleExpression(a);
        const numB = evaluateSimpleExpression(b);
        return Math.max(numA, numB).toString();
      });

      // ROUND(x)
      expr = expr.replace(/ROUND\s*\(\s*([^()]+)\s*\)/gi, (_match, x) => {
        const num = evaluateSimpleExpression(x);
        return Math.round(num).toString();
      });

      // ABS(x)
      expr = expr.replace(/ABS\s*\(\s*([^()]+)\s*\)/gi, (_match, x) => {
        const num = evaluateSimpleExpression(x);
        return Math.abs(num).toString();
      });

      if (expr === prevExpr) break;
    }

    return evaluateSimpleExpression(expr);
  } catch (error) {
    logger.warn('Formula evaluation error', { expression, error });
    return 0;
  }
}

/**
 * Evaluates a simple mathematical expression (no functions, just +, -, *, /, parentheses)
 * Uses a safe evaluation approach without eval()
 */
function evaluateSimpleExpression(expr: string): number {
  // Remove whitespace
  expr = expr.replace(/\s+/g, '');

  // Tokenize: numbers (including decimals and negatives) and operators
  const tokens: (number | string)[] = [];
  let i = 0;

  while (i < expr.length) {
    const char = expr[i];

    if (char === '(' || char === ')' || char === '+' || char === '*' || char === '/') {
      tokens.push(char);
      i++;
    } else if (char === '-') {
      // Check if this is a negative sign or subtraction operator
      if (tokens.length === 0 || tokens[tokens.length - 1] === '(' || typeof tokens[tokens.length - 1] === 'string') {
        // Negative number
        let num = '-';
        i++;
        while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
          num += expr[i];
          i++;
        }
        tokens.push(parseFloat(num) || 0);
      } else {
        tokens.push('-');
        i++;
      }
    } else if (/\d/.test(char) || char === '.') {
      let num = '';
      while (i < expr.length && (/\d/.test(expr[i]) || expr[i] === '.')) {
        num += expr[i];
        i++;
      }
      tokens.push(parseFloat(num) || 0);
    } else {
      i++; // Skip unknown characters
    }
  }

  // Shunting-yard algorithm to convert to postfix, then evaluate
  return evaluateTokens(tokens);
}

/**
 * Evaluates tokens in postfix notation using the shunting-yard algorithm
 */
function evaluateTokens(tokens: (number | string)[]): number {
  const outputQueue: (number | string)[] = [];
  const operatorStack: string[] = [];

  const precedence: Record<string, number> = { '+': 1, '-': 1, '*': 2, '/': 2 };

  for (const token of tokens) {
    if (typeof token === 'number') {
      outputQueue.push(token);
    } else if (token === '(') {
      operatorStack.push(token);
    } else if (token === ')') {
      while (operatorStack.length > 0 && operatorStack[operatorStack.length - 1] !== '(') {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.pop(); // Remove '('
    } else if (['+', '-', '*', '/'].includes(token)) {
      while (
        operatorStack.length > 0 &&
        operatorStack[operatorStack.length - 1] !== '(' &&
        precedence[operatorStack[operatorStack.length - 1]] >= precedence[token]
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(token);
    }
  }

  while (operatorStack.length > 0) {
    outputQueue.push(operatorStack.pop()!);
  }

  // Evaluate postfix expression
  const evalStack: number[] = [];
  for (const token of outputQueue) {
    if (typeof token === 'number') {
      evalStack.push(token);
    } else {
      const b = evalStack.pop() ?? 0;
      const a = evalStack.pop() ?? 0;
      switch (token) {
        case '+': evalStack.push(a + b); break;
        case '-': evalStack.push(a - b); break;
        case '*': evalStack.push(a * b); break;
        case '/': evalStack.push(b !== 0 ? a / b : 0); break;
      }
    }
  }

  return evalStack[0] ?? 0;
}
