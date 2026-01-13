import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Users,
  User,
  Building2,
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
import { FmOrganizationSearchDropdown } from '@/components/common/search/FmOrganizationSearchDropdown';
import { useEventStaff } from './hooks/useEventStaff';
import type { EventStaffRole, EventStaffWithDetails } from '@/shared/types/eventStaff';
import { cn } from '@/shared';

interface EventStaffingManagementProps {
  eventId: string;
}

type AddMode = 'user' | 'organization';

export const EventStaffingManagement = ({ eventId }: EventStaffingManagementProps) => {
  const { t } = useTranslation('common');

  const {
    staff,
    isLoading,
    addUserStaff,
    addOrgStaff,
    updateStaffRole,
    removeStaff,
    isAddingUser,
    isAddingOrg,
  } = useEventStaff(eventId);

  // Add staff form state
  const [addMode, setAddMode] = useState<AddMode>('user');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<EventStaffRole>('staff');

  // Confirm dialog state
  const [removeConfirm, setRemoveConfirm] = useState<string | null>(null);

  const handleAddStaff = () => {
    if (addMode === 'user' && selectedUserId) {
      addUserStaff(
        { userId: selectedUserId, role: selectedRole },
        {
          onSuccess: () => {
            setSelectedUserId('');
          },
        }
      );
    } else if (addMode === 'organization' && selectedOrgId) {
      addOrgStaff(
        { organizationId: selectedOrgId, role: selectedRole },
        {
          onSuccess: () => {
            setSelectedOrgId('');
          },
        }
      );
    }
  };

  const handleRoleToggle = (staffMember: EventStaffWithDetails) => {
    const newRole: EventStaffRole = staffMember.role === 'staff' ? 'manager' : 'staff';
    updateStaffRole({ staffId: staffMember.id, role: newRole });
  };

  const getStaffDisplayName = (staffMember: EventStaffWithDetails): string => {
    if (staffMember.profiles) {
      return staffMember.profiles.full_name || staffMember.profiles.display_name || t('staffing.unknownUser');
    }
    if (staffMember.organizations) {
      return staffMember.organizations.name;
    }
    return t('staffing.unknown');
  };

  const getStaffAvatar = (staffMember: EventStaffWithDetails): string | null => {
    if (staffMember.profiles) {
      return staffMember.profiles.avatar_url;
    }
    if (staffMember.organizations) {
      return staffMember.organizations.profile_picture;
    }
    return null;
  };

  const isUser = (staffMember: EventStaffWithDetails): boolean => {
    return staffMember.user_id !== null;
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
        title={t('staffing.addStaff')}
        description={t('staffing.addStaffDescription')}
        icon={Plus}
      >
        <div className='space-y-4'>
          {/* Mode Selector */}
          <div className='flex gap-2'>
            <button
              type='button'
              onClick={() => setAddMode('user')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 p-3 border transition-all',
                addMode === 'user'
                  ? 'border-fm-gold bg-fm-gold/20 text-fm-gold'
                  : 'border-white/20 hover:border-white/40'
              )}
            >
              <User className='h-4 w-4' />
              <span>{t('staffing.addUser')}</span>
            </button>
            <button
              type='button'
              onClick={() => setAddMode('organization')}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 p-3 border transition-all',
                addMode === 'organization'
                  ? 'border-fm-gold bg-fm-gold/20 text-fm-gold'
                  : 'border-white/20 hover:border-white/40'
              )}
            >
              <Building2 className='h-4 w-4' />
              <span>{t('staffing.addOrganization')}</span>
            </button>
          </div>

          {/* Search Input */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div>
              {addMode === 'user' ? (
                <FmUserSearchDropdown
                  value={selectedUserId}
                  onChange={(value) => setSelectedUserId(value)}
                  placeholder={t('staffing.searchUser')}
                />
              ) : (
                <FmOrganizationSearchDropdown
                  value={selectedOrgId}
                  onChange={(value) => setSelectedOrgId(value)}
                  placeholder={t('staffing.searchOrg')}
                />
              )}
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
                <span>{t('staffing.roleStaff')}</span>
              </button>
              <button
                type='button'
                onClick={() => setSelectedRole('manager')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 p-3 border transition-all',
                  selectedRole === 'manager'
                    ? 'border-fm-gold bg-fm-gold/20 text-fm-gold'
                    : 'border-white/20 hover:border-white/40'
                )}
              >
                <Shield className='h-4 w-4' />
                <span>{t('staffing.roleManager')}</span>
              </button>
            </div>
          </div>

          {/* Role Descriptions */}
          <div className='text-xs text-muted-foreground'>
            {selectedRole === 'staff' ? t('staffing.staffDescription') : t('staffing.managerDescription')}
          </div>

          {/* Add Button */}
          <FmCommonButton
            variant='gold'
            icon={Plus}
            onClick={handleAddStaff}
            disabled={
              (addMode === 'user' && !selectedUserId) ||
              (addMode === 'organization' && !selectedOrgId)
            }
            loading={isAddingUser || isAddingOrg}
          >
            {t('staffing.addToEvent')}
          </FmCommonButton>
        </div>
      </FmFormSection>

      {/* Staff List */}
      <FmFormSection
        title={t('staffing.title')}
        description={t('staffing.listDescription')}
        icon={Users}
      >
        {staff.length === 0 ? (
          <div className='text-center py-12 border border-dashed border-white/20'>
            <Users className='h-12 w-12 mx-auto text-muted-foreground/50 mb-4' />
            <p className='text-muted-foreground'>{t('staffing.noStaff')}</p>
            <p className='text-sm text-muted-foreground/70 mt-1'>
              {t('staffing.noStaffHint')}
            </p>
          </div>
        ) : (
          <div className='space-y-2'>
            {staff.map((staffMember, index) => {
              const avatar = getStaffAvatar(staffMember);
              const name = getStaffDisplayName(staffMember);
              const isUserType = isUser(staffMember);

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
                        {isUserType ? (
                          <User className='h-5 w-5 text-white/50' />
                        ) : (
                          <Building2 className='h-5 w-5 text-white/50' />
                        )}
                      </div>
                    )}

                    <div>
                      <div className='flex items-center gap-2'>
                        <p className='font-medium'>{name}</p>
                        {/* Type Badge */}
                        <span className='px-2 py-0.5 text-xs uppercase bg-white/10 border border-white/20'>
                          {isUserType ? (
                            <span className='flex items-center gap-1'>
                              <User className='h-3 w-3' />
                              {t('staffing.user')}
                            </span>
                          ) : (
                            <span className='flex items-center gap-1'>
                              <Building2 className='h-3 w-3' />
                              {t('staffing.organization')}
                            </span>
                          )}
                        </span>
                      </div>
                      <p className='text-sm text-muted-foreground'>
                        {t('staffing.addedOn', {
                          date: new Date(staffMember.created_at).toLocaleDateString(),
                        })}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className='flex items-center gap-3'>
                    {/* Role Badge (clickable to toggle) */}
                    <FmPortalTooltip content={t('staffing.clickToChangeRole')}>
                      <button
                        onClick={() => handleRoleToggle(staffMember)}
                        className={cn(
                          'flex items-center gap-1.5 px-3 py-1.5 text-sm uppercase transition-all border',
                          staffMember.role === 'manager'
                            ? 'bg-fm-gold/20 text-fm-gold border-fm-gold/40 hover:bg-fm-gold/30'
                            : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                        )}
                      >
                        {staffMember.role === 'manager' ? (
                          <Shield className='h-3.5 w-3.5' />
                        ) : (
                          <UserCog className='h-3.5 w-3.5' />
                        )}
                        {staffMember.role === 'manager'
                          ? t('staffing.roleManager')
                          : t('staffing.roleStaff')}
                      </button>
                    </FmPortalTooltip>

                    {/* Remove */}
                    <FmPortalTooltip content={t('staffing.remove')}>
                      <FmCommonIconButton
                        variant='destructive'
                        icon={Trash2}
                        onClick={() => setRemoveConfirm(staffMember.id)}
                        aria-label={t('staffing.remove')}
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
        title={t('staffing.removeTitle')}
        description={t('staffing.removeConfirm')}
        confirmText={t('staffing.remove')}
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
