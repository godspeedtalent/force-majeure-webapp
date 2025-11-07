import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ForceMajeureRootLayout } from '@/components/layout/ForceMajeureRootLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/common/shadcn/card';
import { useUserPermissions } from '@/shared/hooks/useUserRole';
import { ROLES } from '@/shared/auth/permissions';

export default function AdminConfig() {
  const navigate = useNavigate();
  const { hasRole, roles } = useUserPermissions();
  const isLoading = !roles;

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <Loader2 className='w-8 h-8 animate-spin text-fm-gold' />
      </div>
    );
  }

  if (!hasRole(ROLES.ADMIN)) {
    navigate('/');
    return null;
  }

  return (
    <ForceMajeureRootLayout>
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        <h1 className='text-4xl font-canela mb-8'>Admin Configuration</h1>

        <Card>
          <CardHeader>
            <CardTitle>Site Settings</CardTitle>
            <CardDescription>
              Manage your site configuration and features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className='text-muted-foreground'>
              Admin configuration panel - coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </ForceMajeureRootLayout>
  );
}
