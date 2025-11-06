import { FmOrganizationDataGrid } from '@/components/common/data/FmOrganizationDataGrid';

export const OrganizationsManagement = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-canela font-bold text-foreground mb-2">
          Organizations Management
        </h1>
        <p className="text-muted-foreground">
          Manage organizations, their profiles, and owners.
        </p>
      </div>

      <FmOrganizationDataGrid />
    </div>
  );
};
