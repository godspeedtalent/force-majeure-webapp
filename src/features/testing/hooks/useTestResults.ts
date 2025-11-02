import { useMemo, useState } from 'react';
import { TestResult, TestSummary, TestStatus } from '../types/testing';

export function useTestResults(results: TestResult[]) {
  const [filter, setFilter] = useState<TestStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredResults = useMemo(() => {
    let filtered = results;

    // Apply status filter
    if (filter !== 'all') {
      filtered = filtered.filter(r => r.status === filter);
    }

    // Apply search term
    if (searchTerm) {
      filtered = filtered.filter(r =>
        r.testName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [results, filter, searchTerm]);

  const summary: TestSummary = useMemo(() => {
    const total = results.length;
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    const totalExecutionTime = results.reduce((sum, r) => sum + r.executionTime, 0);
    const averageExecutionTime = total > 0 ? totalExecutionTime / total : 0;
    const successRate = total > 0 ? (passed / total) * 100 : 0;

    return {
      total,
      passed,
      failed,
      skipped,
      averageExecutionTime,
      totalExecutionTime,
      successRate,
    };
  }, [results]);

  const exportResults = (format: 'json' | 'csv' = 'json') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(results, null, 2);
      const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `test-results-${Date.now()}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    } else {
      // CSV export
      const headers = ['Test Name', 'Status', 'Execution Time (ms)', 'Error Message'];
      const rows = results.map(r => [
        r.testName,
        r.status,
        r.executionTime.toString(),
        r.error?.message || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
      ].join('\n');

      const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      const exportFileDefaultName = `test-results-${Date.now()}.csv`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  return {
    filteredResults,
    summary,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    exportResults,
  };
}
