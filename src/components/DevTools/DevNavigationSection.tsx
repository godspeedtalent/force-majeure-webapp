import { Code, BarChart3, Settings } from 'lucide-react';
import { FmCommonNavigationButton } from '@/components/ui/FmCommonNavigationButton';

export const DevNavigationSection = () => {
  return (
    <div className="space-y-2">
      <p className="text-xs text-white/50 mb-4">
        Quick navigation to developer-only pages and tools
      </p>
      <FmCommonNavigationButton
        to="/demo"
        label="Demos"
        icon={Code}
        description="Test application features"
        variant="outline"
      />
      <FmCommonNavigationButton
        to="/admin/statistics"
        label="Statistics"
        icon={BarChart3}
        description="View application metrics"
        variant="outline"
      />
      <FmCommonNavigationButton
        to="/admin/controls"
        label="Admin Controls"
        icon={Settings}
        description="Manage users and settings"
        variant="outline"
      />
    </div>
  );
};
