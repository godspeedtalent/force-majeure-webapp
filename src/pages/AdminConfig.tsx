import { Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { ForceMajeureRootLayout } from '@/components/layout/ForceMajeureRootLayout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useUserRole } from '@/shared/hooks/useUserRole';

export default function AdminConfig() {
  const navigate = useNavigate();
  const { data: role, isLoading } = useUserRole();

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-background'>
        <Loader2 className='w-8 h-8 animate-spin text-fm-gold' />
      </div>
    );
  }

  if (role !== 'admin') {
    navigate('/');
    return null;
  }

  return (
    <ForceMajeureRootLayout>
      <div className='container mx-auto px-4 py-8 max-w-4xl'>
        <h1 className='text-4xl font-canela font-bold mb-8'>
          Admin Configuration
        </h1>

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
