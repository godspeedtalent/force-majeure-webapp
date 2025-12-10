import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Music2, ExternalLink, Settings, Link2, Unlink, Trash2, Clock, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@force-majeure/shared';
import { useAuth } from '@/features/auth/services/AuthContext';
import { logger } from '@force-majeure/shared';
import { FmCommonButton } from '@/components/common/buttons/FmCommonButton';
import { Card, CardContent } from '@/components/common/shadcn/card';
import { Button } from '@/components/common/shadcn/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/common/shadcn/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/common/shadcn/alert-dialog';
import { FmArtistSearchDropdown } from '@/components/common/search/FmArtistSearchDropdown';

interface LinkedArtist {
  id: string;
  name: string;
  image_url: string | null;
  bio: string | null;
  genre: string | null;
}

interface UserRequest {
  id: string;
  request_type: 'link_artist' | 'delete_data' | 'unlink_artist';
  status: 'pending' | 'approved' | 'denied';
  parameters: Record<string, unknown> | null;
  denial_reason: string | null;
  created_at: string;
  resolved_at: string | null;
}

export function UserArtistTab() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Modal states
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedArtistToLink, setSelectedArtistToLink] = useState<{ id: string; name: string } | null>(null);

  // Fetch linked artist
  const { data: linkedArtist, isLoading: loadingArtist } = useQuery({
    queryKey: ['user-linked-artist', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('artists')
        .select('id, name, image_url, bio, genre')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        logger.error('Failed to fetch linked artist', { error: error.message, userId: user.id });
        throw error;
      }

      return data as LinkedArtist | null;
    },
    enabled: !!user?.id,
  });

  // Fetch pending requests
  const { data: pendingRequests = [], isLoading: loadingRequests } = useQuery({
    queryKey: ['user-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('user_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Failed to fetch user requests', { error: error.message, userId: user.id });
        throw error;
      }

      return (data || []) as UserRequest[];
    },
    enabled: !!user?.id,
  });

  // Check for pending delete request
  const pendingDeleteRequest = pendingRequests.find(
    r => r.request_type === 'delete_data' && r.status === 'pending'
  );

  // Check for pending link request
  const pendingLinkRequest = pendingRequests.find(
    r => r.request_type === 'link_artist' && r.status === 'pending'
  );

  // Create link artist request mutation
  const linkArtistMutation = useMutation({
    mutationFn: async (artistId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_requests')
        .insert({
          user_id: user.id,
          request_type: 'link_artist',
          status: 'pending',
          parameters: { artist_id: artistId },
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Link request submitted. An admin will review your request.');
      queryClient.invalidateQueries({ queryKey: ['user-requests', user?.id] });
      setShowLinkModal(false);
      setSelectedArtistToLink(null);
    },
    onError: (error) => {
      logger.error('Failed to create link request', { error });
      toast.error('Failed to submit link request. Please try again.');
    },
  });

  // Create unlink artist request mutation
  const unlinkArtistMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !linkedArtist?.id) throw new Error('No linked artist');

      // Direct unlink - no admin approval needed
      const { error } = await supabase
        .from('artists')
        .update({ user_id: null })
        .eq('id', linkedArtist.id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Artist account unlinked successfully.');
      queryClient.invalidateQueries({ queryKey: ['user-linked-artist', user?.id] });
      setShowUnlinkConfirm(false);
    },
    onError: (error) => {
      logger.error('Failed to unlink artist', { error });
      toast.error('Failed to unlink artist. Please try again.');
    },
  });

  // Create delete data request mutation
  const deleteDataMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('user_requests')
        .insert({
          user_id: user.id,
          request_type: 'delete_data',
          status: 'pending',
          parameters: { artist_id: linkedArtist?.id || null },
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Data deletion request submitted. An admin will process your request within a few days.');
      queryClient.invalidateQueries({ queryKey: ['user-requests', user?.id] });
      setShowDeleteConfirm(false);
    },
    onError: (error) => {
      logger.error('Failed to create delete request', { error });
      toast.error('Failed to submit deletion request. Please try again.');
    },
  });

  const isLoading = loadingArtist || loadingRequests;

  if (isLoading) {
    return (
      <div className='flex items-center justify-center gap-3 py-12'>
        <Loader2 className='h-5 w-5 animate-spin text-fm-gold' />
        <span className='text-muted-foreground'>Loading artist information...</span>
      </div>
    );
  }

  // Show pending deletion state
  if (pendingDeleteRequest) {
    return (
      <div className='space-y-6'>
        <Card className='border-fm-danger/30 bg-fm-danger/5'>
          <CardContent className='p-6'>
            <div className='flex items-start gap-4'>
              <div className='p-3 bg-fm-danger/10 rounded-none'>
                <Clock className='h-6 w-6 text-fm-danger' />
              </div>
              <div className='flex-1'>
                <h3 className='font-canela text-lg font-medium text-fm-danger mb-2'>
                  Pending Data Deletion
                </h3>
                <p className='text-muted-foreground text-sm mb-4'>
                  Your data deletion request is being reviewed by an admin. Your artist data will be removed within a few business days.
                </p>
                <p className='text-xs text-muted-foreground'>
                  Requested on {new Date(pendingDeleteRequest.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show linked artist
  if (linkedArtist) {
    return (
      <div className='space-y-6'>
        {/* Artist Card */}
        <Card className='border-border/30 bg-card/10 backdrop-blur-sm overflow-hidden'>
          <CardContent className='p-0'>
            <div className='flex gap-6'>
              {/* Artist Image */}
              <div className='w-32 h-32 flex-shrink-0'>
                {linkedArtist.image_url ? (
                  <img
                    src={linkedArtist.image_url}
                    alt={linkedArtist.name}
                    className='w-full h-full object-cover'
                  />
                ) : (
                  <div className='w-full h-full bg-gradient-gold flex items-center justify-center'>
                    <Music2 className='h-12 w-12 text-black' />
                  </div>
                )}
              </div>

              {/* Artist Info */}
              <div className='flex-1 py-4 pr-4'>
                <h3 className='font-canela text-xl font-medium mb-1'>{linkedArtist.name}</h3>
                {linkedArtist.genre && (
                  <p className='text-sm text-muted-foreground mb-2'>{linkedArtist.genre}</p>
                )}
                {linkedArtist.bio && (
                  <p className='text-sm text-muted-foreground line-clamp-2'>{linkedArtist.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className='flex flex-wrap gap-3'>
          <FmCommonButton
            variant='default'
            size='sm'
            icon={ExternalLink}
            onClick={() => navigate(`/artists/${linkedArtist.id}`)}
          >
            View Artist Page
          </FmCommonButton>

          <FmCommonButton
            variant='secondary'
            size='sm'
            icon={Settings}
            onClick={() => navigate(`/artists/${linkedArtist.id}/manage`)}
          >
            Manage Artist
          </FmCommonButton>

          <FmCommonButton
            variant='secondary'
            size='sm'
            icon={Unlink}
            onClick={() => setShowUnlinkConfirm(true)}
          >
            Unlink Account
          </FmCommonButton>

          <FmCommonButton
            variant='destructive'
            size='sm'
            icon={Trash2}
            onClick={() => setShowDeleteConfirm(true)}
          >
            Request Data Deletion
          </FmCommonButton>
        </div>

        {/* Unlink Confirmation Dialog */}
        <AlertDialog open={showUnlinkConfirm} onOpenChange={setShowUnlinkConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unlink Artist Account?</AlertDialogTitle>
              <AlertDialogDescription>
                This will disconnect your user account from the artist profile "{linkedArtist.name}".
                Your artist data will remain intact and can be re-linked later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => unlinkArtistMutation.mutate()}
                disabled={unlinkArtistMutation.isPending}
              >
                {unlinkArtistMutation.isPending ? 'Unlinking...' : 'Unlink'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Delete Data Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className='text-fm-danger'>Request Data Deletion?</AlertDialogTitle>
              <AlertDialogDescription className='space-y-2'>
                <p>
                  This will submit a request to permanently delete your artist profile and all associated data.
                  This action cannot be undone.
                </p>
                <p className='text-muted-foreground'>
                  An admin will review your request and process the deletion within a few business days.
                </p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteDataMutation.mutate()}
                disabled={deleteDataMutation.isPending}
                className='bg-fm-danger hover:bg-fm-danger/90'
              >
                {deleteDataMutation.isPending ? 'Submitting...' : 'Request Deletion'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }

  // No linked artist - show link option
  return (
    <div className='space-y-6'>
      {/* Pending Link Request Banner */}
      {pendingLinkRequest && (
        <Card className='border-fm-gold/30 bg-fm-gold/5'>
          <CardContent className='p-4'>
            <div className='flex items-center gap-3'>
              <Clock className='h-5 w-5 text-fm-gold' />
              <div>
                <p className='text-sm font-medium'>Link Request Pending</p>
                <p className='text-xs text-muted-foreground'>
                  Your request to link an artist account is being reviewed by an admin.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Request History */}
      {pendingRequests.filter(r => r.status !== 'pending').length > 0 && (
        <div className='space-y-2'>
          <h4 className='text-sm font-medium text-muted-foreground'>Recent Requests</h4>
          {pendingRequests
            .filter(r => r.status !== 'pending')
            .slice(0, 3)
            .map(request => (
              <Card key={request.id} className='border-border/20 bg-card/5'>
                <CardContent className='p-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2'>
                      {request.status === 'approved' ? (
                        <CheckCircle2 className='h-4 w-4 text-green-500' />
                      ) : (
                        <AlertCircle className='h-4 w-4 text-fm-danger' />
                      )}
                      <span className='text-sm'>
                        {request.request_type === 'link_artist' && 'Artist Link Request'}
                        {request.request_type === 'unlink_artist' && 'Artist Unlink Request'}
                        {request.request_type === 'delete_data' && 'Data Deletion Request'}
                      </span>
                    </div>
                    <span className={`text-xs ${request.status === 'approved' ? 'text-green-500' : 'text-fm-danger'}`}>
                      {request.status === 'approved' ? 'Approved' : 'Denied'}
                    </span>
                  </div>
                  {request.denial_reason && (
                    <p className='text-xs text-muted-foreground mt-1 ml-6'>
                      Reason: {request.denial_reason}
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      {/* Empty State */}
      <Card className='border-border/30 bg-card/10 backdrop-blur-sm'>
        <CardContent className='p-12 text-center'>
          <Music2 className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
          <h3 className='font-canela text-xl font-medium mb-2'>No Artist Account Linked</h3>
          <p className='text-muted-foreground text-sm mb-6 max-w-md mx-auto'>
            Link your user account to an existing artist profile to manage your artist page,
            view analytics, and more.
          </p>

          <FmCommonButton
            variant='outline'
            icon={Link2}
            onClick={() => setShowLinkModal(true)}
            disabled={!!pendingLinkRequest}
          >
            {pendingLinkRequest ? 'Request Pending' : 'Link Artist Account'}
          </FmCommonButton>
        </CardContent>
      </Card>

      {/* Link Artist Modal */}
      <Dialog open={showLinkModal} onOpenChange={setShowLinkModal}>
        <DialogContent className='max-w-md'>
          <DialogHeader>
            <DialogTitle>Link Artist Account</DialogTitle>
            <DialogDescription>
              Search for your artist profile and submit a request to link it to your account.
              An admin will review and approve your request.
            </DialogDescription>
          </DialogHeader>

          <div className='py-4'>
            <FmArtistSearchDropdown
              value={selectedArtistToLink?.id || null}
              onChange={(id, artist) => {
                if (artist) {
                  setSelectedArtistToLink({ id: artist.id, name: artist.name });
                } else {
                  setSelectedArtistToLink(null);
                }
              }}
              placeholder='Search for your artist profile...'
              // Filter to only show artists without a user_id
              additionalFilters={[{ column: 'user_id', operator: 'is', value: null }]}
            />

            {selectedArtistToLink && (
              <div className='mt-4 p-3 bg-fm-gold/10 border border-fm-gold/20 rounded-none'>
                <p className='text-sm'>
                  You're requesting to link: <strong>{selectedArtistToLink.name}</strong>
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant='outline' onClick={() => setShowLinkModal(false)}>
              Cancel
            </Button>
            <Button
              variant='outline'
              onClick={() => selectedArtistToLink && linkArtistMutation.mutate(selectedArtistToLink.id)}
              disabled={!selectedArtistToLink || linkArtistMutation.isPending}
            >
              {linkArtistMutation.isPending ? 'Submitting...' : 'Submit Request'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
