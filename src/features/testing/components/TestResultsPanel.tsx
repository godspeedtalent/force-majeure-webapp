import { useTranslation } from 'react-i18next';
import { TestResult } from '../types/testing';
import { useTestResults } from '../hooks/useTestResults';
import { TestCaseItem } from './TestCaseItem';
import { FmCommonStatCard } from '@/components/common/display/FmCommonStatCard';
import { Button } from '@/components/common/shadcn/button';
import { Input } from '@/components/common/shadcn/input';
import { Badge } from '@/components/common/shadcn/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/common/shadcn/dropdown-menu';
import {
  Download,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileJson,
  FileText,
} from 'lucide-react';

interface TestResultsPanelProps {
  results: TestResult[];
}

export function TestResultsPanel({ results }: TestResultsPanelProps) {
  const { t } = useTranslation('common');
  const {
    filteredResults,
    summary,
    filter,
    setFilter,
    searchTerm,
    setSearchTerm,
    exportResults,
  } = useTestResults(results);

  if (results.length === 0) {
    return (
      <div className='text-center py-12'>
        <p className='text-muted-foreground'>
          {t('testResultsPanel.noResultsYet')}
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Summary Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <FmCommonStatCard value={summary.total} label={t('testResultsPanel.totalTests')} size='sm' />
        <FmCommonStatCard
          value={summary.passed}
          label={t('testResultsPanel.passed')}
          icon={CheckCircle2}
          size='sm'
          className='border-green-500/30 bg-green-500/5'
        />
        <FmCommonStatCard
          value={summary.failed}
          label={t('testResultsPanel.failed')}
          icon={XCircle}
          size='sm'
          className='border-red-500/30 bg-red-500/5'
        />
        <FmCommonStatCard
          value={`${summary.successRate.toFixed(1)}%`}
          label={t('testResultsPanel.successRate')}
          size='sm'
        />
      </div>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <FmCommonStatCard
          value={`${summary.averageExecutionTime.toFixed(0)}ms`}
          label={t('testResultsPanel.avgExecutionTime')}
          size='sm'
        />
        <FmCommonStatCard
          value={`${(summary.totalExecutionTime / 1000).toFixed(2)}s`}
          label={t('testResultsPanel.totalTime')}
          size='sm'
        />
      </div>

      {/* Filters and Search */}
      <div className='flex flex-col sm:flex-row gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder={t('testResultsPanel.searchTests')}
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>

        <div className='flex gap-2'>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setFilter('all')}
          >
            {t('testResultsPanel.all')}
            <Badge variant='secondary' className='ml-2'>
              {results.length}
            </Badge>
          </Button>
          <Button
            variant={filter === 'passed' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setFilter('passed')}
          >
            {t('testResultsPanel.passed')}
            <Badge variant='secondary' className='ml-2'>
              {summary.passed}
            </Badge>
          </Button>
          <Button
            variant={filter === 'failed' ? 'default' : 'outline'}
            size='sm'
            onClick={() => setFilter('failed')}
          >
            {t('testResultsPanel.failed')}
            <Badge variant='secondary' className='ml-2'>
              {summary.failed}
            </Badge>
          </Button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='outline' size='sm'>
              <Download className='h-4 w-4 mr-2' />
              {t('testResultsPanel.export')}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onClick={() => exportResults('json')}>
              <FileJson className='h-4 w-4 mr-2' />
              {t('testResultsPanel.exportAsJson')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportResults('csv')}>
              <FileText className='h-4 w-4 mr-2' />
              {t('testResultsPanel.exportAsCsv')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Results List */}
      <div className='space-y-3'>
        {filteredResults.length === 0 ? (
          <div className='text-center py-8'>
            <AlertCircle className='h-8 w-8 mx-auto text-muted-foreground mb-2' />
            <p className='text-muted-foreground'>{t('testResultsPanel.noMatchingTests')}</p>
          </div>
        ) : (
          filteredResults.map(result => (
            <TestCaseItem key={result.testId} result={result} />
          ))
        )}
      </div>
    </div>
  );
}
