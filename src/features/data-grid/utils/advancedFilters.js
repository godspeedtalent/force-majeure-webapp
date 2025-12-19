/**
 * Apply advanced filter rules to a dataset
 */
export function applyAdvancedFilters(data, filterGroup) {
    if (!filterGroup || filterGroup.rules.length === 0) {
        return data;
    }
    return data.filter(row => {
        const results = filterGroup.rules.map(rule => evaluateRule(row, rule));
        // Apply AND/OR logic
        return filterGroup.logic === 'AND'
            ? results.every(result => result)
            : results.some(result => result);
    });
}
/**
 * Evaluate a single filter rule against a row
 */
function evaluateRule(row, rule) {
    const cellValue = row[rule.column];
    const cellStr = String(cellValue || '').toLowerCase();
    const ruleValueStr = rule.value.toLowerCase();
    switch (rule.operator) {
        case 'equals':
            return cellStr === ruleValueStr;
        case 'not_equals':
            return cellStr !== ruleValueStr;
        case 'contains':
            return cellStr.includes(ruleValueStr);
        case 'not_contains':
            return !cellStr.includes(ruleValueStr);
        case 'starts_with':
            return cellStr.startsWith(ruleValueStr);
        case 'ends_with':
            return cellStr.endsWith(ruleValueStr);
        case 'greater_than':
            return parseFloat(cellStr) > parseFloat(ruleValueStr);
        case 'less_than':
            return parseFloat(cellStr) < parseFloat(ruleValueStr);
        case 'greater_or_equal':
            return parseFloat(cellStr) >= parseFloat(ruleValueStr);
        case 'less_or_equal':
            return parseFloat(cellStr) <= parseFloat(ruleValueStr);
        case 'is_empty':
            return !cellValue || cellStr === '';
        case 'is_not_empty':
            return !!cellValue && cellStr !== '';
        default:
            return true;
    }
}
