import { Building2 } from 'lucide-react';
import { createSearchDropdown } from './createSearchDropdown';

interface Organization {
  id: string;
  name: string;
  profile_picture: string | null;
}

export const FmOrganizationSearchDropdown = createSearchDropdown<Organization>({
  tableName: 'organizations',
  searchField: 'name',
  selectFields: 'id, name, profile_picture',
  formatLabel: (organization) => organization.name,
  renderIcon: (organization) =>
    organization.profile_picture ? (
      <img
        src={organization.profile_picture}
        alt={organization.name}
        className="h-8 w-8 rounded-full object-cover"
      />
    ) : (
      <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center">
        <Building2 className="h-4 w-4 text-white/50" />
      </div>
    ),
  defaultPlaceholder: 'Search for an organization...',
  createNewLabel: '+ Create New Organization',
  useRecents: true,
  recentsKey: 'organizations',
});
