import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  User,
  Shield,
  UserCog,
  Trash2,
  Plus,
} from 'lucide-react';
import { FmFormSection } from '@/components/common/forms/FmFormSection';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { FmCommonIconButton } from '@/components/common/buttons/FmCommonIconButton';
import { FmCommonConfirmDialog } from '@/components/common/modals/FmCommonConfirmDialog';
import { FmPortalTooltip } from '@/components/common/feedback/FmPortalTooltip';
import { FmUserSearchDropdown } from '@/components/common/search/FmUserSearchDropdown';
import { useOrganizationStaff } from './hooks/useOrganizationStaff';
import type { OrganizationStaffRole, OrganizationStaffWithDetails } from '@/shared/types/organizationStaff';
import { cn } from '@/shared';

interface OrganizationStaffManagementProps {
  organizationId: string;
}

export const OrganizationStaffManagement = ({ organizationId }: OrganizationStaffManagementProps) => {
  const { t } = useTranslation('common');

  const {
    staff,
    isLoading,
    addStaff,
    updateStaffRole,
    removeStaff,
    isAdding,
  } = useOrganizationStaff(organizationId);

  // Add staff form state
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<OrganizationStaffRole>('staff');

  // Confirm dialog state
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

  const handleAddStaff = () => {
    if (selectedUserId) {
      addStaff(
        { userId: selectedUserId, role: selectedRole },
        {
          onSuccess: () => {
            setSelectedUserId('');
          },
        }
      );
    }
  };

  const handleRoleToggle = (staffMember: OrganizationStaffWithDetails) => {
    const newRole: OrganizationStaffRole = staffMember.role === 'staff' ? 'admin' : 'staff';
    updateStaffRole({ staffId: staffMember.id, role: newRole });
  };

  const getStaffDisplayName = (staffMember: OrganizationStaffWithDetails): string => {
    if (staffMember.profiles) {
      return staffMember.profiles.full_name || staffMember.profiles.display_name || t('orgStaff.unknownUser');
    }
    return t('orgStaff.unknown');
  };

  const getStaffAvatar = (staffMember: OrganizationStaffWithDetails): string | null => {
    if (staffMember.profiles) {
      return staffMember.profiles.avatar_url;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center h-64'>
        <p className='text-muted-foreground'>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Add Staff Section */}
      <FmFormSection
        title={t('orgStaff.addStaff')}
        description={t('orgStaff.addStaffDescription')}
        icon={Plus}
      >
        <div className='space-y-4'>
          {/* Search Input and Role Selector */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              <FmUserSearchDropdown
                value={selectedUserId}
                onChange={(value) => setSelectedUserId(value)}
                placeholder={t('orgStaff.searchUser')}
              />
            </div>

            {/* Role Selector */}
            <div className='flex gap-2'>
              <button
                type='button'
                onClick={() => setSelectedRole('staff')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 p-3 border transition-all',
                  selectedRole === 'staff'
                    ? 'border-fm-gold bg-fm-gold/20 text-fm-gold'
                    : 'border-white/20 hover:border-white/40'
                )}
              >
                <UserCog className='h-4 w-4' />
                <span>{t('orgStaff.roleStaff')}</span>
              </button>
              <button
                type='button'
                onClick={() => setSelectedRole('admin')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 p-3 border transition-all',
                  selectedRole === 'admin'
                    ? 'border-fm-gold bg-fm-gold/20 text-fm-gold'
                    : 'border-white/20 hover:border-white/40'
                )}
              >
                <Shield className='h-4 w-4' />
                <span>{t('orgStaff.roleAdmin')}</span>
              </button>
            </div>
          </div>

          {/* Role Descriptions */}
          <div className='text-xs text-muted-foreground'>
            {selectedRole === 'staff' ? t('orgStaff.staffDescription') : t('orgStaff.adminDescription')}
          </div>

          {/* Add Button */}
          <FmCommonButton
            variant='gold'
            icon={Plus}
            onClick={handleAddStaff}
            disabled={!selectedUserId}
            loading={isAdding}
          >
            {t('orgStaff.addToOrganization')}
          </FmCommonButton>
        </div>
      </FmFormSection>

      {/* Staff List */}
      <FmFormSection
        title={t('orgStaff.title')}
        description={t('orgStaff.listDescription')}
        icon={Users}
      >
        {staff.length === 0 ? (
          <div className='text-center py-12 border border-dashed border-white/20'>
            <Users className='h-12 w-12 mx-auto text-muted-foreground/50 mb-4' />
            <p className='text-muted-foreground'>{t('orgStaff.noStaff')}</p>
            <p className='text-sm text-muted-foreground/70 mt-1'>
              {t('orgStaff.noStaffHint')}
            </p>
          </div>
        ) : (
          <div className='space-y-2'>
            {staff.map((staffMember, index) => {
              const avatar = getStaffAvatar(staffMember);
              const name = getStaffDisplayName(staffMember);

              return (
                <div
                  key={staffMember.id}
                  className={cn(
                    'flex items-center justify-between p-4 border transition-colors',
                    index % 2 === 0 ? 'bg-background/40' : 'bg-background/60'
                  )}
                >
                  {/* Staff Info */}
                  <div className='flex items-center gap-4'>
                    {/* Avatar */}
                    {avatar ? (
                      <img
                        src={avatar}
                        alt={name}
                        className='w-10 h-10 rounded-full object-cover'
                      />
                    ) : (
                      <div className='w-10 h-10 rounded-full bg-white/10 flex items-center justify-center'>
                        <User className='h-5 w-5 text-white/50' />
                      </div>
                    )}

                    <div>
                      <p className='font-medium'>{name}</p>
                      <p className='text-sm text-muted-foreground'>
                        {t('orgStaff.addedOn', {
                          date: new Date(staffMember.created_at).toLocaleDateString(),
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex items-center gap-3'>
                    {/* Role Badge (clickable to toggle) */}
                    <FmPortalTooltip content={t('orgStaff.clickToChangeRole')}>
                      <button
                        onClick={() => handleRoleToggle(staffMember)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 text-sm uppercase transition-all border',
                          staffMember.role === 'admin'
                            ? 'bg-fm-gold/20 text-fm-gold border-fm-gold/40 hover:bg-fm-gold/30'
                            : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                        )}
                      >
                        {staffMember.role === 'admin' ? (
                          <Shield className='h-3.5 w-3.5' />
                        ) : (
                          <UserCog className='h-3.5 w-3.5' />
                        )}
                        {staffMember.role === 'admin'
                          ? t('orgStaff.roleAdmin')
                          : t('orgStaff.roleStaff')}
                      </button>
                    </FmPortalTooltip>

                    {/* Remove */}
                    <FmPortalTooltip content={t('orgStaff.remove')}>
                      <FmCommonIconButton
                        variant='destructive'
                        icon={Trash2}
                        onClick={() => setRemoveConfirm(staffMember.id)}
                        aria-label={t('orgStaff.remove')}
                      />
                    </FmPortalTooltip>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </FmFormSection>

      {/* Remove Confirmation */}
      <FmCommonConfirmDialog
        open={!!removeConfirm}
        onOpenChange={open => !open && setRemoveConfirm(null)}
        title={t('orgStaff.removeTitle')}
        description={t('orgStaff.removeConfirm')}
        confirmText={t('orgStaff.remove')}
        onConfirm={() => {
          if (removeConfirm) {
            removeStaff(removeConfirm);
            setRemoveConfirm(null);
          }
        }}
        variant='destructive'
      />
    </div>
  );
};
